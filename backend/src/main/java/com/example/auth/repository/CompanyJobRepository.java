package com.example.auth.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.auth.model.CompanyJob;
import com.example.auth.model.JobStatus;

@Repository
public interface CompanyJobRepository extends JpaRepository<CompanyJob, Long> {
    
    @Query("SELECT cj FROM CompanyJob cj WHERE cj.companyId = :companyId ORDER BY cj.createdAt DESC")
    List<CompanyJob> findByCompanyIdOrderByCreatedAtDesc(@Param("companyId") Long companyId);
    
    @Query("SELECT cj FROM CompanyJob cj WHERE cj.status = :status ORDER BY cj.createdAt DESC")
    List<CompanyJob> findByStatusOrderByCreatedAtDesc(@Param("status") JobStatus status);
    
    @Query("SELECT cj FROM CompanyJob cj WHERE cj.companyId = :companyId AND cj.status = :status ORDER BY cj.createdAt DESC")
    List<CompanyJob> findByCompanyIdAndStatusOrderByCreatedAtDesc(@Param("companyId") Long companyId, @Param("status") JobStatus status);
    
    @Query("SELECT COUNT(cj) FROM CompanyJob cj WHERE cj.companyId = :companyId")
    long countByCompanyId(@Param("companyId") Long companyId);
    
    @Query("SELECT COUNT(cj) FROM CompanyJob cj WHERE cj.companyId = :companyId AND cj.status = :status")
    long countByCompanyIdAndStatus(@Param("companyId") Long companyId, @Param("status") JobStatus status);
}
