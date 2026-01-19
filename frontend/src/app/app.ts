
import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Auth } from './services/auth';
import { Notifications } from './services/notifications';
import { Messages } from './services/messages';
import { CreateProjectComponent } from './components/create-project.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, FormsModule, CommonModule, AsyncPipe, CreateProjectComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');

  constructor(
    public authService: Auth,
    private notificationsService: Notifications,
    private messagesService: Messages
  ) {}

  showCreateProject = false;

  get isLoggedIn() {
    return this.authService.isLoggedIn;
  }

  get currentUser() {
    return this.authService.currentUser;
  }

  get unreadNotificationsCount() {
    return this.notificationsService.unreadCount;
  }

  get totalUnreadMessages() {
    return this.messagesService.totalUnreadCount;
  }

  logout() {
    this.authService.logout();
  }

  getUserRole(): string | null {
    const user = this.authService.currentUser;
    return user ? user.role : null;
  }
}
