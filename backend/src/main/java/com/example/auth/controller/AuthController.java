package com.example.auth.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth.dto.CompanyRegisterRequest;
import com.example.auth.dto.JwtResponse;
import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.MessageResponse;
import com.example.auth.dto.RegisterRequest;
import com.example.auth.exception.UserAlreadyExistsException;
import com.example.auth.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest registerRequest) {
        try {
            JwtResponse jwtResponse = authService.registerUser(registerRequest);
            return ResponseEntity.ok(jwtResponse);
        } catch (UserAlreadyExistsException e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/company-signup")
    public ResponseEntity<?> registerCompany(@RequestBody CompanyRegisterRequest request) {
        try {
            JwtResponse jwtResponse = authService.registerCompany(request);
            return ResponseEntity.ok(jwtResponse);
        } catch (UserAlreadyExistsException | IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    // Student/company registration endpoints have been removed. Use /register with RegisterRequest instead.
    
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            JwtResponse jwtResponse = authService.authenticateUser(loginRequest);
            return ResponseEntity.ok(jwtResponse);
        } catch (BadCredentialsException e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Invalid credentials"));
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(HttpServletRequest request) {
        // JWT is stateless, so logout is typically handled on frontend
        return ResponseEntity.ok(new MessageResponse("User logged out successfully!"));
    }
}