import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  console.log('AuthGuard checking authentication...');
  console.log('Is logged in:', authService.isLoggedIn);
  console.log('Has token:', !!authService.token);

  if (authService.isLoggedIn && authService.token) {
    console.log('AuthGuard: Access granted');
    return true;
  } else {
    console.log('AuthGuard: Access denied, redirecting to login');
    router.navigate(['/login']);
    return false;
  }
};