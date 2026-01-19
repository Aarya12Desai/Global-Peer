import { Component, signal, OnInit, OnDestroy, inject, ElementRef, ViewChild, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';

interface ChatMessage {
  id: number;
  message: string;
  senderId: number;
  senderCompanyName: string;
  createdAt: string;
  isEdited: boolean;
  editedAt?: string;
}

interface ChatStats {
  totalMessages: number;
  recentMessages: number;
}

@Component({
  selector: 'app-community-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="community-chat-container">
      <!-- Header -->
      <div class="chat-header">
        <div class="chat-title">
          <h2>{{ activeCommunityName() ? '�️ ' + activeCommunityName() : '�🌐 Community Chat' }}</h2>
          <!-- Removed browse/choose community notice for company -->
        </div>
  <!-- Removed chat-stats, refresh, test, total, and time UI -->
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage()" class="error-alert">
        <span>⚠️ {{ errorMessage() }}</span>
        <button (click)="clearError()" class="close-btn">×</button>
      </div>

      <!-- Success Message -->
      <div *ngIf="successMessage()" class="success-alert">
        <span>✅ {{ successMessage() }}</span>
        <button (click)="clearSuccess()" class="close-btn">×</button>
      </div>

      <!-- Loading Indicator -->
      <div *ngIf="isLoading()" class="loading-indicator">
        <div class="spinner"></div>
        <span>Loading messages...</span>
      </div>

      <!-- Messages Area -->
      <div class="chat-messages" #messagesContainer>
        <div *ngIf="messages().length === 0 && !isLoading()" class="no-messages">
          <div class="empty-state">
            <div class="empty-icon">💬</div>
            <h3>No messages yet</h3>
            <p>Be the first to start the conversation!</p>
            <!-- Removed browse communities button for company -->
          </div>
        </div>

        <div *ngFor="let message of messages(); trackBy: trackMessage" class="message" 
             [class.own-message]="isOwnMessage(message)"
             [class.editing]="editingMessageId() === message.id">
          
          <div class="message-header">
            <span class="company-name">{{ message.senderCompanyName }}</span>
            <span class="timestamp">{{ formatDate(message.createdAt) }}</span>
            <span *ngIf="message.isEdited" class="edited-indicator">(edited)</span>
          </div>

          <div class="message-content">
            <div *ngIf="editingMessageId() !== message.id" class="message-text">
              {{ message.message }}
            </div>
            
            <div *ngIf="editingMessageId() === message.id" class="edit-form">
              <textarea 
                [(ngModel)]="editMessageText" 
                class="edit-textarea"
                placeholder="Edit your message..."
                maxlength="1000"
                (keydown)="onEditKeydown($event)"
                (keydown.escape)="cancelEdit()">
              </textarea>
              <div class="edit-actions">
                <button (click)="saveEdit()" class="save-btn" [disabled]="!editMessageText().trim()">
                  💾 Save
                </button>
                <button (click)="cancelEdit()" class="cancel-btn">
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="isOwnMessage(message)" class="message-actions">
            <button (click)="startEdit(message)" class="edit-btn" title="Edit message">
              ✏️
            </button>
            <button (click)="deleteMessage(message.id)" class="delete-btn" title="Delete message"
                    (click)="$event.stopPropagation()">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- Message Input -->
  <div class="message-input-area">
        <div class="input-container">
          <textarea 
            [(ngModel)]="newMessage" 
            placeholder="Type your message here... (Ctrl+Enter to send)"
            class="message-input"
            maxlength="1000"
            rows="3"
            (keydown)="onMessageKeydown($event)"
            #messageInput>
          </textarea>
          <div class="input-actions">
            <button 
              (click)="sendMessage()" 
              class="send-btn"
              [disabled]="!newMessage().trim() || isLoading()">
              {{ isLoading() ? '⏳' : '📤' }} Send
            </button>
          </div>
        </div>
      </div>

      <!-- No Community Selected Message -->
  <!-- Removed choose/browse community input for company -->
    </div>
  `,
  styles: [`
    .community-chat-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .chat-header {
      background: rgba(255, 255, 255, 0.95);
      padding: 20px;
      border-radius: 15px 15px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      margin-bottom: 0;
    }

    .chat-title {
      flex: 1;
    }

    .chat-header h2 {
      margin: 0 0 5px 0;
      color: #333;
      font-size: 24px;
      font-weight: 600;
    }

    .no-community-notice {
      font-size: 14px;
      color: #dc3545;
      margin-top: 5px;
    }

    .no-community-notice a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    .no-community-notice a:hover {
      text-decoration: underline;
    }

    .chat-stats {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .stat-item {
      background: #f0f2f5;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 14px;
      color: #555;
      font-weight: 500;
    }

    .refresh-btn {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .refresh-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .test-btn {
      background: linear-gradient(45deg, #28a745, #20c997);
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .test-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(40, 167, 69, 0.2);
    }

    .test-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .back-btn {
      background: linear-gradient(45deg, #6c757d, #495057);
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .back-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(108, 117, 125, 0.2);
    }

    .error-alert, .success-alert {
      padding: 15px;
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

    .close-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 25px;
      height: 25px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 30px;
      background: rgba(255, 255, 255, 0.9);
      color: #666;
      font-weight: 500;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .chat-messages {
      background: rgba(255, 255, 255, 0.95);
      max-height: 500px;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .no-messages {
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
    }

    .empty-state p {
      margin: 0;
      color: #888;
    }

    .join-community-btn,
    .select-community-btn {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 12px 25px;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      margin-top: 15px;
    }

    .join-community-btn:hover,
    .select-community-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
    }

    /* No Community Input Area */
    .no-community-input {
      background: rgba(255, 255, 255, 0.95);
      padding: 30px;
      border-radius: 0 0 15px 15px;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .no-community-message {
      color: #666;
    }

    .no-community-message p {
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 500;
    }

    .message {
      background: #f8f9fa;
      border-radius: 15px;
      padding: 15px;
      position: relative;
      transition: all 0.3s ease;
      border: 1px solid #e9ecef;
    }

    .message:hover {
      box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }

    .message.own-message {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin-left: 20px;
    }

    .message.own-message .message-header .company-name {
      color: #fff;
      font-weight: 600;
    }

    .message.own-message .message-header .timestamp,
    .message.own-message .message-header .edited-indicator {
      color: rgba(255, 255, 255, 0.8);
    }

    .message.editing {
      border: 2px solid #667eea;
      background: #f0f4ff;
    }

    .message-header {
      display: flex;
      gap: 15px;
      align-items: center;
      margin-bottom: 10px;
      font-size: 13px;
    }

    .company-name {
      font-weight: 600;
      color: #333;
    }

    .timestamp {
      color: #666;
    }

    .edited-indicator {
      color: #888;
      font-style: italic;
    }

    .message-content {
      margin-bottom: 10px;
    }

    .message-text {
      word-wrap: break-word;
      line-height: 1.5;
    }

    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .edit-textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 8px;
      resize: vertical;
      min-height: 80px;
      font-family: inherit;
    }

    .edit-actions {
      display: flex;
      gap: 10px;
    }

    .save-btn, .cancel-btn {
      padding: 8px 15px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .save-btn {
      background: #28a745;
      color: white;
    }

    .save-btn:hover:not(:disabled) {
      background: #218838;
    }

    .save-btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .cancel-btn {
      background: #6c757d;
      color: white;
    }

    .cancel-btn:hover {
      background: #5a6268;
    }

    .message-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }

    .message:hover .message-actions {
      opacity: 1;
    }

    .edit-btn, .delete-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .edit-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .delete-btn:hover {
      background: rgba(220, 53, 69, 0.8);
    }

    .message-input-area {
      background: rgba(255, 255, 255, 0.95);
      padding: 20px;
      border-radius: 0 0 15px 15px;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    }

    .input-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .message-input {
      width: 100%;
      padding: 15px;
      border: 2px solid #e9ecef;
      border-radius: 10px;
      resize: vertical;
      font-family: inherit;
      font-size: 14px;
      transition: border-color 0.3s ease;
    }

    .message-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .input-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .char-count {
      font-size: 12px;
      color: #666;
    }

    .send-btn {
      background: linear-gradient(45deg, #28a745, #20c997);
      color: white;
      border: none;
      padding: 12px 25px;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .send-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
    }

    .send-btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    /* Scrollbar styling */
    .chat-messages::-webkit-scrollbar {
      width: 8px;
    }

    .chat-messages::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    .chat-messages::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }

    .chat-messages::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .community-chat-container {
        padding: 10px;
      }

      .chat-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }

      .chat-stats {
        flex-wrap: wrap;
        justify-content: center;
      }

      .message.own-message {
        margin-left: 10px;
      }

      .message-header {
        flex-wrap: wrap;
      }
    }
  `]
})
export class CommunityChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private baseUrl = 'http://localhost:8081/api/community-chat';
  
  // Reactive signals
  messages = signal<ChatMessage[]>([]);
  chatStats = signal<ChatStats>({ totalMessages: 0, recentMessages: 0 });
  newMessage = signal('');
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  editingMessageId = signal<number | null>(null);
  editMessageText = signal('');
  activeCommunityId = signal<number | null>(null);
  activeCommunityName = signal<string | null>(null);
  
  // Subscriptions
  private refreshSubscription?: Subscription;
  private currentUserId: number | null = null;

  ngOnInit() {
    this.initializeUser();
    this.checkActiveCommunity();
    this.loadMessages();
    this.loadChatStats();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  private initializeUser() {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip during SSR
    }
    
    const userIdStr = localStorage.getItem('user_id');
    this.currentUserId = userIdStr ? parseInt(userIdStr) : null;
    
    if (!this.currentUserId) {
      this.setError('Unable to identify user. Please log in again.');
    }
  }

  private checkActiveCommunity() {
    const communityId = localStorage.getItem('active_community_id');
    const communityName = localStorage.getItem('active_community_name');
    
    if (communityId && communityName) {
      this.activeCommunityId.set(parseInt(communityId));
      this.activeCommunityName.set(communityName);
    } else {
      this.activeCommunityId.set(null);
      this.activeCommunityName.set(null);
    }
  }

  private startAutoRefresh() {
    // Refresh messages every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadMessages();
      this.loadChatStats();
    });
  }

  private stopAutoRefresh() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  async loadMessages() {
    try {
      this.isLoading.set(true);
      this.clearError();

      let communityId = this.activeCommunityId();
      if (!communityId) {
        communityId = 0; // Use 0 as the default/global community
      }

      const response = await this.http.get<ChatMessage[]>(`${this.baseUrl}/${communityId}/messages`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      this.messages.set(response || []);
      this.scrollToBottom();
    } catch (error: any) {
      console.error('Error loading messages:', error);
      this.setError('Failed to load messages. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadChatStats() {
    try {
      // Only load stats if no specific community is selected (general stats)
      if (this.activeCommunityId()) {
        return; // Skip stats for specific communities
      }

      const response = await this.http.get<ChatStats>(`${this.baseUrl}/stats`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      this.chatStats.set(response || { totalMessages: 0, recentMessages: 0 });
    } catch (error: any) {
      console.error('Error loading chat stats:', error);
    }
  }

  async sendMessage() {
    const messageText = this.newMessage().trim();
    if (!messageText) return;

    // For company, allow sending even if no community is selected
    let communityId = this.activeCommunityId();
    if (!communityId) {
      communityId = 0; // Use 0 as the default/global community
    }

    try {
      this.isLoading.set(true);
      this.clearError();

      const response = await this.http.post<ChatMessage>(`${this.baseUrl}/${communityId}/send`, 
        { message: messageText },
        { headers: this.getAuthHeaders() }
      ).toPromise();

      this.newMessage.set('');
      this.setSuccess('Message sent successfully!');
      await this.loadMessages();
      this.scrollToBottom();
      
      // Focus back on input
      setTimeout(() => {
        if (this.messageInput) {
          this.messageInput.nativeElement.focus();
        }
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      this.setError('Failed to send message. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  startEdit(message: ChatMessage) {
    this.editingMessageId.set(message.id);
    this.editMessageText.set(message.message);
  }

  cancelEdit() {
    this.editingMessageId.set(null);
    this.editMessageText.set('');
  }

  async saveEdit() {
    const messageId = this.editingMessageId();
    const editedText = this.editMessageText().trim();
    
    if (!messageId || !editedText) return;

    try {
      this.isLoading.set(true);
      this.clearError();

      await this.http.put(`${this.baseUrl}/edit/${messageId}`, 
        { message: editedText },
        { headers: this.getAuthHeaders() }
      ).toPromise();

      this.editingMessageId.set(null);
      this.editMessageText.set('');
      this.setSuccess('Message updated successfully!');
      await this.loadMessages();
    } catch (error: any) {
      console.error('Error editing message:', error);
      this.setError('Failed to edit message. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteMessage(messageId: number) {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      this.isLoading.set(true);
      this.clearError();

      await this.http.delete(`${this.baseUrl}/delete/${messageId}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      this.setSuccess('Message deleted successfully!');
      await this.loadMessages();
      await this.loadChatStats();
    } catch (error: any) {
      console.error('Error deleting message:', error);
      this.setError('Failed to delete message. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async refreshMessages() {
    await this.loadMessages();
    this.setSuccess('Messages refreshed!');
  }

  async createTestMessage() {
    try {
      this.isLoading.set(true);
      this.clearError();

      await this.http.post(`${this.baseUrl}/test-message`, {}, {
        headers: this.getAuthHeaders()
      }).toPromise();

      this.setSuccess('Test message created successfully!');
      await this.loadMessages();
    } catch (error: any) {
      console.error('Error creating test message:', error);
      this.setError('Failed to create test message. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  goBackToCommunities() {
    // Clear active community selection
    localStorage.removeItem('active_community_id');
    localStorage.removeItem('active_community_name');
    this.router.navigate(['/communities']);
  }

  // Utility methods
  isOwnMessage(message: ChatMessage): boolean {
    return this.currentUserId !== null && message.senderId === this.currentUserId;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  trackMessage(index: number, message: ChatMessage): number {
    return message.id;
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
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

  onEditKeydown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'Enter') {
      this.saveEdit();
    }
  }

  onMessageKeydown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'Enter') {
      this.sendMessage();
    }
  }
}
