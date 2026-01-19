package com.example.auth.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.auth.dto.CommentResponse;
import com.example.auth.dto.CreateCommentRequest;
import com.example.auth.dto.CreatePostRequest;
import com.example.auth.dto.MessageResponse;
import com.example.auth.dto.PostResponse;
import com.example.auth.service.FileStorageService;
import com.example.auth.service.PostService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PostController {
    
    @Autowired
    private PostService postService;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    // Create a new post
    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @Valid @RequestBody CreatePostRequest request,
            Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        PostResponse post = postService.createPost(request, userDetails.getUsername());
        return ResponseEntity.ok(post);
    }
    
    // Create a new post with image upload
    @PostMapping("/with-image")
    public ResponseEntity<PostResponse> createPostWithImage(
            @RequestParam("content") String content,
            @RequestParam(value = "image", required = false) MultipartFile image,
            Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            
            // Validate content
            if (content == null || content.trim().isEmpty()) {
                throw new RuntimeException("Post content cannot be empty");
            }
            
            if (content.length() > 1000) {
                throw new RuntimeException("Post content cannot exceed 1000 characters");
            }
            
            String imageUrl = null;
            if (image != null && !image.isEmpty()) {
                // Validate image
                String contentType = image.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    throw new RuntimeException("Only image files are allowed");
                }
                
                if (image.getSize() > 5 * 1024 * 1024) {
                    throw new RuntimeException("File size should not exceed 5MB");
                }
                
                String fileName = fileStorageService.storeFile(image);
                imageUrl = "/api/files/images/" + fileName;
            }
            
            CreatePostRequest request = new CreatePostRequest(content.trim(), imageUrl);
            PostResponse post = postService.createPost(request, userDetails.getUsername());
            return ResponseEntity.ok(post);
            
        } catch (Exception ex) {
            throw new RuntimeException("Could not create post: " + ex.getMessage());
        }
    }
    
    // Get all posts (feed) with pagination
    @GetMapping
    public ResponseEntity<Page<PostResponse>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Page<PostResponse> posts = postService.getAllPosts(page, size, userDetails.getUsername());
        return ResponseEntity.ok(posts);
    }
    
    // Get a specific post
    @GetMapping("/{postId}")
    public ResponseEntity<PostResponse> getPost(
            @PathVariable Long postId,
            Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        PostResponse post = postService.getPost(postId, userDetails.getUsername());
        return ResponseEntity.ok(post);
    }
    
    // Get posts by user
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<PostResponse>> getUserPosts(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Page<PostResponse> posts = postService.getUserPosts(userId, page, size, userDetails.getUsername());
        return ResponseEntity.ok(posts);
    }
    
    // Like/Unlike a post
    @PostMapping("/{postId}/like")
    public ResponseEntity<PostResponse> toggleLike(
            @PathVariable Long postId,
            Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        PostResponse post = postService.toggleLike(postId, userDetails.getUsername());
        return ResponseEntity.ok(post);
    }
    
    // Delete a post
    @DeleteMapping("/{postId}")
    public ResponseEntity<MessageResponse> deletePost(
            @PathVariable Long postId,
            Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        postService.deletePost(postId, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Post deleted successfully"));
    }
    
    // Add a comment to a post
    @PostMapping("/{postId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long postId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        CommentResponse comment = postService.addComment(postId, request, userDetails.getUsername());
        return ResponseEntity.ok(comment);
    }
    
    // Get comments for a post
    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long postId) {
        List<CommentResponse> comments = postService.getComments(postId);
        return ResponseEntity.ok(comments);
    }
    
    // Search posts
    @GetMapping("/search")
    public ResponseEntity<Page<PostResponse>> searchPosts(
            @RequestParam(name = "q", required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Page<PostResponse> posts = postService.searchPosts(keyword, page, size, userDetails.getUsername());
        return ResponseEntity.ok(posts);
    }
    
    // Get trending posts
    @GetMapping("/trending")
    public ResponseEntity<Page<PostResponse>> getTrendingPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Page<PostResponse> posts = postService.getTrendingPosts(page, size, userDetails.getUsername());
        return ResponseEntity.ok(posts);
    }
}
