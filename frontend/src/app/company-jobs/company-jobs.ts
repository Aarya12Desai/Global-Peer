import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-company-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="jobs-management">
      <div class="page-header">
        <h1>Job Management</h1>
        <button class="create-btn" (click)="navigateToCreateJob()">
          <i class="fas fa-plus"></i>
          Post New Job
        </button>
      </div>

      <div class="filters-section">
        <div class="filter-group">
          <label for="statusFilter">Filter by Status:</label>
          <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterJobs()">
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        
        <div class="search-group">
          <label for="searchTerm">Search Jobs:</label>
          <input 
            type="text" 
            id="searchTerm" 
            [(ngModel)]="searchTerm" 
            (input)="filterJobs()" 
            placeholder="Search by title or description..."
          >
        </div>
      </div>

      <div *ngIf="isLoading" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        Loading jobs...
      </div>

      <div *ngIf="!isLoading && filteredJobs.length === 0" class="empty-state">
        <i class="fas fa-briefcase"></i>
        <h3>No jobs found</h3>
        <p *ngIf="!searchTerm && !selectedStatus">You haven't posted any jobs yet.</p>
        <p *ngIf="searchTerm || selectedStatus">No jobs match your current filters.</p>
        <button *ngIf="!searchTerm && !selectedStatus" class="create-job-btn" (click)="navigateToCreateJob()">
          Create Your First Job
        </button>
      </div>

      <div *ngIf="!isLoading && filteredJobs.length > 0" class="jobs-list">
        <div *ngFor="let job of filteredJobs" class="job-item">
          <div class="job-header">
            <div class="job-title-section">
              <h3>{{job.title}}</h3>
              <span class="job-status" [ngClass]="job.status?.toLowerCase()">
                {{job.status}}
              </span>
            </div>
            <div class="job-actions">
              <button class="action-btn edit" (click)="editJob(job.id)">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button class="action-btn view" (click)="viewJob(job.id)">
                <i class="fas fa-eye"></i> View
              </button>
              <button class="action-btn delete" (click)="deleteJob(job.id)">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
          
          <div class="job-details">
            <div class="job-meta">
              <span class="job-type">{{job.jobType}}</span>
              <span class="job-location">{{job.location}}</span>
              <span *ngIf="job.remoteAllowed" class="remote-tag">Remote Allowed</span>
            </div>
            
            <p class="job-description">
              {{job.description | slice:0:150}}{{job.description?.length > 150 ? '...' : ''}}
            </p>
            
            <div class="job-info">
              <div class="info-item">
                <strong>Experience:</strong> {{job.experienceLevel || 'Not specified'}}
              </div>
              <div class="info-item" *ngIf="job.salaryRange">
                <strong>Salary:</strong> {{job.salaryRange}}
              </div>
              <div class="info-item" *ngIf="job.applicationDeadline">
                <strong>Deadline:</strong> {{formatDate(job.applicationDeadline)}}
              </div>
            </div>
            
            <div class="job-footer">
              <span class="created-date">
                Created: {{formatDate(job.createdAt)}}
              </span>
              <span *ngIf="job.updatedAt" class="updated-date">
                Updated: {{formatDate(job.updatedAt)}}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./company-jobs.css']
})
export class CompanyJobsComponent implements OnInit {
  private authService = inject(Auth);
  private router = inject(Router);
  private http = inject(HttpClient);

  jobs: any[] = [];
  filteredJobs: any[] = [];
  isLoading = true;
  selectedStatus = '';
  searchTerm = '';

  ngOnInit() {
    this.loadJobs();
  }

  loadJobs() {
    const token = this.authService.token;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>('http://localhost:8081/api/company-jobs/my-jobs', { headers })
      .subscribe({
        next: (jobs) => {
          this.jobs = jobs;
          this.filteredJobs = jobs;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading jobs:', error);
          this.isLoading = false;
        }
      });
  }

  filterJobs() {
    this.filteredJobs = this.jobs.filter(job => {
      const matchesStatus = !this.selectedStatus || job.status === this.selectedStatus;
      const matchesSearch = !this.searchTerm || 
        job.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }

  navigateToCreateJob() {
    this.router.navigate(['/company/create-job']);
  }

  editJob(jobId: number) {
    this.router.navigate(['/company/edit-job', jobId]);
  }

  viewJob(jobId: number) {
    this.router.navigate(['/company/job', jobId]);
  }

  deleteJob(jobId: number) {
    if (confirm('Are you sure you want to delete this job posting?')) {
      const token = this.authService.token;
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.delete(`http://localhost:8081/api/company-jobs/${jobId}`, { headers })
        .subscribe({
          next: () => {
            this.jobs = this.jobs.filter(job => job.id !== jobId);
            this.filterJobs();
          },
          error: (error) => {
            console.error('Error deleting job:', error);
            alert('Failed to delete job. Please try again.');
          }
        });
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
