package com.example.auth.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth.service.AiMatchingService;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4201", "http://localhost:4202"})
public class AiMatchingController {

    @Autowired
    private AiMatchingService aiMatchingService;

    @PostMapping("/match-projects")
    public ResponseEntity<?> matchProjects(@RequestBody Map<String, Object> projectData) {
        try {
            // Perform AI matching without saving to database
            Map<String, Object> matchingResults = aiMatchingService.findMatches(projectData);
            return ResponseEntity.ok(matchingResults);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI matching failed: " + e.getMessage()));
        }
    }
    
    @PostMapping("/ai-matching")
    public ResponseEntity<?> aiMatching(@RequestBody Map<String, Object> projectData) {
        try {
            // Main AI matching endpoint for the frontend
            Map<String, Object> matchingResults = aiMatchingService.findMatches(projectData);
            // Return just the matches array for the frontend
            return ResponseEntity.ok(matchingResults.get("matches"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "AI matching failed: " + e.getMessage()));
        }
    }

    @PostMapping("/match-companies")
    public ResponseEntity<?> matchCompanies(@RequestBody Map<String, Object> projectData) {
        try {
            // Find matching companies based on project requirements
            Map<String, Object> companyMatches = aiMatchingService.findCompanyMatches(projectData);
            return ResponseEntity.ok(companyMatches);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Company matching failed: " + e.getMessage()));
        }
    }

    @PostMapping("/match-developers")
    public ResponseEntity<?> matchDevelopers(@RequestBody Map<String, Object> projectData) {
        try {
            // Find matching developers/collaborators
            Map<String, Object> developerMatches = aiMatchingService.findDeveloperMatches(projectData);
            return ResponseEntity.ok(developerMatches);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Developer matching failed: " + e.getMessage()));
        }
    }

    @PostMapping("/suggest-improvements")
    public ResponseEntity<?> suggestImprovements(@RequestBody Map<String, Object> projectData) {
        try {
            // Provide AI-powered suggestions for project improvement
            Map<String, Object> suggestions = aiMatchingService.suggestImprovements(projectData);
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Suggestion generation failed: " + e.getMessage()));
        }
    }
}
