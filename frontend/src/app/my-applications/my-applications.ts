import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="applications-container">
      <div class="page-header">
        <h1>My Applications</h1>
        <p>Track the status of your project applications</p>
      </div>

      <div *ngIf="isLoading" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        Loading your applications...
      </div>

      <div *ngIf="!isLoading && applications.length === 0" class="empty-state">
        <i class="fas fa-inbox"></i>
        <h3>No applications yet</h3>
        <p>You haven't applied to any company projects yet.</p>
      </div>

      <div *ngIf="!isLoading && applications.length > 0" class="applications-list">
        <div *ngFor="let application of applications" class="application-card">
          <div class="application-header">
            <div class="project-info">
              <h3>{{application.project?.title}}</h3>
              <p class="company-name">
                <i class="fas fa-building"></i>
                {{application.project?.company?.companyName || application.project?.company?.username || 'Company'}}
              </p>
            </div>
            <div class="application-status">
              <span class="status-badge" [ngClass]="application.status?.toLowerCase()">
                {{formatStatus(application.status)}}
              </span>
            </div>
          </div>
          
          <div class="application-content">
            <div class="application-details">
              <div class="detail-row">
                <strong>Applied:</strong> {{formatDate(application.appliedAt)}}
              </div>
              <div class="detail-row" *ngIf="application.reviewedAt">
                <strong>Reviewed:</strong> {{formatDate(application.reviewedAt)}}
              </div>
              <div class="detail-row">
                <strong>Project Type:</strong> {{application.project?.projectType}}
              </div>
              <div class="detail-row" *ngIf="application.project?.location">
                <strong>Location:</strong> {{application.project.location}}
              </div>
            </div>
            
            <div class="cover-letter-section" *ngIf="application.coverLetter">
              <h4>Your Cover Letter:</h4>
              <p class="cover-letter">{{application.coverLetter}}</p>
            </div>
            
            <div class="company-notes" *ngIf="application.notes && application.status !== 'PENDING'">
              <h4>Company Feedback:</h4>
              <p class="notes">{{application.notes}}</p>
            </div>
          </div>
          
          <div class="application-footer">
            <div class="project-meta">
              <span *ngIf="application.project?.budgetRange" class="meta-item">
                <i class="fas fa-dollar-sign"></i>
                {{application.project.budgetRange}}
              </span>
              <span *ngIf="application.project?.durationMonths" class="meta-item">
                <i class="fas fa-clock"></i>
                {{application.project.durationMonths}} months
              </span>
              <span *ngIf="application.project?.remoteAllowed" class="meta-item remote">
                <i class="fas fa-home"></i>
                Remote Allowed
              </span>
            </div>
            <div class="application-actions">
              <button class="btn-view" (click)="viewProject(application.project)">
                <i class="fas fa-eye"></i>
                View Project
              </button>
              <button 
                class="btn-withdraw" 
                (click)="withdrawApplication(application)"
                [disabled]="application.status === 'ACCEPTED' || application.status === 'REJECTED'"
                *ngIf="application.status === 'PENDING' || application.status === 'REVIEWING'"
              >
                <i class="fas fa-times"></i>
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./my-applications.css']
})
export class MyApplicationsComponent implements OnInit {
  private authService = inject(Auth);
  private router = inject(Router);
  private http = inject(HttpClient);

  applications: any[] = [];
  isLoading = true;

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    const token = this.authService.token;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>('http://localhost:8081/api/project-applications/my-applications', { headers })
      .subscribe({
        next: (applications) => {
          this.applications = applications;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading applications:', error);
          this.isLoading = false;
        }
      });
  }

  viewProject(project: any) {
    // For now, just show project details in an alert
    // In a real app, this might open a modal or navigate to a project detail page
    const details = `
Project: ${project.title}
Company: ${project.company?.companyName || project.company?.username || 'N/A'}
Type: ${project.projectType}
Location: ${project.location}
Budget: ${project.budgetRange || 'Not specified'}
Description: ${project.description}
    `;
    alert(details);
  }

  withdrawApplication(application: any) {
    const confirmed = confirm(`Are you sure you want to withdraw your application for "${application.project?.title}"?\n\nThis action cannot be undone.`);
    
    if (confirmed) {
      // For now, just show a message. In a real app, you'd implement withdrawal logic
      alert('Application withdrawal feature will be implemented soon.');
      
      // TODO: Implement withdrawal logic
      // const token = this.authService.token;
      // const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      // this.http.put(`http://localhost:8081/api/project-applications/${application.id}/status`, 
      //   { status: 'WITHDRAWN' }, { headers })...
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatStatus(status: string): string {
    switch (status) {
      case 'PENDING': return 'Pending Review';
      case 'REVIEWING': return 'Under Review';
      case 'ACCEPTED': return 'Accepted';
      case 'REJECTED': return 'Rejected';
      case 'WITHDRAWN': return 'Withdrawn';
      default: return status;
    }
  }
}
