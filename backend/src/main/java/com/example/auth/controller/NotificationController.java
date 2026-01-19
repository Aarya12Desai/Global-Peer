
package com.example.auth.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.Map;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth.model.Notification;
import com.example.auth.model.User;
import com.example.auth.repository.UserRepository;
import com.example.auth.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:4200")
public class NotificationController {

    /**
     * Send a notification to a user (used by frontend for connect action)
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendNotificationToUser(@RequestBody Map<String, Object> payload) {
        try {
            Long userId = null;
            if (payload.get("userId") instanceof Integer) {
                userId = ((Integer) payload.get("userId")).longValue();
            } else if (payload.get("userId") instanceof Long) {
                userId = (Long) payload.get("userId");
            } else if (payload.get("userId") instanceof String) {
                userId = Long.parseLong((String) payload.get("userId"));
            }
            String title = (String) payload.get("title");
            String message = (String) payload.get("message");
            String type = (String) payload.get("type");
            if (userId == null || title == null || message == null || type == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
            }
            Notification notification = notificationService.createNotification(userId, title, message, type);
            if (notification == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            return ResponseEntity.ok(Map.of("message", "Notification sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to send notification", "details", e.getMessage()));
        }
    }
    
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    
    public NotificationController(NotificationService notificationService, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }
    
    /**
     * Get all notifications for the authenticated user
     */
    @GetMapping
    public ResponseEntity<List<Object>> getUserNotifications(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetails)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        List<Notification> notifications = notificationService.getUserNotifications(user.getId());
        // Map to DTO with userId for project_match notifications
        List<Object> notificationDtos = notifications.stream().map(n -> {
            if ("PROJECT_MATCH".equalsIgnoreCase(n.getType()) && n.getMatchedProject() != null && n.getMatchedProject().getCreator() != null) {
                return new java.util.HashMap<String, Object>() {{
                    put("id", n.getId());
                    put("type", n.getType().toLowerCase());
                    put("title", n.getTitle());
                    put("message", n.getMessage());
                    put("timestamp", n.getCreatedAt());
                    put("read", n.getIsRead());
                    put("avatar", n.getMatchedProject().getCreatorUsername() != null ? n.getMatchedProject().getCreatorUsername().substring(0,2).toUpperCase() : "");
                    put("userName", n.getMatchedProject().getCreatorUsername());
                    put("userId", n.getMatchedProject().getCreator().getId());
                }};
            } else {
                return new java.util.HashMap<String, Object>() {{
                    put("id", n.getId());
                    put("type", n.getType().toLowerCase());
                    put("title", n.getTitle());
                    put("message", n.getMessage());
                    put("timestamp", n.getCreatedAt());
                    put("read", n.getIsRead());
                    put("avatar", null);
                    put("userName", null);
                    put("userId", null);
                }};
            }
        }).collect(Collectors.toList());
        return ResponseEntity.ok(notificationDtos);
    }
    
    /**
     * Get notifications for a specific user by user ID (for testing)
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getNotificationsByUserId(@PathVariable Long userId) {
        List<Notification> notifications = notificationService.getUserNotifications(userId);
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Get unread notifications for the authenticated user
     */
    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetails)) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
        
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        List<Notification> notifications = notificationService.getUnreadNotifications(user.getId());
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Get unread count for the authenticated user
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadCount(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetails)) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
        
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        long count = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(count);
    }
    
    /**
     * Mark a notification as read
     */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long notificationId) {
        boolean success = notificationService.markAsRead(notificationId);
        return success ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }
    
    /**
     * Mark all notifications as read for the authenticated user
     */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetails)) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
        
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok().build();
    }
    
    /**
     * Delete a notification
     */
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long notificationId) {
        boolean success = notificationService.deleteNotification(notificationId);
        return success ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }
}
