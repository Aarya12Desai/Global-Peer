import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'app-company-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="projects-management">
      <div class="page-header">
        <h1>Project Management</h1>
        <button class="create-btn" (click)="navigateToCreateProject()">
          <i class="fas fa-plus"></i>
          Post New Project
        </button>
      </div>

      <div class="filters-section">
        <div class="filter-group">
          <label for="statusFilter">Filter by Status:</label>
          <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterProjects()">
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        
        <div class="search-group">
          <label for="searchTerm">Search Projects:</label>
          <input 
            type="text" 
            id="searchTerm" 
            [(ngModel)]="searchTerm" 
            (input)="filterProjects()" 
            placeholder="Search by title or description..."
          >
        </div>
      </div>

      <div *ngIf="isLoading" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        Loading projects...
      </div>

      <div *ngIf="!isLoading && filteredProjects.length === 0" class="empty-state">
        <i class="fas fa-project-diagram"></i>
        <h3>No projects found</h3>
        <p *ngIf="!searchTerm && !selectedStatus">You haven't posted any projects yet.</p>
        <p *ngIf="searchTerm || selectedStatus">No projects match your current filters.</p>
        <button *ngIf="!searchTerm && !selectedStatus" class="create-project-btn" (click)="navigateToCreateProject()">
          Create Your First Project
        </button>
      </div>

      <div *ngIf="!isLoading && filteredProjects.length > 0" class="projects-list">
        <div class="bulk-actions" *ngIf="selectedProjects.length > 0">
          <span class="selected-count">{{selectedProjects.length}} project(s) selected</span>
          <button class="bulk-btn" (click)="bulkStatusUpdate()">
            <i class="fas fa-edit"></i> Change Status
          </button>
          <button class="bulk-btn delete" (click)="bulkDelete()">
            <i class="fas fa-trash"></i> Delete Selected
          </button>
          <button class="bulk-btn" (click)="clearSelection()">
            <i class="fas fa-times"></i> Clear Selection
          </button>
        </div>

        <div *ngFor="let project of filteredProjects" class="project-item" [class.selected]="isProjectSelected(project.id)">
          <div class="project-header">
            <div class="project-title-section">
              <input 
                type="checkbox" 
                [checked]="isProjectSelected(project.id)"
                (change)="toggleProjectSelection(project.id, $event)"
                class="project-checkbox">
              <h3>{{project.title}}</h3>
              <span class="project-status" [ngClass]="project.status?.toLowerCase()">
                {{project.status}}
              </span>
            </div>
            <div class="project-actions">
              <button class="action-btn edit" (click)="editProject(project.id)" title="Edit Project">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button class="action-btn view" (click)="viewProject(project.id)" title="View Details">
                <i class="fas fa-eye"></i> View
              </button>
              <button class="action-btn status" (click)="toggleProjectStatus(project)" title="Change Status">
                <i class="fas fa-toggle-on"></i> Status
              </button>
              <button class="action-btn delete" (click)="deleteProject(project.id)" title="Delete Project">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
          
          <div class="project-details">
            <div class="project-meta">
              <span class="project-type">{{project.projectType}}</span>
              <span class="industry-domain">{{project.industryDomain}}</span>
            </div>
            
            <div class="project-description">
              <p class="short-description">
                {{project.shortDescription}}
              </p>
              <p class="detailed-description">
                {{project.detailedDescription | slice:0:200}}{{project.detailedDescription?.length > 200 ? '...' : ''}}
              </p>
            </div>
            
            <div class="project-info">
              <div class="info-item" *ngIf="project.technologiesUsed">
                <strong>Technologies:</strong> {{project.technologiesUsed}}
              </div>
              <div class="info-item" *ngIf="project.objective">
                <strong>Objective:</strong> {{project.objective | slice:0:100}}{{project.objective?.length > 100 ? '...' : ''}}
              </div>
              <div class="info-item" *ngIf="project.demoLink">
                <strong>Demo:</strong> <a href="{{project.demoLink}}" target="_blank">{{project.demoLink}}</a>
              </div>
              <div class="info-item" *ngIf="project.mediaLinks">
                <strong>Project Media:</strong> 
                <div class="media-gallery">
                  <ng-container *ngFor="let link of getMediaLinks(project.mediaLinks)">
                    <div class="media-item" *ngIf="link.trim()">
                      <img *ngIf="isImageFile(link)" 
                           [src]="getFullMediaUrl(link)" 
                           [alt]="project.title"
                           class="project-image"
                           (click)="openImageModal(getFullMediaUrl(link))"
                           (error)="onImageError($event)">
                      <video *ngIf="isVideoFile(link)" 
                             [src]="getFullMediaUrl(link)" 
                             class="project-video"
                             controls
                             preload="metadata"
                             (error)="onVideoError($event)">
                        Your browser does not support the video tag.
                      </video>
                      <a *ngIf="!isImageFile(link) && !isVideoFile(link)" 
                         [href]="link" 
                         target="_blank" 
                         class="media-link">View File</a>
                    </div>
                  </ng-container>
                </div>
              </div>
            </div>
            
            <div class="project-footer">
              <span class="created-date">
                Created: {{formatDate(project.createdAt)}}
              </span>
              <span *ngIf="project.updatedAt" class="updated-date">
                Updated: {{formatDate(project.updatedAt)}}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Image Modal -->
      <div *ngIf="showImageModal" class="image-modal" (click)="closeImageModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <span class="close-modal" (click)="closeImageModal()">&times;</span>
          <img [src]="modalImageSrc" [alt]="'Full size image'" class="modal-image">
        </div>
      </div>

      <!-- Edit Project Modal -->
      <div *ngIf="showEditModal" class="edit-modal">
        <div class="modal-backdrop" (click)="closeEditModal()"></div>
        <div class="edit-modal-content">
          <div class="modal-header">
            <h2>Edit Project</h2>
            <span class="close-modal" (click)="closeEditModal()">&times;</span>
          </div>
          
          <form (ngSubmit)="updateProject()" class="edit-form">
            <div class="form-row">
              <div class="form-group">
                <label for="editTitle">Project Title *</label>
                <input 
                  type="text" 
                  id="editTitle"
                  [(ngModel)]="editForm.title" 
                  name="title"
                  class="form-control"
                  required>
              </div>
              
              <div class="form-group">
                <label for="editProjectType">Project Type *</label>
                <select 
                  id="editProjectType"
                  [(ngModel)]="editForm.projectType" 
                  name="projectType"
                  class="form-control"
                  required>
                  <option value="">Select Type</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Data Science">Data Science</option>
                  <option value="IoT">IoT</option>
                  <option value="Blockchain">Blockchain</option>
                  <option value="Game Development">Game Development</option>
                  <option value="Cloud Computing">Cloud Computing</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="editShortDescription">Short Description *</label>
              <textarea 
                id="editShortDescription"
                [(ngModel)]="editForm.shortDescription" 
                name="shortDescription"
                class="form-control"
                rows="2"
                placeholder="Brief overview of the project..."
                required></textarea>
            </div>

            <div class="form-group">
              <label for="editDetailedDescription">Detailed Description *</label>
              <textarea 
                id="editDetailedDescription"
                [(ngModel)]="editForm.detailedDescription" 
                name="detailedDescription"
                class="form-control"
                rows="4"
                placeholder="Comprehensive project description..."
                required></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="editTechnologies">Technologies Used</label>
                <input 
                  type="text" 
                  id="editTechnologies"
                  [(ngModel)]="editForm.technologiesUsed" 
                  name="technologiesUsed"
                  class="form-control"
                  placeholder="React, Node.js, MongoDB...">
              </div>
              
              <div class="form-group">
                <label for="editIndustry">Industry Domain</label>
                <select 
                  id="editIndustry"
                  [(ngModel)]="editForm.industryDomain" 
                  name="industryDomain"
                  class="form-control">
                  <option value="">Select Domain</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Finance">Finance</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="editObjective">Project Objective</label>
              <textarea 
                id="editObjective"
                [(ngModel)]="editForm.objective" 
                name="objective"
                class="form-control"
                rows="3"
                placeholder="What does this project aim to achieve?"></textarea>
            </div>

            <div class="form-group">
              <label for="editDemoLink">Demo Link</label>
              <input 
                type="url" 
                id="editDemoLink"
                [(ngModel)]="editForm.demoLink" 
                name="demoLink"
                class="form-control"
                placeholder="https://your-demo-link.com">
            </div>

            <div class="form-group">
              <label for="editMediaLinks">Current Media Files</label>
              <div class="current-media" *ngIf="editForm.mediaLinks">
                <div class="media-preview" *ngFor="let link of getMediaLinks(editForm.mediaLinks)">
                  <img *ngIf="isImageFile(link)" 
                       [src]="getFullMediaUrl(link)" 
                       [alt]="'Preview'" 
                       class="media-thumb">
                  <video *ngIf="isVideoFile(link)" 
                         [src]="getFullMediaUrl(link)" 
                         class="media-thumb"
                         preload="metadata"></video>
                  <span class="media-name">{{link}}</span>
                  <button type="button" class="remove-media" (click)="removeMediaFile(link)">×</button>
                </div>
              </div>
              <input 
                type="file" 
                id="editMediaFiles"
                multiple 
                accept="image/*,video/*"
                (change)="onEditMediaSelect($event)"
                class="form-control">
              <small class="form-text">Upload new images or videos (max 10MB each)</small>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="closeEditModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="isUpdating || !editForm.title || !editForm.projectType">
                {{ isUpdating ? 'Updating...' : 'Update Project' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./company-projects.css']
})
export class CompanyProjectsComponent implements OnInit {
  private authService = inject(Auth);
  private router = inject(Router);
  private http = inject(HttpClient);

  projects: any[] = [];
  filteredProjects: any[] = [];
  isLoading = true;
  selectedStatus = '';
  searchTerm = '';
  showImageModal = false;
  modalImageSrc = '';
  showEditModal = false;
  editingProject: any = null;
  editForm: any = {
    title: '',
    projectType: '',
    shortDescription: '',
    detailedDescription: '',
    technologiesUsed: '',
    industryDomain: '',
    objective: '',
    mediaLinks: '',
    demoLink: ''
  };
  isUpdating = false;
  selectedProjects: number[] = [];

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    // Temporarily use full URL to test if proxy is the issue
    const url = 'http://localhost:8081/api/company-projects/my-projects';
    console.log('Making request to:', url);
    
    this.http.get<any[]>(url)
      .subscribe({
        next: (projects) => {
          console.log('Projects loaded successfully:', projects);
          this.projects = projects;
          this.filteredProjects = projects;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading projects:', error);
          console.error('Error URL:', error.url);
          console.error('Error status:', error.status);
          this.isLoading = false;
        }
      });
  }

  filterProjects() {
    this.filteredProjects = this.projects.filter(project => {
      const matchesStatus = !this.selectedStatus || project.status === this.selectedStatus;
      const matchesSearch = !this.searchTerm || 
        (project.title && project.title.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (project.shortDescription && project.shortDescription.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (project.detailedDescription && project.detailedDescription.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      return matchesStatus && matchesSearch;
    });
  }

  navigateToCreateProject() {
    this.router.navigate(['/company/create-project']);
  }

  editProject(projectId: number) {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      this.editingProject = project;
      this.editForm = {
        title: project.title || '',
        projectType: project.projectType || '',
        shortDescription: project.shortDescription || '',
        detailedDescription: project.detailedDescription || '',
        technologiesUsed: project.technologiesUsed || '',
        industryDomain: project.industryDomain || '',
        objective: project.objective || '',
        mediaLinks: project.mediaLinks || '',
        demoLink: project.demoLink || ''
      };
      this.showEditModal = true;
    }
  }

  viewProject(projectId: number) {
    this.router.navigate(['/company/project', projectId]);
  }

  deleteProject(projectId: number) {
    const project = this.projects.find(p => p.id === projectId);
    const projectTitle = project ? project.title : 'this project';
    
    const confirmMessage = `Are you sure you want to delete "${projectTitle}"?\n\nThis action cannot be undone and will permanently remove:
    • All project details
    • Uploaded media files
    • Project statistics
    
Click OK to confirm deletion.`;
    
    if (confirm(confirmMessage)) {
      this.http.delete(`http://localhost:8081/api/company-projects/${projectId}`)
        .subscribe({
          next: () => {
            this.projects = this.projects.filter(project => project.id !== projectId);
            this.filterProjects();
            alert(`Project "${projectTitle}" has been successfully deleted.`);
          },
          error: (error) => {
            console.error('Error deleting project:', error);
            let errorMessage = 'Failed to delete project. Please try again.';
            if (error.status === 403) {
              errorMessage = 'You are not authorized to delete this project.';
            } else if (error.status === 404) {
              errorMessage = 'Project not found. It may have already been deleted.';
            }
            alert(errorMessage);
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

  getMediaLinks(mediaLinks: string): string[] {
    if (!mediaLinks) return [];
    return mediaLinks.split('\n').filter(link => link.trim());
  }

  isImageFile(filename: string): boolean {
    if (!filename) return false;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const extension = filename.split('.').pop()?.toLowerCase();
    return imageExtensions.includes(extension || '');
  }

  isVideoFile(filename: string): boolean {
    if (!filename) return false;
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    const extension = filename.split('.').pop()?.toLowerCase();
    return videoExtensions.includes(extension || '');
  }

  getFullMediaUrl(filename: string): string {
    if (!filename) return '';
    // If it's already a full URL, return as is
    if (filename.startsWith('http')) return filename;
    // If filename starts with /uploads/, just prepend the base URL
    if (filename.startsWith('/uploads/')) {
      return `http://localhost:8081${filename}`;
    }
    // If filename starts with uploads/ (without leading slash), prepend base URL with slash
    if (filename.startsWith('uploads/')) {
      return `http://localhost:8081/${filename}`;
    }
    // Otherwise, construct the URL for uploaded files
    return `http://localhost:8081/uploads/${filename}`;
  }

  onImageError(event: any) {
    console.error('Error loading image:', event.target.src);
    event.target.style.display = 'none';
  }

  onVideoError(event: any) {
    console.error('Error loading video:', event.target.src);
    event.target.style.display = 'none';
  }

  openImageModal(imageUrl: string) {
    this.modalImageSrc = imageUrl;
    this.showImageModal = true;
  }

  closeImageModal() {
    this.showImageModal = false;
    this.modalImageSrc = '';
  }

  toggleProjectStatus(project: any) {
    const statusOptions = [
      { value: 'OPEN', label: 'Open' },
      { value: 'IN_PROGRESS', label: 'In Progress' },
      { value: 'COMPLETED', label: 'Completed' },
      { value: 'CANCELLED', label: 'Cancelled' }
    ];
    
    const currentStatus = project.status;
    const statusList = statusOptions.map(option => 
      `${option.value === currentStatus ? '✓' : ' '} ${option.label}`
    ).join('\n');
    
    const newStatus = prompt(
      `Current status: ${currentStatus}\n\nSelect new status:\n${statusList}\n\nEnter one of: OPEN, IN_PROGRESS, COMPLETED, CANCELLED`,
      currentStatus
    );
    
    if (newStatus && newStatus !== currentStatus) {
      const validStatuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      const upperNewStatus = newStatus.toUpperCase();
      
      if (validStatuses.includes(upperNewStatus)) {
        const updateData = { ...project, status: upperNewStatus };
        
        this.http.put(`http://localhost:8081/api/company-projects/${project.id}`, updateData)
          .subscribe({
            next: (updatedProject: any) => {
              const index = this.projects.findIndex(p => p.id === project.id);
              if (index !== -1) {
                this.projects[index] = updatedProject;
              }
              this.filterProjects();
              alert(`Project status updated to ${upperNewStatus.replace('_', ' ')}`);
            },
            error: (error) => {
              console.error('Error updating project status:', error);
              alert('Failed to update project status. Please try again.');
            }
          });
      } else {
        alert('Invalid status. Please enter one of: OPEN, IN_PROGRESS, COMPLETED, CANCELLED');
      }
    }
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingProject = null;
    this.editForm = {
      title: '',
      projectType: '',
      shortDescription: '',
      detailedDescription: '',
      technologiesUsed: '',
      industryDomain: '',
      objective: '',
      mediaLinks: '',
      demoLink: ''
    };
  }

  updateProject() {
    if (!this.editingProject || this.isUpdating) return;
    
    this.isUpdating = true;
    
    this.http.put(`http://localhost:8081/api/company-projects/${this.editingProject.id}`, this.editForm)
      .subscribe({
        next: (updatedProject: any) => {
          // Update the project in the local array
          const index = this.projects.findIndex(p => p.id === this.editingProject.id);
          if (index !== -1) {
            this.projects[index] = updatedProject;
          }
          this.filterProjects(); // Refresh the filtered list
          this.closeEditModal();
          this.isUpdating = false;
          alert('Project updated successfully!');
        },
        error: (error) => {
          console.error('Error updating project:', error);
          alert('Failed to update project. Please try again.');
          this.isUpdating = false;
        }
      });
  }

  onEditMediaSelect(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.uploadMediaFiles(files);
    }
  }

  uploadMediaFiles(files: FileList) {
    const uploadObservables: Observable<any>[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadObservable = this.http.post<any>('http://localhost:8081/api/upload/media', formData);
      uploadObservables.push(uploadObservable);
    }
    
    // Use forkJoin to handle multiple observables
    if (uploadObservables.length > 0) {
      forkJoin(uploadObservables).subscribe({
        next: (responses: any[]) => {
          const newMediaLinks = responses.map((response: any) => response.url).join('\n');
          if (this.editForm.mediaLinks) {
            this.editForm.mediaLinks += '\n' + newMediaLinks;
          } else {
            this.editForm.mediaLinks = newMediaLinks;
          }
        },
        error: (error) => {
          console.error('Error uploading media files:', error);
          alert('Failed to upload some media files. Please try again.');
        }
      });
    }
  }

  removeMediaFile(linkToRemove: string) {
    if (this.editForm.mediaLinks) {
      const links = this.editForm.mediaLinks.split('\n');
      const filteredLinks = links.filter((link: string) => link.trim() !== linkToRemove.trim());
      this.editForm.mediaLinks = filteredLinks.join('\n');
    }
  }

  // Bulk Operations
  toggleProjectSelection(projectId: number, event: any) {
    if (event.target.checked) {
      if (!this.selectedProjects.includes(projectId)) {
        this.selectedProjects.push(projectId);
      }
    } else {
      this.selectedProjects = this.selectedProjects.filter(id => id !== projectId);
    }
  }

  isProjectSelected(projectId: number): boolean {
    return this.selectedProjects.includes(projectId);
  }

  clearSelection() {
    this.selectedProjects = [];
  }

  bulkStatusUpdate() {
    if (this.selectedProjects.length === 0) return;
    
    const newStatus = prompt(
      `Update status for ${this.selectedProjects.length} selected projects.\n\nEnter new status (OPEN, IN_PROGRESS, COMPLETED, CANCELLED):`
    );
    
    if (newStatus) {
      const validStatuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      const upperNewStatus = newStatus.toUpperCase();
      
      if (validStatuses.includes(upperNewStatus)) {
        const updatePromises = this.selectedProjects.map(projectId => {
          const project = this.projects.find(p => p.id === projectId);
          if (project) {
            const updateData = { ...project, status: upperNewStatus };
            return this.http.put(`http://localhost:8081/api/company-projects/${projectId}`, updateData);
          }
          return null;
        }).filter(promise => promise !== null);
        
        if (updatePromises.length > 0) {
          forkJoin(updatePromises).subscribe({
            next: (updatedProjects: any[]) => {
              updatedProjects.forEach((updatedProject: any) => {
                const index = this.projects.findIndex(p => p.id === updatedProject.id);
                if (index !== -1) {
                  this.projects[index] = updatedProject;
                }
              });
              this.filterProjects();
              this.clearSelection();
              alert(`Successfully updated ${updatedProjects.length} projects to ${upperNewStatus.replace('_', ' ')}`);
            },
            error: (error) => {
              console.error('Error updating projects:', error);
              alert('Failed to update some projects. Please try again.');
            }
          });
        }
      } else {
        alert('Invalid status. Please enter one of: OPEN, IN_PROGRESS, COMPLETED, CANCELLED');
      }
    }
  }

  bulkDelete() {
    if (this.selectedProjects.length === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${this.selectedProjects.length} selected projects?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      const deletePromises = this.selectedProjects.map(projectId => 
        this.http.delete(`http://localhost:8081/api/company-projects/${projectId}`)
      );
      
      forkJoin(deletePromises).subscribe({
        next: () => {
          this.projects = this.projects.filter(project => !this.selectedProjects.includes(project.id));
          this.filterProjects();
          const deletedCount = this.selectedProjects.length;
          this.clearSelection();
          alert(`Successfully deleted ${deletedCount} projects.`);
        },
        error: (error) => {
          console.error('Error deleting projects:', error);
          alert('Failed to delete some projects. Please try again.');
        }
      });
    }
  }
}
