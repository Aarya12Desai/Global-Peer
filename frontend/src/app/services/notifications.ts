import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'post' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  avatar?: string;
  userName?: string;
  actionUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Notifications {
  private notificationsSignal = signal<Notification[]>([]);

  constructor() {
    // Initialize with some sample notifications
    this.loadSampleNotifications();
  }

  get notifications() {
    return this.notificationsSignal();
  }

  get unreadCount() {
    return this.notificationsSignal().filter(n => !n.read).length;
  }

  private loadSampleNotifications() {
    const sampleNotifications: Notification[] = [
      {
        id: '1',
        type: 'like',
        title: 'New Like',
        message: 'John Doe liked your post',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false,
        userName: 'John Doe',
        avatar: 'JD'
      },
      {
        id: '2',
        type: 'comment',
        title: 'New Comment',
        message: 'Sarah Miller commented on your post: "Great work on this project!"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: false,
        userName: 'Sarah Miller',
        avatar: 'SM'
      },
      {
        id: '3',
        type: 'follow',
        title: 'New Follower',
        message: 'Alex Johnson started following you',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        read: true,
        userName: 'Alex Johnson',
        avatar: 'AJ'
      },
      {
        id: '4',
        type: 'mention',
        title: 'You were mentioned',
        message: 'Mike Wilson mentioned you in a post',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: true,
        userName: 'Mike Wilson',
        avatar: 'MW'
      },
      {
        id: '5',
        type: 'system',
        title: 'Welcome to CrewUp!',
        message: 'Complete your profile to get the most out of CrewUp',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        read: true,
        avatar: 'CU'
      },
      {
        id: '6',
        type: 'post',
        title: 'Popular Post',
        message: 'Your post "Project Launch" has reached 50 likes!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        read: true
      }
    ];

    this.notificationsSignal.set(sampleNotifications);
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
    const notifications = this.notificationsSignal();
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    this.notificationsSignal.set(updatedNotifications);
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
      case 'system':
      default:
        return '🔔';
    }
  }

  formatTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
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
