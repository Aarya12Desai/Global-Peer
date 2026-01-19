import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth } from '../services/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-company-create-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="create-project-container">
      <div class="form-header">
        <h1>{{isEditMode ? 'Edit Project' : 'Post a New Project'}}</h1>
        <p>{{isEditMode ? 'Update your project details' : 'Showcase your company project to attract collaborators'}}</p>
      </div>

      <form [formGroup]="projectForm" (ngSubmit)="onSubmit()" class="project-form">
        <div class="form-group">
          <label for="title">Project Title/Name *</label>
          <input 
            type="text" 
            id="title" 
            formControlName="title"
            placeholder="Enter your project title"
            [class.error]="projectForm.get('title')?.invalid && projectForm.get('title')?.touched"
          >
          <div *ngIf="projectForm.get('title')?.invalid && projectForm.get('title')?.touched" class="error-message">
            Project title is required (minimum 3 characters)
          </div>
        </div>

        <div class="form-group">
          <label for="projectType">Category / Type *</label>
          <select 
            id="projectType" 
            formControlName="projectType"
            [class.error]="projectForm.get('projectType')?.invalid && projectForm.get('projectType')?.touched"
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
          <div *ngIf="projectForm.get('projectType')?.invalid && projectForm.get('projectType')?.touched" class="error-message">
            Project category is required
          </div>
        </div>

        <div class="form-group">
          <label for="shortDescription">Short Description *</label>
          <textarea 
            id="shortDescription" 
            formControlName="shortDescription"
            rows="3"
            placeholder="Brief overview of your project (elevator pitch)"
            [class.error]="projectForm.get('shortDescription')?.invalid && projectForm.get('shortDescription')?.touched"
          ></textarea>
          <div *ngIf="projectForm.get('shortDescription')?.invalid && projectForm.get('shortDescription')?.touched" class="error-message">
            Short description is required (minimum 10 characters)
          </div>
        </div>

        <div class="form-group">
          <label for="detailedDescription">Detailed Description *</label>
          <textarea 
            id="detailedDescription" 
            formControlName="detailedDescription"
            rows="6"
            placeholder="Detailed explanation: problem solved, features, workflow, what makes it unique..."
            [class.error]="projectForm.get('detailedDescription')?.invalid && projectForm.get('detailedDescription')?.touched"
          ></textarea>
          <div *ngIf="projectForm.get('detailedDescription')?.invalid && projectForm.get('detailedDescription')?.touched" class="error-message">
            Detailed description is required (minimum 20 characters)
          </div>
        </div>

        <div class="form-group">
          <label for="technologiesUsed">Technologies Used *</label>
          <input 
            type="text" 
            id="technologiesUsed" 
            formControlName="technologiesUsed"
            placeholder="e.g., React, Node.js, Python, AWS, MongoDB, TensorFlow..."
            [class.error]="projectForm.get('technologiesUsed')?.invalid && projectForm.get('technologiesUsed')?.touched"
          >
          <div *ngIf="projectForm.get('technologiesUsed')?.invalid && projectForm.get('technologiesUsed')?.touched" class="error-message">
            Technologies used are required
          </div>
        </div>

        <div class="form-group">
          <label for="industryDomain">Industry / Domain *</label>
          <select 
            id="industryDomain" 
            formControlName="industryDomain"
            [class.error]="projectForm.get('industryDomain')?.invalid && projectForm.get('industryDomain')?.touched"
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
          <div *ngIf="projectForm.get('industryDomain')?.invalid && projectForm.get('industryDomain')?.touched" class="error-message">
            Industry domain is required
          </div>
        </div>

        <div class="form-group">
          <label for="objective">Objective / Purpose *</label>
          <textarea 
            id="objective" 
            formControlName="objective"
            rows="4"
            placeholder="Why was this project made? What problem does it solve? What value does it provide?"
            [class.error]="projectForm.get('objective')?.invalid && projectForm.get('objective')?.touched"
          ></textarea>
          <div *ngIf="projectForm.get('objective')?.invalid && projectForm.get('objective')?.touched" class="error-message">
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
          
          <!-- Show existing uploaded files (when editing) -->
          <div *ngIf="uploadedMediaUrls.length > 0" class="existing-files">
            <h4>Current Media Files:</h4>
            <div *ngFor="let url of uploadedMediaUrls; let i = index" class="existing-file-item">
              <a [href]="url" target="_blank" class="file-link">
                <i class="fas fa-external-link-alt"></i> View File {{i + 1}}
              </a>
              <button type="button" class="remove-file-btn" (click)="removeExistingFile(i)">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          
          <!-- Show newly selected files -->
          <div *ngIf="selectedMediaFiles.length > 0" class="uploaded-files">
            <h4>New Files to Upload:</h4>
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
            formControlName="demoLink"
            placeholder="https://github.com/yourproject or https://demo.yourproject.com"
          >
          <small class="form-hint">Optional: Link to live demo or source code repository</small>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" (click)="goBack()">
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn-primary" 
            [disabled]="projectForm.invalid || isSubmitting"
          >
            <span *ngIf="isSubmitting">
              <i class="fas fa-spinner fa-spin"></i>
              {{isEditMode ? 'Updating...' : 'Publishing...'}}
            </span>
            <span *ngIf="!isSubmitting">
              <i class="fas fa-rocket"></i>
              {{isEditMode ? 'Update Project' : 'Publish Project'}}
            </span>
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./company-create-project.css']
})
export class CompanyCreateProjectComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  isSubmitting = false;
  isEditMode = false;
  projectId: number | null = null;
  selectedMediaFiles: File[] = [];
  uploadedMediaUrls: string[] = [];
  tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  projectForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    projectType: ['', Validators.required],
    shortDescription: ['', [Validators.required, Validators.minLength(10)]],
    detailedDescription: ['', [Validators.required, Validators.minLength(20)]],
    technologiesUsed: ['', Validators.required],
    industryDomain: ['', Validators.required],
    objective: ['', Validators.required],
    demoLink: ['']
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.projectId = +params['id'];
        this.loadProject();
      }
    });
  }

  loadProject() {
    if (!this.projectId) return;

    this.http.get(`http://localhost:8081/api/company-projects/${this.projectId}`)
      .subscribe({
        next: (project: any) => {
          this.projectForm.patchValue({
            title: project.title,
            projectType: project.projectType,
            shortDescription: project.shortDescription,
            detailedDescription: project.detailedDescription,
            technologiesUsed: project.technologiesUsed,
            industryDomain: project.industryDomain,
            objective: project.objective,
            demoLink: project.demoLink
          });
          
          // Handle existing media links
          if (project.mediaLinks) {
            this.uploadedMediaUrls = project.mediaLinks.split('\n').filter((url: string) => url.trim());
          }
        },
        error: (error) => {
          console.error('Error loading project:', error);
          alert('Failed to load project details.');
          this.router.navigate(['/company/projects']);
        }
      });
  }

  onSubmit() {
    if (this.projectForm.valid) {
      this.isSubmitting = true;
      
      // First upload new media files, then create/update project
      this.uploadMediaFiles().then(newMediaUrls => {
        // Combine existing URLs with new uploaded URLs
        const allMediaUrls = [...this.uploadedMediaUrls, ...newMediaUrls];
        
        const projectData = { 
          ...this.projectForm.value,
          mediaLinks: allMediaUrls.join('\n') // Store URLs as newline-separated string
        };
        
        const token = this.authService.token;
        const headers = new HttpHeaders()
          .set('Authorization', `Bearer ${token}`)
          .set('Content-Type', 'application/json');
          
        if (this.isEditMode && this.projectId) {
          this.http.put(`http://localhost:8081/api/company-projects/${this.projectId}`, projectData, { headers })
            .subscribe({
              next: (response) => {
                this.router.navigate(['/company/projects']);
              },
              error: (error) => {
                alert('Failed to update project. Please try again.');
                this.isSubmitting = false;
              }
            });
        } else {
          this.http.post('http://localhost:8081/api/company-projects', projectData, { headers })
            .subscribe({
              next: (response) => {
                this.router.navigate(['/company/projects']);
              },
              error: (error) => {
                alert('Failed to create project. Please try again.');
                this.isSubmitting = false;
              }
            });
        }
      }).catch(error => {
        console.error('Error uploading files:', error);
        alert('Failed to upload media files. Please try again.');
        this.isSubmitting = false;
      });
    } else {
      Object.keys(this.projectForm.controls).forEach(key => {
        this.projectForm.get(key)?.markAsTouched();
      });
    }
  }

  goBack() {
    this.router.navigate(['/company/projects']);
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

  removeExistingFile(index: number) {
    this.uploadedMediaUrls.splice(index, 1);
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
        const response = await this.http.post<{url: string}>('http://localhost:8081/api/upload/media', formData).toPromise();
        return response?.url || '';
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        return '';
      }
    });

    const urls = await Promise.all(uploadPromises);
    return urls.filter(url => url !== '');
  }
}
