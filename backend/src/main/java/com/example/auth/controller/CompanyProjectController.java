package com.example.auth.controller;

import java.time.LocalDateTime;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth.model.CompanyProject;
import com.example.auth.model.ProjectStatus;
import com.example.auth.model.User;
import com.example.auth.repository.CompanyProjectRepository;
import com.example.auth.repository.UserRepository;

@RestController
@RequestMapping("/api/company-projects")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CompanyProjectController {
    
    @Autowired
    private CompanyProjectRepository companyProjectRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @GetMapping("/my-projects")
    public ResponseEntity<?> getMyProjects(Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();
            
            // For company users, username is the company name, so find by username
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            User user = userOpt.get();
            List<CompanyProject> projects = companyProjectRepository.findByCompanyIdOrderByCreatedAtDesc(user.getId());
            
            return ResponseEntity.ok(projects);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching projects");
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody CompanyProject project, Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            User user = userOpt.get();
            // Only save the allowed fields
            CompanyProject newProject = new CompanyProject();
            newProject.setTitle(project.getTitle());
            newProject.setProjectType(project.getProjectType());
            newProject.setShortDescription(project.getShortDescription());
            newProject.setDetailedDescription(project.getDetailedDescription());
            newProject.setTechnologiesUsed(project.getTechnologiesUsed());
            newProject.setIndustryDomain(project.getIndustryDomain());
            newProject.setObjective(project.getObjective());
            newProject.setMediaLinks(project.getMediaLinks());
            newProject.setDemoLink(project.getDemoLink());
            newProject.setCompany(user);
            newProject.setCompanyId(user.getId());
            newProject.setCreatedAt(LocalDateTime.now());
            newProject.setStatus(ProjectStatus.OPEN);
            CompanyProject savedProject = companyProjectRepository.save(newProject);
            return ResponseEntity.ok(savedProject);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating project");
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(@PathVariable Long id, @RequestBody CompanyProject projectUpdate, Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            User user = userOpt.get();
            Optional<CompanyProject> projectOpt = companyProjectRepository.findById(id);
            if (projectOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Project not found");
            }
            
            CompanyProject project = projectOpt.get();
            if (!project.getCompanyId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized to update this project");
            }
            
            // Update only allowed fields
            project.setTitle(projectUpdate.getTitle());
            project.setProjectType(projectUpdate.getProjectType());
            project.setShortDescription(projectUpdate.getShortDescription());
            project.setDetailedDescription(projectUpdate.getDetailedDescription());
            project.setTechnologiesUsed(projectUpdate.getTechnologiesUsed());
            project.setIndustryDomain(projectUpdate.getIndustryDomain());
            project.setObjective(projectUpdate.getObjective());
            project.setMediaLinks(projectUpdate.getMediaLinks());
            project.setDemoLink(projectUpdate.getDemoLink());
            project.setUpdatedAt(LocalDateTime.now());
            
            CompanyProject savedProject = companyProjectRepository.save(project);
            return ResponseEntity.ok(savedProject);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating project");
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id, Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            User user = userOpt.get();
            Optional<CompanyProject> projectOpt = companyProjectRepository.findById(id);
            if (projectOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Project not found");
            }
            
            CompanyProject project = projectOpt.get();
            if (!project.getCompanyId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized to delete this project");
            }
            
            companyProjectRepository.delete(project);
            return ResponseEntity.ok("Project deleted successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting project");
        }
    }
    
    @GetMapping("/dashboard-stats")
    public ResponseEntity<?> getDashboardStats(Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            User user = userOpt.get();
            Long companyId = user.getId();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalProjects", companyProjectRepository.countByCompanyId(companyId));
            stats.put("openProjects", companyProjectRepository.countByCompanyIdAndStatus(companyId, ProjectStatus.OPEN));
            stats.put("inProgressProjects", companyProjectRepository.countByCompanyIdAndStatus(companyId, ProjectStatus.IN_PROGRESS));
            stats.put("completedProjects", companyProjectRepository.countByCompanyIdAndStatus(companyId, ProjectStatus.COMPLETED));
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching dashboard stats");
        }
    }
    
    @GetMapping("/public")
    public ResponseEntity<?> getPublicProjects() {
        try {
            List<CompanyProject> projects = companyProjectRepository.findByStatusOrderByCreatedAtDesc(ProjectStatus.OPEN);
            return ResponseEntity.ok(projects);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching public projects");
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getProject(@PathVariable Long id) {
        try {
            Optional<CompanyProject> projectOpt = companyProjectRepository.findById(id);
            if (projectOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Project not found");
            }
            
            return ResponseEntity.ok(projectOpt.get());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching project");
        }
    }
}
