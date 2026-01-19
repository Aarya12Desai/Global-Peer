package com.example.auth.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.auth.model.Project;
import com.example.auth.repository.ProjectRepository;

@Service
public class ProjectMatchingService {
    
    private final ProjectRepository projectRepository;
    private final NotificationService notificationService;
    
    public ProjectMatchingService(ProjectRepository projectRepository, NotificationService notificationService) {
        this.projectRepository = projectRepository;
        this.notificationService = notificationService;
    }
    
    /**
     * Find matching projects for a newly created project and send notifications
     * Only sends notifications if there are actual matches above the threshold
     */
    public void findAndNotifyMatches(Project newProject) {
        // Get all existing projects except the newly created one
        List<Project> existingProjects = projectRepository.findAll().stream()
            .filter(project -> !project.getId().equals(newProject.getId()))
            .collect(Collectors.toList());
        
        if (existingProjects.isEmpty()) {
            System.out.println("No existing projects to match against for project: " + newProject.getName());
            return;
        }
        
        List<ProjectMatch> matches = findMatches(newProject, existingProjects);
        
        // Only proceed if there are matches above the threshold
        List<ProjectMatch> qualifiedMatches = matches.stream()
            .filter(match -> match.getSimilarityScore() > 0.6) // 60% similarity threshold
            .collect(Collectors.toList());
        
        if (qualifiedMatches.isEmpty()) {
            System.out.println("No qualifying matches found for project: " + newProject.getName());
            return;
        }
        
        System.out.println("Found " + qualifiedMatches.size() + " qualifying matches for project: " + newProject.getName());
        
        for (ProjectMatch match : qualifiedMatches) {
            sendMatchNotification(newProject, match.getMatchedProject(), match.getSimilarityScore());
        }
    }
    
    /**
     * Find similar projects using text similarity algorithms
     * Only includes projects with meaningful similarity scores
     */
    private List<ProjectMatch> findMatches(Project newProject, List<Project> existingProjects) {
        List<ProjectMatch> matches = new ArrayList<>();
        
        for (Project existing : existingProjects) {
            // Skip projects by the same user to avoid self-matching
            if (isSameUser(newProject, existing)) {
                continue;
            }
            
            double similarity = calculateSimilarity(newProject, existing);
            
            // Only include projects with at least 30% similarity
            if (similarity > 0.3) {
                matches.add(new ProjectMatch(existing, similarity));
                System.out.println("Found similarity of " + String.format("%.2f", similarity * 100) + 
                    "% between '" + newProject.getName() + "' and '" + existing.getName() + "'");
            }
        }
        
        return matches.stream()
                .sorted((a, b) -> Double.compare(b.getSimilarityScore(), a.getSimilarityScore()))
                .collect(Collectors.toList());
    }
    
    /**
     * Check if two projects are created by the same user
     */
    private boolean isSameUser(Project project1, Project project2) {
        // Check by userId first
        if (project1.getUserId() != null && project2.getUserId() != null) {
            return project1.getUserId().equals(project2.getUserId());
        }
        
        // Check by creatorUsername
        if (project1.getCreatorUsername() != null && project2.getCreatorUsername() != null) {
            return project1.getCreatorUsername().equals(project2.getCreatorUsername());
        }
        
        // Check by creator entity
        if (project1.getCreator() != null && project2.getCreator() != null) {
            return project1.getCreator().getId().equals(project2.getCreator().getId());
        }
        
        return false;
    }
    
    /**
     * Calculate similarity between two projects using multiple factors
     */
    private double calculateSimilarity(Project project1, Project project2) {
        double descriptionSim = calculateTextSimilarity(
            project1.getDescription() != null ? project1.getDescription() : "",
            project2.getDescription() != null ? project2.getDescription() : ""
        );
        
        double nameSim = calculateTextSimilarity(
            project1.getName() != null ? project1.getName() : "",
            project2.getName() != null ? project2.getName() : ""
        );
        
        double domainSim = project1.getDomain() != null && project2.getDomain() != null 
            && project1.getDomain().equalsIgnoreCase(project2.getDomain()) ? 1.0 : 0.0;

        double techSim = project1.getTechnologiesUsed() != null && project2.getTechnologiesUsed() != null 
            && project1.getTechnologiesUsed().equalsIgnoreCase(project2.getTechnologiesUsed()) ? 1.0 : 0.0;

        // Weighted combination
        return (descriptionSim * 0.5) + (nameSim * 0.3) + (domainSim * 0.1) + (techSim * 0.1);
    }
    
    /**
     * Calculate text similarity using Jaccard similarity with word tokenization
     */
    private double calculateTextSimilarity(String text1, String text2) {
        if (text1 == null || text2 == null || text1.trim().isEmpty() || text2.trim().isEmpty()) {
            return 0.0;
        }
        
        Set<String> words1 = tokenizeAndNormalize(text1);
        Set<String> words2 = tokenizeAndNormalize(text2);
        
        Set<String> intersection = new HashSet<>(words1);
        intersection.retainAll(words2);
        
        Set<String> union = new HashSet<>(words1);
        union.addAll(words2);
        
        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }
    
    /**
     * Tokenize text into words and normalize
     */
    private Set<String> tokenizeAndNormalize(String text) {
        return Arrays.stream(text.toLowerCase()
                .replaceAll("[^a-zA-Z0-9\\s]", "")
                .split("\\s+"))
                .filter(word -> word.length() > 2) // Filter out very short words
                .collect(Collectors.toSet());
    }
    
    /**
     * Send notification about project match to both users
     */
    private void sendMatchNotification(Project newProject, Project matchedProject, double similarity) {
        String similarityPercentage = String.format("%.0f", similarity * 100);
        
        // Notification to the existing project creator about the new matching project
        String messageToExistingUser = String.format(
            "🎯 Project Match Alert! Your project '%s' has a %s%% similarity with '%s' by %s. " +
            "This could be a great collaboration opportunity!",
            matchedProject.getName(),
            similarityPercentage,
            newProject.getName(),
            newProject.getCreatorUsername() != null ? newProject.getCreatorUsername() : "another user"
        );
        
        // Notification to the new project creator about the existing matching project
        String messageToNewUser = String.format(
            "🎯 Similar Project Found! Your project '%s' matches %s%% with '%s' by %s. " +
            "Consider connecting for potential collaboration!",
            newProject.getName(),
            similarityPercentage,
            matchedProject.getName(),
            matchedProject.getCreatorUsername() != null ? matchedProject.getCreatorUsername() : "another user"
        );
        
        // Send notification to existing project creator
        boolean notificationSent1 = sendNotificationToUser(
            matchedProject, "Project Match Found", messageToExistingUser, newProject, matchedProject, similarity);
        
        // Send notification to new project creator
        boolean notificationSent2 = sendNotificationToUser(
            newProject, "Project Match Found", messageToNewUser, matchedProject, newProject, similarity);
        
        if (notificationSent1 && notificationSent2) {
            System.out.println("✅ Bi-directional notifications sent for project match: " + 
                newProject.getName() + " <-> " + matchedProject.getName() + " (" + similarityPercentage + "% match)");
        } else {
            System.out.println("⚠️ Failed to send some notifications for project match: " + 
                newProject.getName() + " <-> " + matchedProject.getName());
        }
    }
    
    /**
     * Helper method to send notification to a specific user
     */
    private boolean sendNotificationToUser(Project project, String title, String message) {
        return sendNotificationToUser(project, title, message, null, null, 0.0);
    }
    
    /**
     * Helper method to send notification to a specific user with project match details
     */
    private boolean sendNotificationToUser(Project project, String title, String message, 
            Project newProject, Project matchedProject, double similarity) {
        try {
            if (project.getUserId() != null) {
                if (newProject != null && matchedProject != null && similarity > 0) {
                    // Use the project match notification method with details
                    notificationService.createProjectMatchNotification(
                        project.getUserId(), title, message, newProject, matchedProject, similarity);
                } else {
                    // Use regular notification method
                    notificationService.createNotification(project.getUserId(), title, message, "PROJECT_MATCH");
                }
                return true;
            } else if (project.getCreatorUsername() != null) {
                if (newProject != null && matchedProject != null && similarity > 0) {
                    // For username-based notifications, we need to find the user first
                    notificationService.createNotificationByUsername(
                        project.getCreatorUsername(), title, message, "PROJECT_MATCH");
                } else {
                    notificationService.createNotificationByUsername(
                        project.getCreatorUsername(), title, message, "PROJECT_MATCH");
                }
                return true;
            } else if (project.getCreator() != null) {
                if (newProject != null && matchedProject != null && similarity > 0) {
                    notificationService.createProjectMatchNotification(
                        project.getCreator().getId(), title, message, newProject, matchedProject, similarity);
                } else {
                    notificationService.createNotification(project.getCreator().getId(), title, message, "PROJECT_MATCH");
                }
                return true;
            } else {
                System.out.println("⚠️ No user identifier found for project: " + project.getName());
                return false;
            }
        } catch (Exception e) {
            System.out.println("❌ Error sending notification for project: " + project.getName() + " - " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Inner class to hold match results
     */
    private static class ProjectMatch {
        private final Project matchedProject;
        private final double similarityScore;
        
        public ProjectMatch(Project matchedProject, double similarityScore) {
            this.matchedProject = matchedProject;
            this.similarityScore = similarityScore;
        }
        
        public Project getMatchedProject() { return matchedProject; }
        public double getSimilarityScore() { return similarityScore; }
    }
}
