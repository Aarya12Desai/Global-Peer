import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { Signup } from './signup/signup';
import { Landing } from './landing/landing';
import { Home } from './home/home';
import { NotificationsComponent } from './notifications/notifications';
import { Messages } from './messages/messages';
import { authGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'login', component: LoginComponent, canActivate: [GuestGuard] },
  { path: 'signup', component: Signup, canActivate: [GuestGuard] },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
  { path: 'messages', component: Messages, canActivate: [authGuard] },
  { path: '**', redirectTo: '' } // Wildcard route for handling invalid URLs
];