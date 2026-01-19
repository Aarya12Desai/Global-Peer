package com.example.auth.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.auth.model.CommunityMembership;

@Repository
public interface CommunityMembershipRepository extends JpaRepository<CommunityMembership, Long> {
    
    Optional<CommunityMembership> findByUserIdAndCommunityId(Long userId, Long communityId);
    
    List<CommunityMembership> findByUserIdAndIsActiveTrue(Long userId);
    
    List<CommunityMembership> findByCommunityIdAndIsActiveTrue(Long communityId);
    
    @Query("SELECT cm FROM CommunityMembership cm WHERE cm.userId = :userId AND cm.isActive = true")
    List<CommunityMembership> findActiveMembershipsByUserId(@Param("userId") Long userId);
    
    @Query("SELECT cm FROM CommunityMembership cm JOIN cm.community c WHERE cm.userId = :userId AND cm.isActive = true AND c.isPublic = true")
    List<CommunityMembership> findActivePublicMembershipsByUserId(@Param("userId") Long userId);
    
    boolean existsByUserIdAndCommunityIdAndIsActiveTrue(Long userId, Long communityId);
    
    Long countByCommunityIdAndIsActiveTrue(Long communityId);
}
