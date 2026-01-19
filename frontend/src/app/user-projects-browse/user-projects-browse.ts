import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentsComponent } from '../components/comments.component';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '../services/auth';
import { Notifications } from '../services/notifications';

interface SendNotificationRequest {
  userId: number;
  title: string;
  message: string;
  type: string;
}

interface UserProject {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  creatorUsername?: string;
}

@Component({
  selector: 'app-user-projects-browse',
  standalone: true,
  imports: [CommonModule, FormsModule, CommentsComponent],
  template: `
    <div class="browse-projects-container">
      <div class="page-header">
        <h1>Browse User Projects</h1>
        <p>Discover exciting projects from fellow users looking for collaborators</p>
      </div>

      <div class="filters-section">
        <div class="filter-group">
          <label for="searchTerm">Search Projects:</label>
          <input 
            type="text" 
            id="searchTerm" 
            [(ngModel)]="searchTerm" 
            (input)="filterProjects()" 
            placeholder="Search by name, description, or creator..."
          >
        </div>
        
  <!-- Removed country/language filters, clear, and refresh buttons as requested -->
      </div>

      <div class="results-info" *ngIf="!loading()">
        <p>{{filteredProjects().length}} project(s) found</p>
      </div>

      <div *ngIf="loading()" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        Loading projects...
      </div>

      <div *ngIf="error()" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        {{ error() }}
        <button class="btn-retry" (click)="loadProjects()">Try Again</button>
      </div>

      <div *ngIf="!loading() && !error() && filteredProjects().length === 0" class="empty-state">
        <i class="fas fa-search"></i>
        <h3>No projects found</h3>
        <p *ngIf="searchTerm">
          Try adjusting your search to find more projects.
        </p>
        <p *ngIf="!searchTerm">
          No user projects available yet. Check back later or create your own project!
        </p>
        <button class="btn-primary" routerLink="/create-project">
          <i class="fas fa-plus"></i>
          Create Your First Project
        </button>
      </div>

      <div *ngIf="!loading() && !error() && filteredProjects().length > 0" class="projects-grid">
        <div *ngFor="let project of filteredProjects()" class="project-card">
          <div class="project-header">
            <div class="project-info">
              <h3>{{project.name}}</h3>
              <p class="creator-info">
                <i class="fas fa-user"></i>
                Created by {{project.creatorUsername || 'Anonymous'}}
              </p>
            </div>
            <div class="project-meta">
              <span class="project-date">
                <i class="fas fa-calendar"></i>
                {{formatDate(project.createdAt)}}
              </span>
            </div>
          </div>
          
          <div class="project-content">
            <p class="project-description">
              {{project.description | slice:0:200}}{{(project.description && project.description.length > 200) ? '...' : ''}}
            </p>
            
            <!-- Removed country/language display from project card -->
          </div>
          
          <div class="project-footer">
            <div class="project-actions">
              <button class="btn-view" (click)="viewProject(project)">
                <i class="fas fa-eye"></i>
                View Details
              </button>
              <button class="btn-connect" (click)="connectWithCreator(project)">
                <i class="fas fa-handshake"></i>
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Project Details Modal -->
    <div *ngIf="selectedProject()" class="modal-overlay" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{selectedProject()?.name}}</h2>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="creator-info-detailed">
            <h4>Created by {{selectedProject()?.creatorUsername || 'Anonymous'}}</h4>
            <p class="creation-date">
              <i class="fas fa-calendar"></i>
              Created on {{selectedProject()?.createdAt ? formatDate(selectedProject()!.createdAt) : 'N/A'}}
            </p>
          </div>
          <div class="project-full-description">
            <h4>Project Description</h4>
            <p>{{selectedProject()?.description}}</p>
          </div>
          <div class="project-comments-section">
            <h4>Comments</h4>
            <app-comments *ngIf="selectedProject()" [postId]="selectedProject()!.id"></app-comments>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="closeModal()">Close</button>
          <button class="btn-primary" (click)="selectedProject() && connectWithCreator(selectedProject()!)">
            <i class="fas fa-handshake"></i>
            Connect with Creator
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .browse-projects-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }

    .page-header {
      text-align: center;
      margin-bottom: 2rem;
      color: white;
    }

    .page-header h1 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
    }

    .page-header p {
      font-size: 1.1rem;
      margin: 0;
      opacity: 0.9;
    }

    .filters-section {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      backdrop-filter: blur(10px);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
    }

    .filter-group label {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .filter-group input, .filter-group select {
      padding: 0.75rem;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.3s ease;
    }

    .filter-group input:focus, .filter-group select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .filter-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .btn-clear, .btn-refresh {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: center;
    }

    .btn-clear {
      background: #f8f9fa;
      color: #6c757d;
      border: 1px solid #dee2e6;
    }

    .btn-refresh {
      background: #28a745;
      color: white;
    }

    .btn-clear:hover {
      background: #e9ecef;
    }

    .btn-refresh:hover {
      background: #218838;
    }

    .results-info {
      background: rgba(255, 255, 255, 0.9);
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      text-align: center;
      color: #333;
      font-weight: 500;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: white;
      font-size: 1.1rem;
    }

    .loading i {
      font-size: 2rem;
      margin-bottom: 1rem;
      display: block;
    }

    .error-message {
      background: rgba(220, 53, 69, 0.9);
      color: white;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      text-align: center;
    }

    .btn-retry {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      margin-left: 1rem;
      cursor: pointer;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: white;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    .empty-state i {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.7;
    }

    .empty-state h3 {
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
    }

    .empty-state p {
      margin-bottom: 2rem;
      opacity: 0.8;
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .project-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .project-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .project-info h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .creator-info {
      color: #666;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .project-meta {
      text-align: right;
    }

    .project-date {
      background: #f8f9fa;
      color: #6c757d;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    .project-description {
      color: #666;
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .project-details {
      margin-bottom: 1.5rem;
    }

    .detail-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #555;
      font-size: 0.9rem;
    }

    .detail-item i {
      color: #667eea;
      width: 16px;
    }

    .project-footer {
      border-top: 1px solid #e9ecef;
      padding-top: 1rem;
    }

    .project-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-view, .btn-connect, .btn-primary, .btn-secondary {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
    }

    .btn-view {
      background: #f8f9fa;
      color: #495057;
      border: 1px solid #dee2e6;
      flex: 1;
      justify-content: center;
    }

    .btn-connect {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      flex: 1;
      justify-content: center;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-secondary {
      background: #f8f9fa;
      color: #495057;
      border: 1px solid #dee2e6;
    }

    .btn-view:hover {
      background: #e9ecef;
    }

    .btn-connect:hover, .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary:hover {
      background: #e9ecef;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 600px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e9ecef;
    }

    .modal-header h2 {
      margin: 0;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6c757d;
      padding: 0.5rem;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: #f8f9fa;
      color: #495057;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .creator-info-detailed h4 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .creation-date {
      color: #6c757d;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .project-full-description h4,
    .project-metadata h4 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.1rem;
    }

    .project-full-description p {
      color: #666;
      line-height: 1.6;
      margin: 0;
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .metadata-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #555;
    }

    .metadata-item i {
      color: #667eea;
      width: 16px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e9ecef;
    }

    @media (max-width: 768px) {
      .browse-projects-container {
        padding: 1rem;
      }

      .filters-section {
        grid-template-columns: 1fr;
      }

      .projects-grid {
        grid-template-columns: 1fr;
      }

      .project-actions {
        flex-direction: column;
      }

      .detail-row {
        flex-direction: column;
        gap: 0.5rem;
      }

      .modal-content {
        margin: 1rem;
      }
    }
  `]
})
export class UserProjectsBrowseComponent implements OnInit {
  projects = signal<UserProject[]>([]);
  filteredProjects = signal<UserProject[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  selectedProject = signal<UserProject | null>(null);

  // Filters
  searchTerm = '';
  selectedCountry = '';
  selectedLanguage = '';

  constructor(
    private http: HttpClient,
    private auth: Auth,
    private router: Router,
    private notifications: Notifications
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    console.log('Loading user projects...');
    this.loading.set(true);
    this.error.set(null);

    // Get all projects (public endpoint)
    this.http.get<UserProject[]>('http://localhost:8081/api/projects')
      .subscribe({
        next: (projects) => {
          console.log('Projects loaded:', projects);
          this.projects.set(projects);
          this.filteredProjects.set(projects);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading projects:', err);
          this.error.set('Failed to load projects. Please try again.');
          this.loading.set(false);
        }
      });
  }

  filterProjects() {
    const filtered = this.projects().filter(project => {
      const matchesSearch = !this.searchTerm || 
        project.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (project.creatorUsername && project.creatorUsername.toLowerCase().includes(this.searchTerm.toLowerCase()));
      return matchesSearch;
    });
    this.filteredProjects.set(filtered);
  }

  viewProject(project: UserProject) {
    this.selectedProject.set(project);
  }

  closeModal() {
    this.selectedProject.set(null);
  }

  connectWithCreator(project: UserProject) {
    // Simple connection mechanism - in a real app, this could create a conversation or send a message
    if (!this.auth.isLoggedIn) {
      alert('Please log in to connect with project creators.');
      this.router.navigate(['/login']);
      return;
    }

    const message = prompt(`Send a message to ${project.creatorUsername} about "${project.name}":`);
    
    if (message && message.trim()) {
      // Send notification to the user (project creator) via backend API
      const notificationPayload: SendNotificationRequest = {
        userId: (project as any).creatorId || (project as any).userId || project.id, // Try to get creatorId, fallback to project.id
        title: 'New Connection Request',
        message: `A company is interested in your project "${project.name}" and sent: "${message.trim()}"`,
        type: 'project_match'
      };
      this.http.post('http://localhost:8081/api/notifications/send', notificationPayload).subscribe({
        next: () => {
          alert(`Message sent to ${project.creatorUsername}! They will be notified of your interest in their project.`);
          this.closeModal();
        },
        error: (err) => {
          // Fallback: add local notification if backend fails
          this.notifications.addNotification({
            type: 'project_match',
            title: 'New Connection Request',
            message: notificationPayload.message,
            read: false,
            userName: project.creatorUsername || 'User',
            userId: notificationPayload.userId.toString()
          });
          alert('Backend notification failed, but local notification added.');
          this.closeModal();
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
