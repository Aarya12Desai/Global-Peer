package com.example.auth.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.auth.model.Message;
import com.example.auth.model.User;
import com.example.auth.repository.MessageRepository;
import com.example.auth.repository.UserRepository;

@Service
public class MessageService {
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public MessageService(MessageRepository messageRepository, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    public Message sendMessage(Long senderId, Long recipientId, String content) {
        User sender = userRepository.findById(senderId).orElse(null);
        User recipient = userRepository.findById(recipientId).orElse(null);
        if (sender == null || recipient == null) return null;
        Message message = new Message(sender, recipient, content);
        return messageRepository.save(message);
    }

    public List<Message> getConversation(Long user1Id, Long user2Id) {
        User user1 = userRepository.findById(user1Id).orElse(null);
        User user2 = userRepository.findById(user2Id).orElse(null);
        if (user1 == null || user2 == null) return List.of();
        return messageRepository.findConversation(user1, user2);
    }

    public List<Message> getInbox(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return List.of();
        return messageRepository.findByRecipient(user);
    }
}
