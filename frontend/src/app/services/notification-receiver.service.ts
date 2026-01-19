import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notifications } from './notifications';
import { Auth } from './auth';

export interface BackendNotification {
  id: string;
  userId: number;
  title: string;
  message: string;
  type: string;
  timestamp: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationReceiverService {
  private apiUrl = 'http://localhost:8081/api';

  constructor(
    private http: HttpClient,
    private notificationsService: Notifications,
    private auth: Auth
  ) {}

  /**
   * Fetch notifications from backend for the current user
   */
  fetchUserNotifications(): Observable<BackendNotification[]> {
    const token = this.auth.token;
    if (!token) return new Observable<BackendNotification[]>(subscriber => { subscriber.next([]); subscriber.complete(); });
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get<BackendNotification[]>(`${this.apiUrl}/notifications`, { headers });
  }

  /**
   * Convert backend notification to frontend notification format
   */
  private convertBackendNotification(backendNotification: BackendNotification) {
    return {
      id: backendNotification.id,
      type: this.mapNotificationType(backendNotification.type),
      title: backendNotification.title,
      message: backendNotification.message,
      timestamp: new Date(backendNotification.timestamp),
      read: backendNotification.read,
      userName: this.extractUserNameFromMessage(backendNotification.message)
    };
  }

  /**
   * Map backend notification types to frontend types
   */
  private mapNotificationType(backendType: string): 'like' | 'comment' | 'follow' | 'mention' | 'post' | 'system' | 'project_match' {
    switch (backendType.toLowerCase()) {
      case 'project_match':
        return 'project_match';
      case 'like':
        return 'like';
      case 'comment':
        return 'comment';
      case 'follow':
        return 'follow';
      case 'mention':
        return 'mention';
      case 'post':
        return 'post';
      default:
        return 'system';
    }
  }

  /**
   * Extract username from notification message for display
   */
  private extractUserNameFromMessage(message: string): string | undefined {
    // Try to extract username from project match messages
    const createdByMatch = message.match(/created by (\w+)/);
    if (createdByMatch) {
      return createdByMatch[1];
    }
    
    // For other notification types, return undefined
    return undefined;
  }

  /**
   * Load notifications from backend and add them to the frontend service
   */
  loadNotificationsFromBackend(): void {
    this.fetchUserNotifications().subscribe({
      next: (backendNotifications) => {
        // Clear existing notifications and add the new ones
        this.notificationsService.clearNotifications();
        backendNotifications.forEach(backendNotification => {
          const frontendNotification = this.convertBackendNotification(backendNotification);
          this.notificationsService.addNotification(frontendNotification);
        });
      },
      error: (error) => {
        console.error('Failed to load notifications from backend:', error);
      }
    });
  }

  /**
   * Simulate receiving a new project match notification
   * This would typically be called from a WebSocket or polling mechanism
   */
  simulateProjectMatchNotification(projectName: string, matchedProjectName: string, creatorName: string, similarity: number): void {
    this.notificationsService.addNotification({
      type: 'project_match',
      title: 'Project Match Found',
      message: `Your project '${projectName}' has a ${similarity}% match with '${matchedProjectName}' created by ${creatorName}. Consider reaching out for potential collaboration!`,
      read: false,
      userName: creatorName
    });
  }

  /**
   * Mark notification as read on backend
   */
  markNotificationAsRead(notificationId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/${notificationId}/read`, {});
  }

  /**
   * Mark all notifications as read on backend
   */
  markAllNotificationsAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/read-all`, {});
  }

  /**
   * Delete notification on backend
   */
  deleteNotificationOnBackend(notificationId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notifications/${notificationId}`);
  }
}
