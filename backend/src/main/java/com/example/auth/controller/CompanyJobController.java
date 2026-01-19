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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth.model.CompanyJob;
import com.example.auth.model.JobStatus;
import com.example.auth.model.User;
import com.example.auth.repository.CompanyJobRepository;
import com.example.auth.repository.UserRepository;

@RestController
@RequestMapping("/api/company-jobs")
public class CompanyJobController {
    
    @Autowired
    private CompanyJobRepository companyJobRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @GetMapping("/my-jobs")
    public ResponseEntity<?> getMyJobs(Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            User user = userOpt.get();
            List<CompanyJob> jobs = companyJobRepository.findByCompanyIdOrderByCreatedAtDesc(user.getId());
            
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching jobs");
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createJob(@RequestBody CompanyJob job, Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            User user = userOpt.get();
            job.setCompany(user);
            job.setCompanyId(user.getId());
            job.setCreatedAt(LocalDateTime.now());
            job.setStatus(JobStatus.ACTIVE);
            
            CompanyJob savedJob = companyJobRepository.save(job);
            return ResponseEntity.ok(savedJob);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating job");
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateJob(@PathVariable Long id, @RequestBody CompanyJob jobUpdate, Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            User user = userOpt.get();
            Optional<CompanyJob> jobOpt = companyJobRepository.findById(id);
            if (jobOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Job not found");
            }
            
            CompanyJob job = jobOpt.get();
            if (!job.getCompanyId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized to update this job");
            }
            
            // Update fields
            job.setTitle(jobUpdate.getTitle());
            job.setDescription(jobUpdate.getDescription());
            job.setRequiredSkills(jobUpdate.getRequiredSkills());
            job.setExperienceLevel(jobUpdate.getExperienceLevel());
            job.setJobType(jobUpdate.getJobType());
            job.setSalaryRange(jobUpdate.getSalaryRange());
            job.setLocation(jobUpdate.getLocation());
            job.setRemoteAllowed(jobUpdate.isRemoteAllowed());
            job.setApplicationDeadline(jobUpdate.getApplicationDeadline());
            job.setStatus(jobUpdate.getStatus());
            job.setUpdatedAt(LocalDateTime.now());
            
            CompanyJob savedJob = companyJobRepository.save(job);
            return ResponseEntity.ok(savedJob);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating job");
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteJob(@PathVariable Long id, Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            User user = userOpt.get();
            Optional<CompanyJob> jobOpt = companyJobRepository.findById(id);
            if (jobOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Job not found");
            }
            
            CompanyJob job = jobOpt.get();
            if (!job.getCompanyId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized to delete this job");
            }
            
            companyJobRepository.delete(job);
            return ResponseEntity.ok("Job deleted successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting job");
        }
    }
    
    @GetMapping("/dashboard-stats")
    public ResponseEntity<?> getDashboardStats(Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            User user = userOpt.get();
            Long companyId = user.getId();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalJobs", companyJobRepository.countByCompanyId(companyId));
            stats.put("activeJobs", companyJobRepository.countByCompanyIdAndStatus(companyId, JobStatus.ACTIVE));
            stats.put("closedJobs", companyJobRepository.countByCompanyIdAndStatus(companyId, JobStatus.CLOSED));
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching dashboard stats");
        }
    }
    
    @GetMapping("/public")
    public ResponseEntity<?> getPublicJobs() {
        try {
            List<CompanyJob> jobs = companyJobRepository.findByStatusOrderByCreatedAtDesc(JobStatus.ACTIVE);
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching public jobs");
        }
    }
}
