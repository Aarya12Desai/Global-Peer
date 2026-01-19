package com.example.auth.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.auth.model.ApplicationStatus;
import com.example.auth.model.ProjectApplication;

@Repository
public interface ProjectApplicationRepository extends JpaRepository<ProjectApplication, Long> {
    
    @Query("SELECT pa FROM ProjectApplication pa WHERE pa.projectId = :projectId ORDER BY pa.appliedAt DESC")
    List<ProjectApplication> findByProjectIdOrderByAppliedAtDesc(@Param("projectId") Long projectId);
    
    @Query("SELECT pa FROM ProjectApplication pa WHERE pa.applicantId = :applicantId ORDER BY pa.appliedAt DESC")
    List<ProjectApplication> findByApplicantIdOrderByAppliedAtDesc(@Param("applicantId") Long applicantId);
    
    @Query("SELECT pa FROM ProjectApplication pa WHERE pa.projectId = :projectId AND pa.applicantId = :applicantId")
    Optional<ProjectApplication> findByProjectIdAndApplicantId(@Param("projectId") Long projectId, @Param("applicantId") Long applicantId);
    
    @Query("SELECT pa FROM ProjectApplication pa JOIN pa.project p WHERE p.companyId = :companyId ORDER BY pa.appliedAt DESC")
    List<ProjectApplication> findByCompanyIdOrderByAppliedAtDesc(@Param("companyId") Long companyId);
    
    @Query("SELECT COUNT(pa) FROM ProjectApplication pa WHERE pa.projectId = :projectId")
    long countByProjectId(@Param("projectId") Long projectId);
    
    @Query("SELECT COUNT(pa) FROM ProjectApplication pa WHERE pa.projectId = :projectId AND pa.status = :status")
    long countByProjectIdAndStatus(@Param("projectId") Long projectId, @Param("status") ApplicationStatus status);
}
