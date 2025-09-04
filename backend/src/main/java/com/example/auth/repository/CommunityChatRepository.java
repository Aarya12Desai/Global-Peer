package com.example.auth.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.auth.model.CommunityChat;

@Repository
public interface CommunityChatRepository extends JpaRepository<CommunityChat, Long> {
    
    @Query("SELECT cc FROM CommunityChat cc ORDER BY cc.createdAt DESC")
    List<CommunityChat> findAllOrderByCreatedAtDesc();
    
    @Query("SELECT cc FROM CommunityChat cc WHERE cc.createdAt >= :since ORDER BY cc.createdAt ASC")
    List<CommunityChat> findMessagesSince(@Param("since") LocalDateTime since);
    
    @Query("SELECT cc FROM CommunityChat cc ORDER BY cc.createdAt DESC")
    List<CommunityChat> findTop50ByOrderByCreatedAtDesc();
    
    @Query("SELECT COUNT(cc) FROM CommunityChat cc WHERE cc.createdAt >= :since")
    long countMessagesSince(@Param("since") LocalDateTime since);
}
