import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  console.log('AuthGuard checking authentication...');
  
  // Check if we're in a browser environment
  if (!isPlatformBrowser(platformId)) {
    // During SSR, allow access and let client-side handle auth
    return true;
  }
  
  // Check localStorage only in browser environment
  const token = localStorage.getItem('access_token');
  const userId = localStorage.getItem('user_id');
  
  console.log('Token exists:', !!token);
  console.log('User ID exists:', !!userId);
  console.log('Service isLoggedIn:', authService.isLoggedIn);

  if (token && userId) {
    console.log('AuthGuard: Access granted');
    return true;
  } else {
    console.log('AuthGuard: Access denied, redirecting to login');
    router.navigate(['/login']);
    return false;
  }
};