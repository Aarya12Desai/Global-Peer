
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Auth } from '../services/auth';

@Component({
  selector: 'app-company-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company-signup.html',
  styleUrl: './company-signup.css'
})
export class CompanySignupComponent {
  signupForm: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private auth: Auth
  ) {
    this.signupForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      companyWebsite: ['', [Validators.pattern('https?://.+')]],
      companyContactName: ['', [Validators.required]],
      companyContactPhone: ['', [Validators.required]]
    });
  }

  submit() {
    if (this.signupForm.invalid) return;
    this.loading = true;
    this.error = null;
    this.success = null;
    const data = this.signupForm.value;
    this.http.post<any>('http://localhost:8081/api/auth/company-signup', data).subscribe({
      next: (response) => {
        this.success = 'Company registration successful! Logging you in...';
        this.loading = false;
        
        // Store the JWT token and redirect to company dashboard
        if (response && response.token) {
          localStorage.setItem('access_token', response.token);
          localStorage.setItem('user_email', response.email);
          localStorage.setItem('username', response.username);
          localStorage.setItem('user_role', response.role);
          localStorage.setItem('company_name', response.companyName);
          localStorage.setItem('company_website', response.companyWebsite);
          localStorage.setItem('company_contact_name', response.companyContactName);
          localStorage.setItem('company_contact_phone', response.companyContactPhone);
          
          // Update auth service state
          this.auth.authState.next(true);
          this.auth.currentUser$.next({
            email: response.email,
            username: response.username,
            role: response.role,
            companyName: response.companyName,
            companyWebsite: response.companyWebsite,
            companyContactName: response.companyContactName,
            companyContactPhone: response.companyContactPhone
          });
          
          setTimeout(() => this.router.navigate(['/company/home']), 1000);
        }
      },
      error: err => {
        this.error = err.error?.message || 'Signup failed. Please try again.';
        this.loading = false;
      }
    });
  }
}
