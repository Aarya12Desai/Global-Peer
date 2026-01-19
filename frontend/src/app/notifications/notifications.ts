import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Messages } from '../services/messages';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '../services/auth';
import { CommonModule } from '@angular/common';
import { Notifications as NotificationsService, Notification } from '../services/notifications';
import { ProjectNotificationService } from '../services/project-notification.service';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class NotificationsComponent {
  selectedFilter: string = 'all';

  constructor(
    private notificationsService: NotificationsService,
    private projectNotificationService: ProjectNotificationService,
    private router: Router,
    private messagesService: Messages,
    private http: HttpClient,
    private auth: Auth
  ) {}

  get notifications(): Notification[] {
    let filtered = this.notificationsService.notifications;
    
    switch (this.selectedFilter) {
      case 'unread':
        return filtered.filter(n => !n.read);
      case 'like':
      case 'comment':
      case 'follow':
      case 'mention':
      case 'post':
      case 'system':
      case 'project_match':
        return filtered.filter(n => n.type === this.selectedFilter);
      default:
        return filtered;
    }
  }

  get unreadCount(): number {
    return this.notificationsService.unreadCount;
  }


  markAsRead(notificationId: string): void {
    this.notificationsService.markAsRead(notificationId);
  }

  onNotificationClick(notification: Notification, event: Event): void {
    if (notification.type === 'project_match' && notification.userName) {
      this.markAsRead(notification.id);
      this.messageMatchedUser(notification, event);
    } else {
      this.markAsRead(notification.id);
    }
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead();
  }


  deleteNotification(notificationId: string, event: Event): void {
    event.stopPropagation(); // Prevent triggering markAsRead
    this.notificationsService.deleteNotification(notificationId);
  }

  async messageMatchedUser(notification: Notification, event?: Event): Promise<void> {
    if (event) event.stopPropagation();
    // Use userId for chat navigation and backend fetch
  const participantId = notification.userId || notification.userName;
    const participantName = notification.userName;
    const participantAvatar = notification.avatar || (participantName ? participantName.substring(0, 2).toUpperCase() : '');

    // Fetch conversation from backend using userId
    const token = this.auth.token;
    if (!token || !participantId) {
      this.router.navigate(['/messages'], { queryParams: { user: participantId } });
      return;
    }
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<any[]>(`http://localhost:8081/api/messages/conversation/${participantId}`, { headers })
      .subscribe({
        next: (messages) => {
          // Build conversation object
          const conv = {
            id: `conv-${participantId}`,
            participantId: participantId,
            participantName: participantName || '',
            participantAvatar: participantAvatar,
            lastMessage: messages.length > 0 ? messages[messages.length-1].content : '',
            lastMessageTime: messages.length > 0 ? new Date(messages[messages.length-1].createdAt) : new Date(),
            unreadCount: 0,
            online: false,
            messages: messages.map(msg => ({
              id: msg.id,
              senderId: msg.sender.id,
              senderName: msg.sender.username,
              senderAvatar: msg.sender.username ? msg.sender.username.substring(0,2).toUpperCase() : '',
              content: msg.content,
              timestamp: new Date(msg.createdAt),
              read: true,
              type: 'text' as 'text'
            }))
          };
          this.messagesService.addConversation(conv);
          this.router.navigate(['/messages'], { queryParams: { user: participantId } });
        },
        error: () => {
          // fallback to just open chat
          this.router.navigate(['/messages'], { queryParams: { user: participantId } });
        }
      });
  }

  setFilter(filter: string): void {
    this.selectedFilter = filter;
  }

  getNotificationIcon(type: Notification['type']): string {
    return this.notificationsService.getNotificationIcon(type);
  }

  formatTimeAgo(timestamp: Date): string {
    return this.notificationsService.formatTimeAgo(timestamp);
  }

  getCountByType(type: Notification['type']): number {
    return this.notificationsService.notifications.filter(n => n.type === type).length;
  }

  getTodayCount(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.notificationsService.notifications.filter(n => 
      n.timestamp >= today
    ).length;
  }

  getThisWeekCount(): number {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return this.notificationsService.notifications.filter(n => 
      n.timestamp >= weekAgo
    ).length;
  }

}
