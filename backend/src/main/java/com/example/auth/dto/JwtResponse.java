package com.example.auth.dto;

public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private String role;
    private String companyName;
    private String companyWebsite;
    private String companyContactName;
    private String companyContactPhone;
    
    public JwtResponse(String accessToken, Long id, String username, String email, String role) {
        this.token = accessToken;
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
    }
    
    public JwtResponse(String accessToken, Long id, String username, String email, String role,
                      String companyName, String companyWebsite, String companyContactName, String companyContactPhone) {
        this.token = accessToken;
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.companyName = companyName;
        this.companyWebsite = companyWebsite;
        this.companyContactName = companyContactName;
        this.companyContactPhone = companyContactPhone;
    }
    
    // Getters and setters
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public String getCompanyName() {
        return companyName;
    }
    
    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }
    
    public String getCompanyWebsite() {
        return companyWebsite;
    }
    
    public void setCompanyWebsite(String companyWebsite) {
        this.companyWebsite = companyWebsite;
    }
    
    public String getCompanyContactName() {
        return companyContactName;
    }
    
    public void setCompanyContactName(String companyContactName) {
        this.companyContactName = companyContactName;
    }
    
    public String getCompanyContactPhone() {
        return companyContactPhone;
    }
    
    public void setCompanyContactPhone(String companyContactPhone) {
        this.companyContactPhone = companyContactPhone;
    }
}
