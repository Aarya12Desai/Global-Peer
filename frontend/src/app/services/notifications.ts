import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from './auth';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'post' | 'system' | 'project_match';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  avatar?: string;
  userName?: string;
  userId?: string;
  actionUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Notifications {
  private notificationsSignal = signal<Notification[]>([]);

  constructor(private http: HttpClient, private auth: Auth) {
    this.fetchUserNotifications();
  }

  get notifications() {
    return this.notificationsSignal();
  }

  get unreadCount() {
    return this.notificationsSignal().filter(n => !n.read).length;
  }


  fetchUserNotifications() {
    const token = this.auth.token;
    if (!token) {
      this.notificationsSignal.set([]);
      return;
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    this.http.get<Notification[]>(`http://localhost:8081/api/notifications`, { headers })
      .subscribe({
        next: (notifications) => {
          this.notificationsSignal.set(notifications);
        },
        error: (err) => {
          console.error('Failed to fetch notifications:', err);
          this.notificationsSignal.set([]);
        }
      });
  }

  markAsRead(notificationId: string) {
    const notifications = this.notificationsSignal();
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );
    this.notificationsSignal.set(updatedNotifications);
  }

  markAllAsRead() {
    const notifications = this.notificationsSignal();
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));
    this.notificationsSignal.set(updatedNotifications);
  }

  deleteNotification(notificationId: string) {
    const token = this.auth.token;
    if (!token) return;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.delete(`http://localhost:8081/api/notifications/${notificationId}`, { headers })
      .subscribe({
        next: () => {
          // Refresh notifications after successful delete
          this.fetchUserNotifications();
        },
        error: (err) => {
          console.error('Failed to delete notification:', err);
        }
      });
  }

  clearNotifications() {
    this.notificationsSignal.set([]);
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>) {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    const notifications = this.notificationsSignal();
    this.notificationsSignal.set([newNotification, ...notifications]);
  }

  getNotificationIcon(type: Notification['type']): string {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👥';
      case 'mention':
        return '@';
      case 'post':
        return '📄';
      case 'project_match':
        return '🤝';
      case 'system':
      default:
        return '🔔';
    }
  }

  formatTimeAgo(timestamp: Date | string | undefined | null): string {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  }
}
