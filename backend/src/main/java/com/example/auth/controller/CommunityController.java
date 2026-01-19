package com.example.auth.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth.model.Community;
import com.example.auth.model.CommunityMembership;
import com.example.auth.model.MembershipRole;
import com.example.auth.model.Role;
import com.example.auth.model.User;
import com.example.auth.repository.CommunityMembershipRepository;
import com.example.auth.repository.CommunityRepository;
import com.example.auth.repository.UserRepository;

@RestController
@RequestMapping("/api/communities")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CommunityController {
    
    @Autowired
    private CommunityRepository communityRepository;
    
    @Autowired
    private CommunityMembershipRepository membershipRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @GetMapping("/public")
    public ResponseEntity<?> getPublicCommunities() {
        try {
            List<Community> communities = communityRepository.findByIsPublicTrue();
            
            // Add member count to each community
            List<Map<String, Object>> communitiesWithStats = communities.stream().map(community -> {
                Map<String, Object> communityData = new HashMap<>();
                communityData.put("id", community.getId());
                communityData.put("name", community.getName());
                communityData.put("description", community.getDescription());
                communityData.put("companyId", community.getCompanyId());
                communityData.put("companyName", community.getCompanyName());
                communityData.put("isPublic", community.isPublic());
                communityData.put("createdAt", community.getCreatedAt());
                communityData.put("memberCount", communityRepository.countActiveMembers(community.getId()));
                return communityData;
            }).toList();
            
            return ResponseEntity.ok(communitiesWithStats);
        } catch (Exception e) {
            System.err.println("Error fetching public communities: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error fetching communities"));
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<?> searchCommunities(@RequestParam String keyword) {
        try {
            List<Community> communities = communityRepository.searchPublicCommunities(keyword);
            return ResponseEntity.ok(communities);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error searching communities"));
        }
    }
    
    @PostMapping("/create")
    public ResponseEntity<?> createCommunity(@RequestBody Map<String, String> request, Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByEmail(username);
            }
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
            }
            
            User user = userOpt.get();
            if (user.getRole() != Role.COMPANY) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only companies can create communities"));
            }
            
            String name = request.get("name");
            String description = request.get("description");
            boolean isPublic = Boolean.parseBoolean(request.getOrDefault("isPublic", "true"));
            
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Community name is required"));
            }
            
            Community community = new Community();
            community.setName(name.trim());
            community.setDescription(description != null ? description.trim() : "");
            community.setCompany(user);
            community.setCompanyId(user.getId());
            community.setCompanyName(user.getCompanyName());
            community.setPublic(isPublic);
            
            Community savedCommunity = communityRepository.save(community);
            
            // Automatically add the company as admin member
            CommunityMembership membership = new CommunityMembership();
            membership.setUser(user);
            membership.setUserId(user.getId());
            membership.setUsername(user.getUsername());
            membership.setCommunity(savedCommunity);
            membership.setCommunityId(savedCommunity.getId());
            membership.setRole(MembershipRole.ADMIN);
            membershipRepository.save(membership);
            
            System.out.println("Community created: " + savedCommunity.getName() + " by " + user.getCompanyName());
            
            return ResponseEntity.ok(Map.of(
                "message", "Community created successfully",
                "communityId", savedCommunity.getId(),
                "communityName", savedCommunity.getName()
            ));
        } catch (Exception e) {
            System.err.println("Error creating community: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error creating community"));
        }
    }
    
    @PostMapping("/{communityId}/join")
    public ResponseEntity<?> joinCommunity(@PathVariable Long communityId, Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByEmail(username);
            }
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
            }
            
            User user = userOpt.get();
            
            Optional<Community> communityOpt = communityRepository.findByIdAndIsPublicTrue(communityId);
            if (communityOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Community not found or not public"));
            }
            
            Community community = communityOpt.get();
            
            // Check if user is already a member
            if (membershipRepository.existsByUserIdAndCommunityIdAndIsActiveTrue(user.getId(), communityId)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Already a member of this community"));
            }
            
            // Create membership
            CommunityMembership membership = new CommunityMembership();
            membership.setUser(user);
            membership.setUserId(user.getId());
            membership.setUsername(user.getUsername());
            membership.setCommunity(community);
            membership.setCommunityId(communityId);
            membership.setRole(MembershipRole.MEMBER);
            membershipRepository.save(membership);
            
            System.out.println("User " + user.getUsername() + " joined community " + community.getName());
            
            return ResponseEntity.ok(Map.of(
                "message", "Successfully joined community",
                "communityName", community.getName()
            ));
        } catch (Exception e) {
            System.err.println("Error joining community: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error joining community"));
        }
    }
    
    @PostMapping("/{communityId}/leave")
    public ResponseEntity<?> leaveCommunity(@PathVariable Long communityId, Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByEmail(username);
            }
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
            }
            
            User user = userOpt.get();
            
            Optional<CommunityMembership> membershipOpt = membershipRepository.findByUserIdAndCommunityId(user.getId(), communityId);
            if (membershipOpt.isEmpty() || !membershipOpt.get().isActive()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Not a member of this community"));
            }
            
            CommunityMembership membership = membershipOpt.get();
            
            // Admin cannot leave their own community
            if (membership.getRole() == MembershipRole.ADMIN) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Community admin cannot leave. Transfer ownership or delete community."));
            }
            
            membership.setActive(false);
            membershipRepository.save(membership);
            
            System.out.println("User " + user.getUsername() + " left community " + communityId);
            
            return ResponseEntity.ok(Map.of("message", "Successfully left community"));
        } catch (Exception e) {
            System.err.println("Error leaving community: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error leaving community"));
        }
    }
    
    @GetMapping("/my-communities")
    public ResponseEntity<?> getMyMemberships(Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByEmail(username);
            }
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
            }
            
            User user = userOpt.get();
            List<CommunityMembership> memberships = membershipRepository.findByUserIdAndIsActiveTrue(user.getId());
            
            List<Map<String, Object>> communitiesData = memberships.stream().map(membership -> {
                Community community = membership.getCommunity();
                Map<String, Object> data = new HashMap<>();
                data.put("id", community.getId());
                data.put("name", community.getName());
                data.put("description", community.getDescription());
                data.put("companyName", community.getCompanyName());
                data.put("isPublic", community.isPublic());
                data.put("membershipRole", membership.getRole());
                data.put("joinedAt", membership.getJoinedAt());
                data.put("memberCount", communityRepository.countActiveMembers(community.getId()));
                return data;
            }).toList();
            
            return ResponseEntity.ok(communitiesData);
        } catch (Exception e) {
            System.err.println("Error fetching user memberships: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error fetching memberships"));
        }
    }
    
    @GetMapping("/company-community")
    public ResponseEntity<?> getCompanyCommunity(Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByEmail(username);
            }
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
            }
            
            User user = userOpt.get();
            if (user.getRole() != Role.COMPANY) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only companies can access their community"));
            }
            
            // Find the company's own community
            List<Community> companyCommunities = communityRepository.findByCompanyId(user.getId());
            if (companyCommunities.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Company community not found"));
            }
            
            Community companyCommunity = companyCommunities.get(0); // Get the first (main) community
            
            Map<String, Object> communityData = new HashMap<>();
            communityData.put("id", companyCommunity.getId());
            communityData.put("name", companyCommunity.getName());
            communityData.put("description", companyCommunity.getDescription());
            communityData.put("companyId", companyCommunity.getCompanyId());
            communityData.put("companyName", companyCommunity.getCompanyName());
            communityData.put("isPublic", companyCommunity.isPublic());
            communityData.put("createdAt", companyCommunity.getCreatedAt());
            communityData.put("memberCount", communityRepository.countActiveMembers(companyCommunity.getId()));
            
            return ResponseEntity.ok(communityData);
        } catch (Exception e) {
            System.err.println("Error fetching company community: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error fetching company community"));
        }
    }
    
    @GetMapping("/{communityId}/members")
    public ResponseEntity<?> getCommunityMembers(@PathVariable Long communityId, Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByEmail(username);
            }
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
            }
            
            User user = userOpt.get();
            
            // Check if user is a member of this community
            if (!membershipRepository.existsByUserIdAndCommunityIdAndIsActiveTrue(user.getId(), communityId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You must be a member to view community members"));
            }
            
            List<CommunityMembership> memberships = membershipRepository.findByCommunityIdAndIsActiveTrue(communityId);
            
            List<Map<String, Object>> membersData = memberships.stream().map(membership -> {
                Map<String, Object> data = new HashMap<>();
                data.put("id", membership.getId());
                data.put("userId", membership.getUserId());
                data.put("username", membership.getUsername());
                data.put("role", membership.getRole());
                data.put("joinedAt", membership.getJoinedAt());
                return data;
            }).toList();
            
            return ResponseEntity.ok(membersData);
        } catch (Exception e) {
            System.err.println("Error fetching community members: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error fetching members"));
        }
    }
}
