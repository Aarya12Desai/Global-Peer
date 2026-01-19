package com.example.auth.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.auth.model.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    /**
     * Find all notifications for a specific user, ordered by creation date (newest first)
     */
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
    
    /**
     * Find unread notifications for a specific user
     */
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.isRead = false ORDER BY n.createdAt DESC")
    List<Notification> findUnreadByUserId(@Param("userId") Long userId);
    
    /**
     * Count unread notifications for a specific user
     */
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.isRead = false")
    long countUnreadByUserId(@Param("userId") Long userId);
    
    /**
     * Find notifications by type for a specific user
     */
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.type = :type ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdAndType(@Param("userId") Long userId, @Param("type") String type);
    
    /**
     * Find notifications by matched project for a specific user
     */
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.matchedProject.id = :projectId")
    List<Notification> findByUserIdAndMatchedProjectId(@Param("userId") Long userId, @Param("projectId") Long projectId);
    
    /**
     * Find notifications by new project for a specific user
     */
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.newProject.id = :projectId")
    List<Notification> findByUserIdAndNewProjectId(@Param("userId") Long userId, @Param("projectId") Long projectId);
    
    /**
     * Find project match notifications for a specific user
     */
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.type = 'PROJECT_MATCH' ORDER BY n.createdAt DESC")
    List<Notification> findProjectMatchNotificationsByUserId(@Param("userId") Long userId);
}
