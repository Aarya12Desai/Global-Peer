package com.example.auth.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth.model.Message;
import com.example.auth.model.User;
import com.example.auth.repository.UserRepository;
import com.example.auth.service.MessageService;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:4200")
public class MessageController {
    private final MessageService messageService;
    private final UserRepository userRepository;

    public MessageController(MessageService messageService, UserRepository userRepository) {
        this.messageService = messageService;
        this.userRepository = userRepository;
    }

    @PostMapping("/send")
    public ResponseEntity<Message> sendMessage(Authentication authentication,
                                               @RequestParam Long recipientId,
                                               @RequestParam String content) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetails)) {
            return ResponseEntity.status(401).build();
        }
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User sender = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
        if (sender == null) return ResponseEntity.status(404).build();
        Message message = messageService.sendMessage(sender.getId(), recipientId, content);
        if (message == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(message);
    }

    @GetMapping("/conversation/{userId}")
    public ResponseEntity<List<Message>> getConversation(Authentication authentication, @PathVariable Long userId) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetails)) {
            return ResponseEntity.status(401).build();
        }
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();
        List<Message> conversation = messageService.getConversation(currentUser.getId(), userId);
        return ResponseEntity.ok(conversation);
    }

    @GetMapping("/inbox")
    public ResponseEntity<List<Message>> getInbox(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetails)) {
            return ResponseEntity.status(401).build();
        }
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(404).build();
        List<Message> inbox = messageService.getInbox(currentUser.getId());
        return ResponseEntity.ok(inbox);
    }
}
