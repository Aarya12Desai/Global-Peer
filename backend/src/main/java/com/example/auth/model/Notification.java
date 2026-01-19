package com.example.auth.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "notifications")
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String message;
    
    @Column(nullable = false)
    private String type;
    
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;
    
    // Project match specific fields
    @ManyToOne
    @JoinColumn(name = "matched_project_id")
    private Project matchedProject;
    
    @ManyToOne
    @JoinColumn(name = "new_project_id")
    private Project newProject;
    
    @Column(name = "similarity_score")
    private Double similarityScore;
    
    @Column(name = "match_details", columnDefinition = "TEXT")
    private String matchDetails;
    
    // Constructors
    public Notification() {
        this.createdAt = Instant.now();
    }
    
    public Notification(User user, String title, String message, String type) {
        this();
        this.user = user;
        this.title = title;
        this.message = message;
        this.type = type;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
    
    public Boolean getIsRead() {
        return isRead;
    }
    
    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }
    
    public Project getMatchedProject() {
        return matchedProject;
    }
    
    public void setMatchedProject(Project matchedProject) {
        this.matchedProject = matchedProject;
    }
    
    public Project getNewProject() {
        return newProject;
    }
    
    public void setNewProject(Project newProject) {
        this.newProject = newProject;
    }
    
    public Double getSimilarityScore() {
        return similarityScore;
    }
    
    public void setSimilarityScore(Double similarityScore) {
        this.similarityScore = similarityScore;
    }
    
    public String getMatchDetails() {
        return matchDetails;
    }
    
    public void setMatchDetails(String matchDetails) {
        this.matchDetails = matchDetails;
    }
}
