import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { Signup } from './signup/signup';
import { Landing } from './landing/landing';
import { Home } from './home/home';
import { NotificationsComponent } from './notifications/notifications';
import { Messages } from './messages/messages';
import { ProjectsComponent } from './projects/projects';
import { authGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { CompanySignupComponent } from './company-signup/company-signup';
import { CompanyLoginComponent } from './company-login/company-login';
import { CompanyHomeComponent } from './company-home/company-home';
import { CompanyProjectsComponent } from './company-projects/company-projects';
import { CompanyCreateProjectComponent } from './company-create-project/company-create-project';
import { CommunityChatComponent } from './community-chat/community-chat';
import { UserCreateProjectComponent } from './user-create-project/user-create-project';

import { AiMatchingComponent } from './ai-matching/ai-matching.component';
import { UserProjectsBrowseComponent } from './user-projects-browse/user-projects-browse';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'login', component: LoginComponent, canActivate: [GuestGuard] },
  { path: 'company-login', component: CompanyLoginComponent, canActivate: [GuestGuard] },
  { path: 'signup', component: Signup, canActivate: [GuestGuard] },
  { path: 'signupCompany', component: CompanySignupComponent, canActivate: [GuestGuard] },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'projects', component: ProjectsComponent, canActivate: [authGuard] },
  { path: 'create-project', component: UserCreateProjectComponent, canActivate: [authGuard] },
  { path: 'browse-projects', component: UserProjectsBrowseComponent, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
  { path: 'messages', component: Messages, canActivate: [authGuard] },
  { path: 'ai-matching', component: AiMatchingComponent, canActivate: [authGuard] },
  
  // Company routes
  { path: 'company/home', component: CompanyHomeComponent, canActivate: [authGuard] },
  { path: 'company/projects', component: CompanyProjectsComponent, canActivate: [authGuard] },
  { path: 'company/create-project', component: CompanyCreateProjectComponent, canActivate: [authGuard] },
  { path: 'company/community-chat', component: CommunityChatComponent, canActivate: [authGuard] },
  
  { path: '**', redirectTo: '' }
];
