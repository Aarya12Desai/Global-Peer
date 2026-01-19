package com.example.auth.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.auth.model.Community;

@Repository
public interface CommunityRepository extends JpaRepository<Community, Long> {
    
    List<Community> findByIsPublicTrue();
    
    List<Community> findByCompanyId(Long companyId);
    
    Optional<Community> findByIdAndIsPublicTrue(Long id);
    
    @Query("SELECT c FROM Community c WHERE c.isPublic = true AND " +
           "(LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Community> searchPublicCommunities(@Param("keyword") String keyword);
    
    @Query("SELECT COUNT(cm) FROM CommunityMembership cm WHERE cm.communityId = :communityId AND cm.isActive = true")
    Long countActiveMembers(@Param("communityId") Long communityId);
}
