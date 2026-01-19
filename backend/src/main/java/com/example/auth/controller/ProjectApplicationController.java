package com.example.auth.controller;

import java.time.LocalDateTime;
import java.util.List;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth.model.ApplicationStatus;
import com.example.auth.model.CompanyProject;
import com.example.auth.model.ProjectApplication;
import com.example.auth.model.User;
import com.example.auth.repository.CompanyProjectRepository;
import com.example.auth.repository.ProjectApplicationRepository;
import com.example.auth.repository.UserRepository;

@RestController
@RequestMapping("/api/project-applications")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProjectApplicationController {
    
    @Autowired
    private ProjectApplicationRepository applicationRepository;
    
    @Autowired
    private CompanyProjectRepository projectRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @PostMapping
    public ResponseEntity<?> submitApplication(@RequestBody ProjectApplication application, Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            User user = userOpt.get();
            
            // Check if project exists
            Optional<CompanyProject> projectOpt = projectRepository.findById(application.getProjectId());
            if (projectOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Project not found");
            }
            
            CompanyProject project = projectOpt.get();
            
            // Check if user already applied to this project
            Optional<ProjectApplication> existingApp = applicationRepository.findByProjectIdAndApplicantId(
                application.getProjectId(), user.getId());
            if (existingApp.isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("You have already applied to this project");
            }
            
            // Set the applicant and project
            application.setApplicant(user);
            application.setApplicantId(user.getId());
            application.setProject(project);
            application.setStatus(ApplicationStatus.PENDING);
            
            ProjectApplication savedApplication = applicationRepository.save(application);
            return ResponseEntity.ok(savedApplication);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error submitting application");
        }
    }
    
    @GetMapping("/my-applications")
    public ResponseEntity<?> getMyApplications(Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            User user = userOpt.get();
            List<ProjectApplication> applications = applicationRepository.findByApplicantIdOrderByAppliedAtDesc(user.getId());
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching applications");
        }
    }
    
    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getProjectApplications(@PathVariable Long projectId, Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            User user = userOpt.get();
            
            // Check if user owns this project
            Optional<CompanyProject> projectOpt = projectRepository.findById(projectId);
            if (projectOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Project not found");
            }
            
            CompanyProject project = projectOpt.get();
            if (!project.getCompanyId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't have permission to view these applications");
            }
            
            List<ProjectApplication> applications = applicationRepository.findByProjectIdOrderByAppliedAtDesc(projectId);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching project applications");
        }
    }
    
    @PutMapping("/{applicationId}/status")
    public ResponseEntity<?> updateApplicationStatus(@PathVariable Long applicationId, 
                                                   @RequestBody ApplicationStatusUpdate statusUpdate,
                                                   Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            User user = userOpt.get();
            
            Optional<ProjectApplication> applicationOpt = applicationRepository.findById(applicationId);
            if (applicationOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Application not found");
            }
            
            ProjectApplication application = applicationOpt.get();
            
            // Check if user owns the project this application is for
            if (!application.getProject().getCompanyId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't have permission to update this application");
            }
            
            application.setStatus(statusUpdate.getStatus());
            application.setNotes(statusUpdate.getNotes());
            application.setReviewedAt(LocalDateTime.now());
            
            ProjectApplication savedApplication = applicationRepository.save(application);
            return ResponseEntity.ok(savedApplication);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating application status");
        }
    }
    
    // DTO for status update
    public static class ApplicationStatusUpdate {
        private ApplicationStatus status;
        private String notes;
        
        public ApplicationStatus getStatus() { return status; }
        public void setStatus(ApplicationStatus status) { this.status = status; }
        
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
}
