import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notifications as NotificationsService, Notification } from '../services/notifications';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class NotificationsComponent {
  selectedFilter: string = 'all';

  constructor(private notificationsService: NotificationsService) {}

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

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead();
  }

  deleteNotification(notificationId: string, event: Event): void {
    event.stopPropagation(); // Prevent triggering markAsRead
    this.notificationsService.deleteNotification(notificationId);
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
