import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private API_BASE_URL = 'http://localhost:8081/api/auth';
  private isBrowser: boolean;
  // Observable auth state for UI to react to login/logout
  public authState: BehaviorSubject<boolean>;
  public currentUser$: BehaviorSubject<any>;

  constructor(
    private http: HttpClient, 
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  this.authState = new BehaviorSubject<boolean>(this.isLoggedIn);
  this.currentUser$ = new BehaviorSubject<any>(this.currentUser);
  }

  signup(username: string, email: string, password: string): Observable<any> {
    const signupData = { username, email, password };
    return this.http.post<any>(`${this.API_BASE_URL}/register`, signupData);
  }

  login(email: string, password: string, role?: string): Observable<any> {
    const loginData: any = { email, password };
    if (role) loginData.role = role;
    
    return this.http.post<any>(`${this.API_BASE_URL}/login`, loginData).pipe(
      tap(response => {
        console.log('Login response received:', response);
        if (response && response.token && this.isBrowser) {
          localStorage.setItem('access_token', response.token);
          localStorage.setItem('user_email', response.email);
          localStorage.setItem('username', response.username);
          localStorage.setItem('user_role', response.role);
          console.log('Authentication data stored successfully');
          console.log('Token stored:', localStorage.getItem('access_token') ? 'YES' : 'NO');
          // emit new auth state and current user
          this.authState.next(true);
          this.currentUser$.next({
            email: response.email,
            username: response.username,
            role: response.role
          });
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }

  logout(): void {
    console.log('Logging out user...');
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('username');
      localStorage.removeItem('user_role');
    }
  // update observable state so UI updates immediately
  if (this.authState) this.authState.next(false);
  if (this.currentUser$) this.currentUser$.next(null);
  this.router.navigate(['/']);
  }

  get isLoggedIn(): boolean {
    if (!this.isBrowser) return false;
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  get token(): string | null {
    if (!this.isBrowser) return null;
    const token = localStorage.getItem('access_token');
    return token;
  }

  get currentUser(): any {
    if (this.isLoggedIn && this.isBrowser) {
      return {
        email: localStorage.getItem('user_email'),
        username: localStorage.getItem('username'),
        role: localStorage.getItem('user_role')
      };
    }
    return null;
  }
}