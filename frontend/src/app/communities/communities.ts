import { Component, signal, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

interface Community {
  id: number;
  name: string;
  description: string;
  companyName: string;
  isPublic: boolean;
  memberCount: number;
  messageCount: number;
  createdAt: string;
  isJoined?: boolean;
  userRole?: string;
}

interface CommunityMembership {
  id: number;
  communityId: number;
  communityName: string;
  role: string;
  joinedAt: string;
  isActive: boolean;
}

interface CreateCommunityRequest {
  name: string;
  description: string;
  isPublic: boolean;
}

@Component({
  selector: 'app-communities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="communities-container">
      <!-- Header -->
      <div class="communities-header">
        <h1>🏘️ Communities</h1>
        <div class="header-actions">
          <button (click)="showCreateForm()" class="create-btn" *ngIf="isCompany()">
            ➕ Create Community
          </button>
          <button (click)="refreshCommunities()" class="refresh-btn" [disabled]="isLoading()">
            {{ isLoading() ? '⏳' : '🔄' }} Refresh
          </button>
        </div>
      </div>

      <!-- Create Community Modal -->
      <div *ngIf="showingCreateForm()" class="modal-overlay" (click)="hideCreateForm()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Create New Community</h3>
            <button (click)="hideCreateForm()" class="close-btn">×</button>
          </div>
          <form (ngSubmit)="createCommunity()" class="create-form">
            <div class="form-group">
              <label for="communityName">Community Name *</label>
              <input 
                type="text" 
                id="communityName"
                [(ngModel)]="communityName"
                name="communityName"
                placeholder="Enter community name"
                maxlength="100"
                required>
            </div>
            <div class="form-group">
              <label for="communityDescription">Description *</label>
              <textarea 
                id="communityDescription"
                [(ngModel)]="communityDescription" 
                name="communityDescription"
                placeholder="Describe your community"
                maxlength="500"
                rows="4"
                required></textarea>
            </div>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  [(ngModel)]="communityIsPublic" 
                  name="isPublic">
                <span class="checkmark"></span>
                Make this community public (anyone can join)
              </label>
              <small>Private communities require approval to join</small>
            </div>
            <div class="form-actions">
              <button type="button" (click)="hideCreateForm()" class="cancel-btn">Cancel</button>
              <button type="submit" class="submit-btn" [disabled]="!canCreateCommunity() || isLoading()">
                {{ isLoading() ? '⏳ Creating...' : '✨ Create Community' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="nav-tabs">
        <button 
          (click)="setActiveTab('discover')" 
          class="tab-btn"
          [class.active]="activeTab() === 'discover'">
          🔍 Discover Communities
        </button>
        <button 
          (click)="setActiveTab('my-communities')" 
          class="tab-btn"
          [class.active]="activeTab() === 'my-communities'">
          👥 My Communities ({{ myCommunities().length }})
        </button>
        <button 
          *ngIf="isCompany()"
          (click)="setActiveTab('company-community')" 
          class="tab-btn"
          [class.active]="activeTab() === 'company-community'">
          🏢 My Company Community
        </button>
      </div>

      <!-- Error/Success Messages -->
      <div *ngIf="errorMessage()" class="error-alert">
        <span>⚠️ {{ errorMessage() }}</span>
        <button (click)="clearError()" class="close-btn">×</button>
      </div>

      <div *ngIf="successMessage()" class="success-alert">
        <span>✅ {{ successMessage() }}</span>
        <button (click)="clearSuccess()" class="close-btn">×</button>
      </div>

      <!-- Loading Indicator -->
      <div *ngIf="isLoading()" class="loading-indicator">
        <div class="spinner"></div>
        <span>Loading communities...</span>
      </div>

      <!-- Discover Communities Tab -->
      <div *ngIf="activeTab() === 'discover'" class="tab-content">
        <div class="search-filters">
          <div class="search-box">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="🔍 Search communities..."
              (input)="filterCommunities()"
              class="search-input">
          </div>
          <div class="filter-options">
            <label class="filter-label">
              <input 
                type="checkbox" 
                [(ngModel)]="showPublicOnly" 
                (change)="filterCommunities()">
              Public only
            </label>
          </div>
        </div>

        <div class="communities-grid">
          <div *ngIf="filteredCommunities().length === 0 && !isLoading()" class="no-communities">
            <div class="empty-state">
              <div class="empty-icon">🏘️</div>
              <h3>No communities found</h3>
              <p>Try adjusting your search or create a new community!</p>
            </div>
          </div>

          <div *ngFor="let community of filteredCommunities(); trackBy: trackCommunity" 
               class="community-card" 
               [class.joined]="community.isJoined">
            <div class="community-header">
              <h3>{{ community.name }}</h3>
              <span class="community-type" [class.public]="community.isPublic">
                {{ community.isPublic ? '🌐 Public' : '🔒 Private' }}
              </span>
            </div>
            
            <div class="community-info">
              <p class="company-name">🏢 {{ community.companyName }}</p>
              <p class="description">{{ community.description }}</p>
            </div>

            <div class="community-stats">
              <span class="stat">👥 {{ community.memberCount }} members</span>
              <span class="stat">💬 {{ community.messageCount }} messages</span>
            </div>

            <div class="community-actions">
              <button 
                *ngIf="!community.isJoined" 
                (click)="joinCommunity(community.id)"
                class="join-btn"
                [disabled]="isLoading()">
                {{ isLoading() ? '⏳' : '➕' }} Join
              </button>
              
              <button 
                *ngIf="community.isJoined" 
                (click)="leaveCommunity(community.id)"
                class="leave-btn"
                [disabled]="isLoading()">
                {{ isLoading() ? '⏳' : '🚪' }} Leave
              </button>

              <button 
                *ngIf="community.isJoined" 
                (click)="openCommunityChat(community.id, community.name)"
                class="chat-btn">
                💬 Chat
              </button>
            </div>

            <div class="community-footer">
              <small>Created {{ formatDate(community.createdAt) }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- My Communities Tab -->
      <div *ngIf="activeTab() === 'my-communities'" class="tab-content">
        <div *ngIf="myCommunities().length === 0 && !isLoading()" class="no-communities">
          <div class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>No communities joined</h3>
            <p>Join some communities to start chatting!</p>
            <button (click)="setActiveTab('discover')" class="discover-btn">
              🔍 Discover Communities
            </button>
          </div>
        </div>

        <div class="my-communities-list">
          <div *ngFor="let membership of myCommunities(); trackBy: trackMembership" 
               class="membership-card">
            <div class="membership-header">
              <h3>{{ membership.communityName }}</h3>
              <span class="role-badge" [class]="membership.role.toLowerCase()">
                {{ formatRole(membership.role) }}
              </span>
            </div>

            <div class="membership-info">
              <p class="joined-date">📅 Joined {{ formatDate(membership.joinedAt) }}</p>
            </div>

            <div class="membership-actions">
              <button 
                (click)="openCommunityChat(membership.communityId, membership.communityName)"
                class="chat-btn">
                💬 Open Chat
              </button>
              
              <button 
                *ngIf="membership.role !== 'ADMIN'" 
                (click)="leaveCommunity(membership.communityId)"
                class="leave-btn"
                [disabled]="isLoading()">
                🚪 Leave
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Company Community Tab -->
      <div *ngIf="activeTab() === 'company-community'" class="tab-content">
        <div *ngIf="isLoading()" class="loading-indicator">
          <div class="spinner"></div>
          <span>Loading company community...</span>
        </div>

        <div *ngIf="companyCommunity() && !isLoading()" class="company-community-section">
          <div class="company-community-header">
            <h2>🏢 {{ companyCommunity()!.name }}</h2>
            <div class="community-stats">
              <span class="stat">👥 {{ companyCommunity()!.memberCount }} members</span>
              <span class="stat">🌐 {{ companyCommunity()!.isPublic ? 'Public' : 'Private' }}</span>
            </div>
          </div>

          <div class="company-community-description">
            <p>{{ companyCommunity()!.description }}</p>
          </div>

          <div class="company-community-actions">
            <button 
              (click)="openCommunityChat(companyCommunity()!.id, companyCommunity()!.name)"
              class="chat-btn large">
              💬 Open Company Chat
            </button>
            <button 
              (click)="viewCommunityMembers(companyCommunity()!.id)"
              class="members-btn">
              👥 View Members
            </button>
            <button 
              (click)="refreshCompanyCommunity()"
              class="refresh-btn">
              🔄 Refresh
            </button>
          </div>

          <div class="community-management">
            <h3>Community Management</h3>
            <p class="management-info">
              As the company admin, you can manage this community, view all members, and moderate discussions.
              This is your company's official space for connecting with users interested in your organization.
            </p>
          </div>
        </div>

        <div *ngIf="!companyCommunity() && !isLoading()" class="no-company-community">
          <div class="empty-state">
            <div class="empty-icon">🏢</div>
            <h3>No Company Community Found</h3>
            <p>It seems your company community wasn't created automatically. Please contact support.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .communities-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .communities-header {
      background: rgba(255, 255, 255, 0.95);
      padding: 25px;
      border-radius: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }

    .communities-header h1 {
      margin: 0;
      color: #333;
      font-size: 28px;
      font-weight: 700;
    }

    .header-actions {
      display: flex;
      gap: 15px;
    }

    .create-btn, .refresh-btn {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      font-size: 14px;
    }

    .create-btn:hover:not(:disabled),
    .refresh-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    .create-btn:disabled,
    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 15px;
      padding: 0;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      animation: modalSlideIn 0.3s ease;
    }

    @keyframes modalSlideIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }

    .modal-header {
      padding: 20px 25px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
      font-size: 20px;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
    }

    .close-btn:hover {
      background: #f5f5f5;
      color: #333;
    }

    .create-form {
      padding: 25px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #333;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.3s ease;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-weight: normal !important;
    }

    .checkbox-label input[type="checkbox"] {
      width: auto;
      margin: 0;
    }

    .checkbox-label small {
      color: #666;
      font-size: 12px;
      margin-top: 5px;
    }

    .form-actions {
      display: flex;
      gap: 15px;
      justify-content: flex-end;
      margin-top: 30px;
    }

    .cancel-btn,
    .submit-btn {
      padding: 12px 25px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .cancel-btn {
      background: #6c757d;
      color: white;
    }

    .cancel-btn:hover {
      background: #5a6268;
    }

    .submit-btn {
      background: linear-gradient(45deg, #28a745, #20c997);
      color: white;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 3px 10px rgba(40, 167, 69, 0.3);
    }

    .submit-btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    /* Navigation Tabs */
    .nav-tabs {
      display: flex;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 10px;
      padding: 5px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .tab-btn {
      flex: 1;
      background: none;
      border: none;
      padding: 15px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      color: #666;
    }

    .tab-btn.active {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
    }

    .tab-btn:hover:not(.active) {
      background: rgba(102, 126, 234, 0.1);
      color: #333;
    }

    /* Alerts */
    .error-alert,
    .success-alert {
      padding: 15px 20px;
      margin-bottom: 20px;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      animation: slideIn 0.3s ease;
    }

    .error-alert {
      background: #fee;
      border: 1px solid #fcc;
      color: #a00;
    }

    .success-alert {
      background: #efe;
      border: 1px solid #cfc;
      color: #0a0;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Loading */
    .loading-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 40px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 10px;
      color: #666;
      font-weight: 500;
      margin-bottom: 20px;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Tab Content */
    .tab-content {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 15px;
      padding: 25px;
      min-height: 500px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    /* Search and Filters */
    .search-filters {
      display: flex;
      gap: 20px;
      margin-bottom: 25px;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-box {
      flex: 1;
      min-width: 250px;
    }

    .search-input {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #e9ecef;
      border-radius: 25px;
      font-size: 14px;
      transition: border-color 0.3s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .filter-options {
      display: flex;
      gap: 15px;
    }

    .filter-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-weight: 500;
      color: #555;
    }

    /* Communities Grid */
    .communities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .community-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .community-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
    }

    .community-card.joined {
      border-color: #28a745;
      background: linear-gradient(145deg, #f8fff8, #ffffff);
    }

    .community-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }

    .community-header h3 {
      margin: 0;
      color: #333;
      font-size: 18px;
      font-weight: 700;
      flex: 1;
      line-height: 1.3;
    }

    .community-type {
      background: #e9ecef;
      color: #495057;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 10px;
      white-space: nowrap;
    }

    .community-type.public {
      background: #d4edda;
      color: #155724;
    }

    .community-info {
      margin-bottom: 15px;
    }

    .company-name {
      margin: 0 0 8px 0;
      color: #667eea;
      font-weight: 600;
      font-size: 14px;
    }

    .description {
      margin: 0;
      color: #666;
      font-size: 14px;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .community-stats {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
    }

    .stat {
      background: #f8f9fa;
      padding: 6px 10px;
      border-radius: 15px;
      font-size: 12px;
      color: #555;
      font-weight: 500;
    }

    .community-actions {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }

    .join-btn,
    .leave-btn,
    .chat-btn {
      padding: 8px 15px;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
      transition: all 0.3s ease;
    }

    .join-btn {
      background: linear-gradient(45deg, #28a745, #20c997);
      color: white;
      flex: 1;
    }

    .join-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 3px 10px rgba(40, 167, 69, 0.3);
    }

    .leave-btn {
      background: linear-gradient(45deg, #dc3545, #c82333);
      color: white;
    }

    .leave-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 3px 10px rgba(220, 53, 69, 0.3);
    }

    .chat-btn {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      flex: 1;
    }

    .chat-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 10px rgba(102, 126, 234, 0.3);
    }

    .join-btn:disabled,
    .leave-btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .community-footer {
      color: #999;
      font-size: 11px;
      border-top: 1px solid #f0f0f0;
      padding-top: 10px;
    }

    /* My Communities */
    .my-communities-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .membership-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      border-left: 4px solid #667eea;
      transition: all 0.3s ease;
    }

    .membership-card:hover {
      transform: translateX(3px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    }

    .membership-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .membership-header h3 {
      margin: 0;
      color: #333;
      font-size: 18px;
      font-weight: 700;
    }

    .role-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .role-badge.admin {
      background: #dc3545;
      color: white;
    }

    .role-badge.moderator {
      background: #ffc107;
      color: #212529;
    }

    .role-badge.member {
      background: #28a745;
      color: white;
    }

    .membership-info {
      margin-bottom: 15px;
    }

    .joined-date {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .membership-actions {
      display: flex;
      gap: 10px;
    }

    /* Empty States */
    .no-communities {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-state {
      color: #666;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 15px;
    }

    .empty-state h3 {
      margin: 0 0 10px 0;
      color: #444;
      font-size: 20px;
    }

    .empty-state p {
      margin: 0 0 20px 0;
      color: #888;
    }

    .discover-btn {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 12px 25px;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .discover-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
    }

    /* Company Community Styles */
    .company-community-section {
      text-align: center;
    }

    .company-community-header {
      margin-bottom: 20px;
    }

    .company-community-header h2 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 24px;
      font-weight: 700;
    }

    .company-community-description {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 25px;
    }

    .company-community-description p {
      margin: 0;
      color: #555;
      font-size: 16px;
      line-height: 1.6;
    }

    .company-community-actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    .chat-btn.large {
      padding: 15px 30px;
      font-size: 16px;
      background: linear-gradient(45deg, #667eea, #764ba2);
    }

    .members-btn {
      background: linear-gradient(45deg, #28a745, #20c997);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .members-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 10px rgba(40, 167, 69, 0.3);
    }

    .community-management {
      background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
      padding: 25px;
      border-radius: 12px;
      text-align: left;
    }

    .community-management h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 18px;
      font-weight: 700;
    }

    .management-info {
      margin: 0;
      color: #666;
      line-height: 1.6;
    }

    .no-company-community {
      text-align: center;
      padding: 60px 20px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .communities-container {
        padding: 10px;
      }

      .communities-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }

      .header-actions {
        flex-wrap: wrap;
        justify-content: center;
      }

      .search-filters {
        flex-direction: column;
        align-items: stretch;
      }

      .communities-grid {
        grid-template-columns: 1fr;
      }

      .nav-tabs {
        flex-direction: column;
      }

      .modal-content {
        width: 95%;
        margin: 10px;
      }
    }
  `]
})
export class CommunitiesComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private baseUrl = 'http://localhost:8081/api';

  // Reactive signals
  communities = signal<Community[]>([]);
  filteredCommunities = signal<Community[]>([]);
  myCommunities = signal<CommunityMembership[]>([]);
  companyCommunity = signal<Community | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  activeTab = signal<'discover' | 'my-communities' | 'company-community'>('discover');
  showingCreateForm = signal(false);

  // Form data
  newCommunity = signal<CreateCommunityRequest>({
    name: '',
    description: '',
    isPublic: true
  });

  // Getter/setter properties for two-way binding
  get communityName(): string {
    return this.newCommunity().name;
  }
  set communityName(value: string) {
    this.newCommunity.update(community => ({ ...community, name: value }));
  }

  get communityDescription(): string {
    return this.newCommunity().description;
  }
  set communityDescription(value: string) {
    this.newCommunity.update(community => ({ ...community, description: value }));
  }

  get communityIsPublic(): boolean {
    return this.newCommunity().isPublic;
  }
  set communityIsPublic(value: boolean) {
    this.newCommunity.update(community => ({ ...community, isPublic: value }));
  }

  // Search and filter
  searchQuery = signal('');
  showPublicOnly = signal(false);

  // User info
  private currentUserId: number | null = null;
  private userRole: string | null = null;

  ngOnInit() {
    this.initializeUser();
    this.loadCommunities();
    this.loadMyCommunities();
    if (this.isCompany()) {
      this.loadCompanyCommunity();
    }
  }

  private initializeUser() {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip during SSR
    }
    
    const userIdStr = localStorage.getItem('user_id');
    this.currentUserId = userIdStr ? parseInt(userIdStr) : null;
    this.userRole = localStorage.getItem('user_role');
    
    if (!this.currentUserId) {
      this.setError('Unable to identify user. Please log in again.');
    }
  }

  private getAuthHeaders(): HttpHeaders {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Cannot access localStorage during SSR');
    }
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  isCompany(): boolean {
    return this.userRole === 'COMPANY';
  }

  async loadCommunities() {
    try {
      this.isLoading.set(true);
      this.clearError();

      const response = await this.http.get<Community[]>(`${this.baseUrl}/communities/public`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      this.communities.set(response || []);
      this.filterCommunities();
    } catch (error: any) {
      console.error('Error loading communities:', error);
      this.setError('Failed to load communities. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadMyCommunities() {
    try {
      const response = await this.http.get<CommunityMembership[]>(`${this.baseUrl}/communities/my-communities`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      this.myCommunities.set(response || []);
    } catch (error: any) {
      console.error('Error loading my communities:', error);
    }
  }

  async loadCompanyCommunity() {
    if (!this.isCompany()) return;
    
    try {
      const response = await this.http.get<Community>(`${this.baseUrl}/communities/company-community`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      this.companyCommunity.set(response || null);
    } catch (error: any) {
      console.error('Error loading company community:', error);
      this.companyCommunity.set(null);
    }
  }

  filterCommunities() {
    let filtered = this.communities();
    
    // Apply search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(community => 
        community.name.toLowerCase().includes(query) ||
        community.description.toLowerCase().includes(query) ||
        community.companyName.toLowerCase().includes(query)
      );
    }

    // Apply public only filter
    if (this.showPublicOnly()) {
      filtered = filtered.filter(community => community.isPublic);
    }

    this.filteredCommunities.set(filtered);
  }

  async createCommunity() {
    if (!this.canCreateCommunity()) return;

    try {
      this.isLoading.set(true);
      this.clearError();

      const response = await this.http.post<Community>(`${this.baseUrl}/communities/create`, 
        this.newCommunity(),
        { headers: this.getAuthHeaders() }
      ).toPromise();

      this.setSuccess('Community created successfully!');
      this.hideCreateForm();
      this.resetCreateForm();
      await this.loadCommunities();
      await this.loadMyCommunities();
    } catch (error: any) {
      console.error('Error creating community:', error);
      this.setError('Failed to create community. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async joinCommunity(communityId: number) {
    try {
      this.isLoading.set(true);
      this.clearError();

      await this.http.post(`${this.baseUrl}/communities/${communityId}/join`, {}, {
        headers: this.getAuthHeaders()
      }).toPromise();

      this.setSuccess('Successfully joined the community!');
      await this.loadCommunities();
      await this.loadMyCommunities();
    } catch (error: any) {
      console.error('Error joining community:', error);
      this.setError('Failed to join community. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async leaveCommunity(communityId: number) {
    if (!confirm('Are you sure you want to leave this community?')) return;

    try {
      this.isLoading.set(true);
      this.clearError();

      await this.http.post(`${this.baseUrl}/communities/${communityId}/leave`, {}, {
        headers: this.getAuthHeaders()
      }).toPromise();

      this.setSuccess('Successfully left the community.');
      await this.loadCommunities();
      await this.loadMyCommunities();
    } catch (error: any) {
      console.error('Error leaving community:', error);
      this.setError('Failed to leave community. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  openCommunityChat(communityId: number, communityName: string) {
    // Navigate to community-specific chat
    // For now, we'll store the community info and navigate to the existing chat
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('active_community_id', communityId.toString());
      localStorage.setItem('active_community_name', communityName);
    }
    this.router.navigate(['/community-chat']);
  }

  async refreshCommunities() {
    await Promise.all([
      this.loadCommunities(),
      this.loadMyCommunities()
    ]);
    if (this.isCompany()) {
      await this.loadCompanyCommunity();
    }
    this.setSuccess('Communities refreshed!');
  }

  async refreshCompanyCommunity() {
    await this.loadCompanyCommunity();
    this.setSuccess('Company community refreshed!');
  }

  async viewCommunityMembers(communityId: number) {
    try {
      this.isLoading.set(true);
      const response = await this.http.get<any[]>(`${this.baseUrl}/communities/${communityId}/members`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      const membersList = response?.map(member => 
        `${member.username} (${member.role}) - joined ${this.formatDate(member.joinedAt)}`
      ).join('\n') || 'No members found';

      alert(`Community Members:\n\n${membersList}`);
    } catch (error: any) {
      console.error('Error loading community members:', error);
      this.setError('Failed to load community members.');
    } finally {
      this.isLoading.set(false);
    }
  }

  setActiveTab(tab: 'discover' | 'my-communities' | 'company-community') {
    this.activeTab.set(tab);
  }

  showCreateForm() {
    this.showingCreateForm.set(true);
  }

  hideCreateForm() {
    this.showingCreateForm.set(false);
    this.resetCreateForm();
  }

  resetCreateForm() {
    this.newCommunity.set({
      name: '',
      description: '',
      isPublic: true
    });
  }

  canCreateCommunity(): boolean {
    const community = this.newCommunity();
    return community.name.trim().length > 0 && 
           community.description.trim().length > 0;
  }

  // Utility methods
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  formatRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'ADMIN': '👑 Admin',
      'MODERATOR': '🛡️ Moderator',
      'MEMBER': '👤 Member'
    };
    return roleMap[role] || role;
  }

  trackCommunity(index: number, community: Community): number {
    return community.id;
  }

  trackMembership(index: number, membership: CommunityMembership): number {
    return membership.id;
  }

  private setError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.clearError(), 5000);
  }

  private setSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.clearSuccess(), 3000);
  }

  clearError() {
    this.errorMessage.set('');
  }

  clearSuccess() {
    this.successMessage.set('');
  }
}
