import { Injectable } from '@angular/core';
import { Notifications } from './notifications';

@Injectable({
  providedIn: 'root'
})
export class ProjectNotificationService {
  constructor(private notifications: Notifications) {}

  /**
   * Refresh notifications from backend for the current user
   */
  refreshUserNotifications() {
    this.notifications.fetchUserNotifications();
  }
}
