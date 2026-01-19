package com.example.auth.config;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.auth.service.CustomUserDetailsService;
import com.example.auth.util.JwtUtil;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class AuthTokenFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private CustomUserDetailsService userDetailsService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            System.out.println("AuthTokenFilter - Request URI: " + request.getRequestURI());
            System.out.println("AuthTokenFilter - JWT token present: " + (jwt != null));
            
            if (jwt != null) {
                System.out.println("AuthTokenFilter - JWT token preview: " + jwt.substring(0, Math.min(20, jwt.length())) + "...");
                boolean isValid = jwtUtil.validateJwtToken(jwt);
                System.out.println("AuthTokenFilter - JWT token valid: " + isValid);
                
                if (isValid) {
                    String username = jwtUtil.getUserNameFromJwtToken(jwt);
                    System.out.println("AuthTokenFilter - Username from token: " + username);
                    
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    System.out.println("AuthTokenFilter - UserDetails loaded: " + userDetails.getUsername());
                    
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    System.out.println("AuthTokenFilter - Authentication set successfully");
                }
            } else {
                System.out.println("AuthTokenFilter - No JWT token found in request");
            }
        } catch (Exception e) {
            System.err.println("AuthTokenFilter - Cannot set user authentication: " + e.getMessage());
            e.printStackTrace();
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        
        return null;
    }
}
