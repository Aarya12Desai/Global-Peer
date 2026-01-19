import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../services/project.service';
import { ProjectNotificationService } from '../services/project-notification.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="create-project-container">
      <div class="form-header">
        <h1>Create a New Project</h1>
        <p>Showcase your project to collaborate with companies and other developers</p>
      </div>

      <form #projectForm="ngForm" (ngSubmit)="createProject()" class="project-form">
        <div class="form-group">
          <label for="title">Project Title/Name *</label>
          <input 
            type="text" 
            id="title" 
            name="title"
            [(ngModel)]="projectData.title"
            placeholder="Enter your project title"
            required
            minlength="3"
            #titleInput="ngModel"
            [class.error]="titleInput.invalid && titleInput.touched"
          >
          <div *ngIf="titleInput.invalid && titleInput.touched" class="error-message">
            Project title is required (minimum 3 characters)
          </div>
        </div>

        <div class="form-group">
          <label for="projectType">Category / Type *</label>
          <select 
            id="projectType" 
            name="projectType"
            [(ngModel)]="projectData.projectType"
            required
            #typeInput="ngModel"
            [class.error]="typeInput.invalid && typeInput.touched"
          >
            <option value="">Select project category</option>
            <option value="Web App">Web App</option>
            <option value="Mobile App">Mobile App</option>
            <option value="Research Project">Research Project</option>
            <option value="AI Model">AI Model</option>
            <option value="Hardware Prototype">Hardware Prototype</option>
            <option value="Software Tool">Software Tool</option>
            <option value="Game Development">Game Development</option>
            <option value="Data Analytics">Data Analytics</option>
            <option value="IoT Solution">IoT Solution</option>
            <option value="Other">Other</option>
          </select>
          <div *ngIf="typeInput.invalid && typeInput.touched" class="error-message">
            Project category is required
          </div>
        </div>

        <div class="form-group">
          <label for="shortDescription">Short Description *</label>
          <textarea 
            id="shortDescription" 
            name="shortDescription"
            [(ngModel)]="projectData.shortDescription"
            rows="3"
            placeholder="Brief overview of your project (elevator pitch)"
            required
            minlength="10"
            #shortDescInput="ngModel"
            [class.error]="shortDescInput.invalid && shortDescInput.touched"
          ></textarea>
          <div *ngIf="shortDescInput.invalid && shortDescInput.touched" class="error-message">
            Short description is required (minimum 10 characters)
          </div>
        </div>

        <div class="form-group">
          <label for="detailedDescription">Detailed Description *</label>
          <textarea 
            id="detailedDescription" 
            name="detailedDescription"
            [(ngModel)]="projectData.detailedDescription"
            rows="6"
            placeholder="Detailed explanation: problem solved, features, workflow, what makes it unique..."
            required
            minlength="20"
            #detailDescInput="ngModel"
            [class.error]="detailDescInput.invalid && detailDescInput.touched"
          ></textarea>
          <div *ngIf="detailDescInput.invalid && detailDescInput.touched" class="error-message">
            Detailed description is required (minimum 20 characters)
          </div>
        </div>

        <div class="form-group">
          <label for="technologiesUsed">Technologies Used *</label>
          <input 
            type="text" 
            id="technologiesUsed" 
            name="technologiesUsed"
            [(ngModel)]="projectData.technologiesUsed"
            placeholder="e.g., React, Node.js, Python, AWS, MongoDB, TensorFlow..."
            required
            #techInput="ngModel"
            [class.error]="techInput.invalid && techInput.touched"
          >
          <div *ngIf="techInput.invalid && techInput.touched" class="error-message">
            Technologies used are required
          </div>
        </div>

        <div class="form-group">
          <label for="industryDomain">Industry / Domain *</label>
          <select 
            id="industryDomain" 
            name="industryDomain"
            [(ngModel)]="projectData.industryDomain"
            required
            #domainInput="ngModel"
            [class.error]="domainInput.invalid && domainInput.touched"
          >
            <option value="">Select industry domain</option>
            <option value="Education">Education</option>
            <option value="Healthcare">Healthcare</option>
            <option value="FinTech">FinTech</option>
            <option value="Automotive">Automotive</option>
            <option value="E-commerce">E-commerce</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Social Media">Social Media</option>
            <option value="Travel & Tourism">Travel & Tourism</option>
            <option value="Food & Beverage">Food & Beverage</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Energy">Energy</option>
            <option value="Government">Government</option>
            <option value="Non-Profit">Non-Profit</option>
            <option value="Other">Other</option>
          </select>
          <div *ngIf="domainInput.invalid && domainInput.touched" class="error-message">
            Industry domain is required
          </div>
        </div>

        <div class="form-group">
          <label for="objective">Objective / Purpose *</label>
          <textarea 
            id="objective" 
            name="objective"
            [(ngModel)]="projectData.objective"
            rows="4"
            placeholder="Why was this project made? What problem does it solve? What value does it provide?"
            required
            #objectiveInput="ngModel"
            [class.error]="objectiveInput.invalid && objectiveInput.touched"
          ></textarea>
          <div *ngIf="objectiveInput.invalid && objectiveInput.touched" class="error-message">
            Project objective is required
          </div>
        </div>

        <div class="form-group">
          <label for="mediaFiles">Upload Screenshots / Demo Videos</label>
          <input 
            type="file" 
            id="mediaFiles" 
            (change)="onMediaFilesSelected($event)"
            multiple
            accept="image/*,video/*"
            class="file-input"
          >
          <div class="file-upload-area" (click)="triggerFileInput()">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Click to upload or drag and drop</p>
            <small>Images and videos only (max 10MB each)</small>
          </div>
          
          <!-- Show newly selected files -->
          <div *ngIf="selectedMediaFiles.length > 0" class="uploaded-files">
            <h4>Files to Upload:</h4>
            <div *ngFor="let file of selectedMediaFiles; let i = index" class="file-item">
              <span class="file-name">{{file.name}}</span>
              <span class="file-size">({{formatFileSize(file.size)}})</span>
              <button type="button" class="remove-file-btn" (click)="removeMediaFile(i)">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="demoLink">Working Demo Link / GitHub Repository</label>
          <input 
            type="url" 
            id="demoLink" 
            name="demoLink"
            [(ngModel)]="projectData.demoLink"
            placeholder="https://github.com/yourproject or https://demo.yourproject.com"
          >
          <small class="form-hint">Optional: Link to live demo or source code repository</small>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" (click)="resetForm()">
            Clear Form
          </button>
          <button 
            type="submit" 
            class="btn-primary" 
            [disabled]="projectForm.invalid || isLoading"
          >
            <span *ngIf="isLoading">
              <i class="fas fa-spinner fa-spin"></i>
              Creating...
            </span>
            <span *ngIf="!isLoading">
              <i class="fas fa-rocket"></i>
              Create Project
            </span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .create-project-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .form-header {
      text-align: center;
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .form-header h1 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 2.2rem;
      font-weight: 700;
    }

    .form-header p {
      margin: 0;
      color: #6c757d;
      font-size: 1.1rem;
    }

    .project-form {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      border: 1px solid #e9ecef;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      margin-bottom: 1.5rem;
    }

    .form-group label {
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #2c3e50;
      font-size: 0.95rem;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 12px 16px;
      border: 2px solid #dee2e6;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: #f8f9fa;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      background: white;
    }

    .form-group input.error,
    .form-group select.error,
    .form-group textarea.error {
      border-color: #dc3545;
      background: #fff5f5;
    }

    .form-group textarea {
      resize: vertical;
      min-height: 120px;
      font-family: inherit;
    }

    .error-message {
      margin-top: 0.5rem;
      color: #dc3545;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .form-hint {
      display: block;
      margin-top: 0.5rem;
      color: #6c757d;
      font-size: 0.875rem;
    }

    /* File Upload Styles */
    .file-input {
      display: none;
    }

    .file-upload-area {
      border: 2px dashed #007bff;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: #f8f9fa;
      margin-bottom: 1rem;
    }

    .file-upload-area:hover {
      border-color: #0056b3;
      background-color: #e7f3ff;
    }

    .file-upload-area i {
      font-size: 2rem;
      color: #007bff;
      margin-bottom: 0.5rem;
      display: block;
    }

    .file-upload-area p {
      margin: 0.5rem 0;
      color: #495057;
      font-weight: 500;
    }

    .file-upload-area small {
      color: #6c757d;
      font-size: 0.875rem;
    }

    .uploaded-files {
      margin-top: 1rem;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }

    .uploaded-files h4 {
      margin: 0 0 0.75rem 0;
      color: #495057;
      font-size: 1rem;
      font-weight: 600;
    }

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      background-color: white;
      border-radius: 4px;
      border: 1px solid #dee2e6;
    }

    .file-name {
      flex: 1;
      color: #495057;
      font-weight: 500;
    }

    .file-size {
      color: #6c757d;
      font-size: 0.875rem;
      margin-left: 0.5rem;
    }

    .remove-file-btn {
      background: none;
      border: none;
      color: #dc3545;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
    }

    .remove-file-btn:hover {
      background-color: #f8d7da;
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 2.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e9ecef;
    }

    .btn-primary,
    .btn-secondary {
      padding: 14px 32px;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 140px;
      justify-content: center;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
    }

    .fas.fa-spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Custom Select Styling */
    select {
      appearance: none;
      background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="%23495057" viewBox="0 0 16 16"><path d="M8 11.5l-4.5-4.5h9l-4.5 4.5z"/></svg>');
      background-repeat: no-repeat;
      background-position: right 12px center;
      background-size: 16px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .create-project-container {
        padding: 1rem;
      }
      
      .project-form {
        padding: 1.5rem;
      }
      
      .form-header h1 {
        font-size: 1.8rem;
      }
      
      .form-actions {
        flex-direction: column-reverse;
      }
      
      .btn-primary,
      .btn-secondary {
        width: 100%;
      }
    }
  `]
})
export class CreateProjectComponent {
  @Output() projectCreated = new EventEmitter<any>();

  isLoading = false;
  selectedMediaFiles: File[] = [];

  projectData = {
    title: '',
    projectType: '',
    shortDescription: '',
    detailedDescription: '',
    technologiesUsed: '',
    industryDomain: '',
    objective: '',
    demoLink: ''
  };

  constructor(
    private projectService: ProjectService,
    private projectNotificationService: ProjectNotificationService,
    private http: HttpClient
  ) {}

  async createProject() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      // First upload media files if any
      const mediaUrls = await this.uploadMediaFiles();
      
      // Prepare project payload - map to the expected format
      const payload = {
        name: this.projectData.title.trim(),
        country: 'Not specified', // Default value since backend might require it
        description: this.buildDescription(),
        language: 'Not specified', // Default value since backend might require it
        // Additional fields that might be used by backend
        projectType: this.projectData.projectType,
        technologiesUsed: this.projectData.technologiesUsed,
        industryDomain: this.projectData.industryDomain,
        objective: this.projectData.objective,
        demoLink: this.projectData.demoLink || undefined,
        mediaLinks: mediaUrls.join('\n') || undefined
      };

  // Ensure the API call uses port 8081 (not 8082)
  this.projectService.createProject(payload).subscribe({
        next: (res: any) => {
          this.projectCreated.emit(res);
          
          // After creating a project, refresh notifications from backend
          this.projectNotificationService.refreshUserNotifications();
          
          this.resetForm();
          this.isLoading = false;
          alert('Project created successfully!');
        },
        error: (err: any) => {
          console.error('Create project error', err);
          alert('Error creating project: ' + (err.error?.message || err.message || 'Unknown error'));
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload media files. Please try again.');
      this.isLoading = false;
    }
  }

  private buildDescription(): string {
    let description = this.projectData.shortDescription.trim();
    
    if (this.projectData.detailedDescription.trim()) {
      description += '\n\n' + this.projectData.detailedDescription.trim();
    }
    
    if (this.projectData.objective.trim()) {
      description += '\n\nObjective: ' + this.projectData.objective.trim();
    }
    
    if (this.projectData.technologiesUsed.trim()) {
      description += '\n\nTechnologies: ' + this.projectData.technologiesUsed.trim();
    }
    
    if (this.projectData.industryDomain.trim()) {
      description += '\n\nDomain: ' + this.projectData.industryDomain.trim();
    }
    
    return description;
  }

  resetForm() {
    this.projectData = {
      title: '',
      projectType: '',
      shortDescription: '',
      detailedDescription: '',
      technologiesUsed: '',
      industryDomain: '',
      objective: '',
      demoLink: ''
    };
    this.selectedMediaFiles = [];
  }

  onMediaFilesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isValidType) {
        alert(`${file.name} is not a valid image or video file.`);
        return false;
      }
      if (!isValidSize) {
        alert(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    this.selectedMediaFiles = [...this.selectedMediaFiles, ...validFiles];
  }

  triggerFileInput() {
    const fileInput = document.getElementById('mediaFiles') as HTMLInputElement;
    fileInput?.click();
  }

  removeMediaFile(index: number) {
    this.selectedMediaFiles.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async uploadMediaFiles(): Promise<string[]> {
    if (this.selectedMediaFiles.length === 0) return [];

    const uploadPromises = this.selectedMediaFiles.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await this.http.post<{fileUrl: string}>('http://localhost:8081/api/files/upload', formData).toPromise();
        return response?.fileUrl || '';
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        return '';
      }
    });

    const urls = await Promise.all(uploadPromises);
    return urls.filter(url => url !== '');
  }
}
