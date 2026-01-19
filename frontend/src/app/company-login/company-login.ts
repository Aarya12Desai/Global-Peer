import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '../services/auth';
import { ProjectNotificationService } from '../services/project-notification.service';

@Component({
  selector: 'app-company-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './company-login.html',
  styleUrl: './company-login.css'
})
export class CompanyLoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router,
    private projectNotificationService: ProjectNotificationService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData = this.loginForm.value;
      console.log('Attempting company login for:', formData.email);
      
      // Use the updated login method without role parameter
      this.auth.login(formData.email, formData.password).subscribe({
        next: (response) => {
          console.log('Company login successful, navigating to dashboard...');
          // Fetch notifications after login
          this.projectNotificationService.refreshUserNotifications();
          this.isLoading = false;
          
          // Verify the user role is COMPANY
          if (response.role === 'COMPANY') {
            setTimeout(() => {
              this.router.navigate(['/company/home']);
            }, 100);
          } else {
            this.errorMessage = 'This account is not registered as a company. Please use the regular login.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Company login failed:', error);
          this.errorMessage = error.error?.message || 'Login failed. Please check your credentials or ensure you have a company account.';
        }
      });
    }
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
