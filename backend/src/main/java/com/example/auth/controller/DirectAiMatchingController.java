package com.example.auth.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth.model.Project;
import com.example.auth.repository.ProjectRepository;
import com.example.auth.service.AiMatchingService;
import com.example.auth.service.NotificationService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4201", "http://localhost:4202"})
public class DirectAiMatchingController {

    @Autowired
    private AiMatchingService aiMatchingService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private ProjectRepository projectRepository;

    @PostMapping("/ai-matching")
    public ResponseEntity<?> directAiMatching(@RequestBody Map<String, Object> projectData) {
        try {
            // Get current user info if available
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String currentUsername = auth != null ? auth.getName() : "anonymous";
            
            // Get all projects from database for real matching
            List<Project> allProjects = projectRepository.findAll();
            
            // Extract project details from input
            String inputName = (String) projectData.get("name");
            String inputDomain = (String) projectData.get("domain");
            String inputTechnologies = (String) projectData.get("technologiesUsed");
            String inputDescription = (String) projectData.get("description");
            
            // Find matching projects based on domain and technologies
            List<Map<String, Object>> matches = new ArrayList<>();
            
            for (Project project : allProjects) {
                // Skip if it's the same user's project (if user is authenticated)
                if (!currentUsername.equals("anonymous") && 
                    currentUsername.equals(project.getCreatorUsername())) {
                    continue;
                }
                
                // Calculate match score based on similarity
                double matchScore = calculateMatchScore(
                    inputDomain, inputTechnologies, inputDescription,
                    project.getDomain(), project.getTechnologiesUsed(), project.getDescription()
                );
                
                // Only include if match score is above threshold (50%)
                if (matchScore >= 50) {
                    Map<String, Object> match = new HashMap<>();
                    match.put("id", project.getId());
                    match.put("title", project.getName());
                    match.put("domain", project.getDomain());
                    match.put("description", project.getDescription());
                    match.put("technologies", project.getTechnologiesUsed());
                    match.put("creator", project.getCreatorUsername());
                    match.put("matchScore", (int) matchScore);
                    match.put("createdAt", project.getCreatedAt());
                    matches.add(match);
                    
                    // Send notification to both users about the match
                    sendMatchNotifications(currentUsername, inputName, project, matchScore);
                }
            }
            
            // Sort matches by score (descending)
            matches.sort((a, b) -> Integer.compare((Integer) b.get("matchScore"), (Integer) a.get("matchScore")));
            
            // Limit to top 10 matches
            if (matches.size() > 10) {
                matches = matches.subList(0, 10);
            }
            
            // Only return real matches from database - no fake users
            return ResponseEntity.ok(matches);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "AI matching failed: " + e.getMessage()));
        }
    }
    
    private double calculateMatchScore(String inputDomain, String inputTech, String inputDesc,
                                     String projectDomain, String projectTech, String projectDesc) {
        double score = 0.0;
        
        // Domain matching (40% weight)
        if (inputDomain != null && projectDomain != null) {
            if (inputDomain.equalsIgnoreCase(projectDomain)) {
                score += 40;
            } else if (inputDomain.toLowerCase().contains(projectDomain.toLowerCase()) ||
                      projectDomain.toLowerCase().contains(inputDomain.toLowerCase())) {
                score += 20;
            }
        }
        
        // Technology matching (35% weight)
        if (inputTech != null && projectTech != null) {
            String[] inputTechArray = inputTech.toLowerCase().split("[,\\s]+");
            String[] projectTechArray = projectTech.toLowerCase().split("[,\\s]+");
            
            int commonTech = 0;
            for (String tech1 : inputTechArray) {
                for (String tech2 : projectTechArray) {
                    if (tech1.contains(tech2) || tech2.contains(tech1)) {
                        commonTech++;
                        break;
                    }
                }
            }
            
            if (commonTech > 0) {
                score += (35.0 * commonTech) / Math.max(inputTechArray.length, projectTechArray.length);
            }
        }
        
        // Description similarity (25% weight)
        if (inputDesc != null && projectDesc != null) {
            String[] inputWords = inputDesc.toLowerCase().split("\\s+");
            String[] projectWords = projectDesc.toLowerCase().split("\\s+");
            
            int commonWords = 0;
            for (String word1 : inputWords) {
                if (word1.length() > 3) { // Only consider meaningful words
                    for (String word2 : projectWords) {
                        if (word1.equals(word2)) {
                            commonWords++;
                            break;
                        }
                    }
                }
            }
            
            if (commonWords > 0) {
                score += (25.0 * commonWords) / Math.max(inputWords.length, projectWords.length);
            }
        }
        
        return Math.min(score, 100); // Cap at 100%
    }
    
    private void sendMatchNotifications(String currentUsername, String inputProjectName, 
                                      Project matchedProject, double matchScore) {
        try {
            // Create notification for the matched project's creator
            if (matchedProject.getCreatorUsername() != null) {
                String title = "New Project Match Found!";
                String message = String.format(
                    "Your project '%s' has been matched with '%s' (%.0f%% similarity). Creator: %s",
                    matchedProject.getName(),
                    inputProjectName != null ? inputProjectName : "Unnamed Project",
                    matchScore,
                    currentUsername.equals("anonymous") ? "Anonymous User" : currentUsername
                );
                
                notificationService.createNotificationByUsername(
                    matchedProject.getCreatorUsername(), 
                    title, 
                    message, 
                    "PROJECT_MATCH"
                );
            }
            
            // Create notification for the current user (if authenticated)
            if (!currentUsername.equals("anonymous")) {
                String title = "Project Match Found!";
                String message = String.format(
                    "Found a matching project: '%s' (%.0f%% similarity). Creator: %s",
                    matchedProject.getName(),
                    matchScore,
                    matchedProject.getCreatorUsername() != null ? matchedProject.getCreatorUsername() : "Unknown"
                );
                
                notificationService.createNotificationByUsername(
                    currentUsername, 
                    title, 
                    message, 
                    "PROJECT_MATCH"
                );
            }
            
        } catch (Exception e) {
            System.err.println("Error sending match notifications: " + e.getMessage());
        }
    }
}
