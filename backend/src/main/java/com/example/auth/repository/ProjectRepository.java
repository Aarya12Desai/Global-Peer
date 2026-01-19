package com.example.auth.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.auth.model.Project;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByCreatorUsername(String creatorUsername);
    List<Project> findByCreatorId(Long creatorId);
    List<Project> findByUserId(Long userId);
}
