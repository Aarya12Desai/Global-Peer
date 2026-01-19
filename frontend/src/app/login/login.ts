import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '../services/auth';
import { ProjectNotificationService } from '../services/project-notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
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
      console.log('Attempting user login for:', formData.email);
      
      this.auth.login(formData.email, formData.password).subscribe({
        next: (response) => {
          console.log('User login successful, navigating to home...');
          // Fetch notifications after login
          this.projectNotificationService.refreshUserNotifications();
          this.isLoading = false;
          
          // Verify the user role is USER
          if (response.role === 'USER') {
            setTimeout(() => {
              this.router.navigate(['/home']);
            }, 100);
          } else {
            this.errorMessage = 'This account is registered as a company. Please use the company login.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('User login failed:', error);
          this.errorMessage = error.error?.message || 'Login failed. Please check your credentials or ensure you have a user account.';
        }
      });
    }
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
