package com.example.auth.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.auth.model.Notification;
import com.example.auth.model.Project;
import com.example.auth.model.User;
import com.example.auth.repository.NotificationRepository;
import com.example.auth.repository.UserRepository;

@Service
public class NotificationService {
    
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    
    public NotificationService(UserRepository userRepository, NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }
    
    /**
     * Create a notification for a user and save it to the database
     */
    public Notification createNotification(Long userId, String title, String message, String type) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            System.out.println("Warning: Could not find user with ID: " + userId);
            return null;
        }
        
        Notification notification = new Notification(user, title, message, type);
        Notification saved = notificationRepository.save(notification);
        
        // Also log for debugging
        System.out.println("=== NOTIFICATION CREATED ===");
        System.out.println("User ID: " + userId);
        System.out.println("Title: " + title);
        System.out.println("Message: " + message);
        System.out.println("Type: " + type);
        System.out.println("Notification ID: " + saved.getId());
        System.out.println("============================");
        
        return saved;
    }
    
    /**
     * Create notification by username instead of user ID
     */
    public Notification createNotificationByUsername(String username, String title, String message, String type) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            return createNotification(user.getId(), title, message, type);
        } else {
            System.out.println("Warning: Could not find user with username: " + username);
            return null;
        }
    }
    
    /**
     * Create a project match notification with project details
     */
    public Notification createProjectMatchNotification(Long userId, String title, String message, 
            Project newProject, Project matchedProject, double similarityScore) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            System.out.println("Warning: Could not find user with ID: " + userId);
            return null;
        }
        
        Notification notification = new Notification(user, title, message, "PROJECT_MATCH");
        notification.setNewProject(newProject);
        notification.setMatchedProject(matchedProject);
        notification.setSimilarityScore(similarityScore);
        
        // Create detailed match information
        String matchDetails = String.format(
            "Match found between projects:\n" +
            "Your Project: %s (Domain: %s, Tech: %s)\n" +
            "Matched Project: %s (Domain: %s, Tech: %s)\n" +
            "Similarity Score: %.1f%%\n" +
            "Creator: %s",
            matchedProject.getName(),
            matchedProject.getDomain(),
            matchedProject.getTechnologiesUsed(),
            newProject.getName(),
            newProject.getDomain(),
            newProject.getTechnologiesUsed(),
            similarityScore * 100,
            newProject.getCreatorUsername() != null ? newProject.getCreatorUsername() : "Unknown"
        );
        notification.setMatchDetails(matchDetails);
        
        Notification saved = notificationRepository.save(notification);
        
        // Log for debugging
        System.out.println("=== PROJECT MATCH NOTIFICATION CREATED ===");
        System.out.println("User ID: " + userId);
        System.out.println("New Project: " + newProject.getName());
        System.out.println("Matched Project: " + matchedProject.getName());
        System.out.println("Similarity Score: " + (similarityScore * 100) + "%");
        System.out.println("Notification ID: " + saved.getId());
        System.out.println("==========================================");
        
        return saved;
    }
    
    /**
     * Get all notifications for a user
     */
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    /**
     * Get unread notifications for a user
     */
    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findUnreadByUserId(userId);
    }
    
    /**
     * Count unread notifications for a user
     */
    public long getUnreadCount(Long userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }
    
    /**
     * Mark a notification as read
     */
    public boolean markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification != null) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
            return true;
        }
        return false;
    }
    
    /**
     * Mark all notifications as read for a user
     */
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = getUnreadNotifications(userId);
        for (Notification notification : unreadNotifications) {
            notification.setIsRead(true);
        }
        notificationRepository.saveAll(unreadNotifications);
    }
    
    /**
     * Delete a notification
     */
    public boolean deleteNotification(Long notificationId) {
        if (notificationRepository.existsById(notificationId)) {
            notificationRepository.deleteById(notificationId);
            return true;
        }
        return false;
    }
}
