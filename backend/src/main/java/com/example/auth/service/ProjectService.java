package com.example.auth.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.auth.dto.ProjectRequest;
import com.example.auth.model.Project;
import com.example.auth.model.User;
import com.example.auth.repository.ProjectRepository;
import com.example.auth.repository.UserRepository;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMatchingService projectMatchingService;

    public ProjectService(ProjectRepository projectRepository, 
                         UserRepository userRepository,
                         ProjectMatchingService projectMatchingService) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.projectMatchingService = projectMatchingService;
    }

    public Project createProject(ProjectRequest req, String username) {
        User creator = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found: " + username));
        
        Project p = new Project();
    p.setName(req.name);
    p.setDescription(req.description);
    p.setImage(req.image);
    p.setTechnologiesUsed(req.technologiesUsed);
    p.setDomain(req.domain);
    p.setCreator(creator);
    p.setCreatorUsername(username);
    p.setUserId(creator.getId());
        
        Project savedProject = projectRepository.save(p);
        
        // Trigger AI matching after saving
        try {
            projectMatchingService.findAndNotifyMatches(savedProject);
        } catch (Exception e) {
            // Log the error but don't fail the project creation
            System.err.println("Error during project matching: " + e.getMessage());
        }
        
        return savedProject;
    }
    
    // Keep the old method for backward compatibility but mark as deprecated
    @Deprecated
    public Project createProject(ProjectRequest req) {
        Project p = new Project();
        p.setName(req.name);
        p.setDescription(req.description);
        p.setImage(req.image);
        p.setTechnologiesUsed(req.technologiesUsed);
        p.setDomain(req.domain);
        return projectRepository.save(p);
    }
    
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }
    
    public List<Project> getProjectsByCreator(String creatorUsername) {
        return projectRepository.findByCreatorUsername(creatorUsername);
    }
    
    public List<Project> getProjectsByUserId(Long userId) {
        return projectRepository.findByUserId(userId);
    }
    
    public boolean deleteProject(Long projectId, String username) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) {
            return false;
        }
        
        Project project = projectOpt.get();
        
        // Check if the user is authorized to delete this project
        if (!username.equals(project.getCreatorUsername())) {
            return false;
        }
        
        projectRepository.delete(project);
        return true;
    }
}
