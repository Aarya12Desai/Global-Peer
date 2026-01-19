package com.example.auth.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.auth.model.CompanyProject;
import com.example.auth.model.ProjectStatus;

@Repository
public interface CompanyProjectRepository extends JpaRepository<CompanyProject, Long> {
    
    @Query("SELECT cp FROM CompanyProject cp WHERE cp.companyId = :companyId ORDER BY cp.createdAt DESC")
    List<CompanyProject> findByCompanyIdOrderByCreatedAtDesc(@Param("companyId") Long companyId);
    
    @Query("SELECT cp FROM CompanyProject cp WHERE cp.status = :status ORDER BY cp.createdAt DESC")
    List<CompanyProject> findByStatusOrderByCreatedAtDesc(@Param("status") ProjectStatus status);
    
    @Query("SELECT cp FROM CompanyProject cp WHERE cp.companyId = :companyId AND cp.status = :status ORDER BY cp.createdAt DESC")
    List<CompanyProject> findByCompanyIdAndStatusOrderByCreatedAtDesc(@Param("companyId") Long companyId, @Param("status") ProjectStatus status);
    
    @Query("SELECT COUNT(cp) FROM CompanyProject cp WHERE cp.companyId = :companyId")
    long countByCompanyId(@Param("companyId") Long companyId);
    
    @Query("SELECT COUNT(cp) FROM CompanyProject cp WHERE cp.companyId = :companyId AND cp.status = :status")
    long countByCompanyIdAndStatus(@Param("companyId") Long companyId, @Param("status") ProjectStatus status);
}
