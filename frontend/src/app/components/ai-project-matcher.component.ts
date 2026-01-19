import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-ai-project-matcher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ai-matcher-container">
      <div class="form-header">
        <h1>AI Project Matching</h1>
        <p>Describe your project to find relevant companies and collaborators</p>
      </div>

      <form #projectForm="ngForm" (ngSubmit)="findMatches()" class="project-form">
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
              Finding Matches...
            </span>
            <span *ngIf="!isLoading">
              <i class="fas fa-magic"></i>
              Find AI Matches
            </span>
          </button>
        </div>
      </form>

      <!-- AI Matching Results -->
      <div *ngIf="matchingResults.length > 0" class="matching-results">
        <h2>AI Matching Results</h2>
        <div class="results-grid">
          <div *ngFor="let match of matchingResults" class="match-card">
            <div class="match-header">
              <h3>{{match.name}}</h3>
              <div class="match-score">
                <span class="score">{{match.matchScore}}%</span>
                <span class="score-label">Match</span>
              </div>
            </div>
            <p class="match-description">{{match.description}}</p>
            <div class="match-details">
              <div class="detail-item">
                <strong>Type:</strong> {{match.type}}
              </div>
              <div class="detail-item">
                <strong>Industry:</strong> {{match.industry}}
              </div>
              <div class="detail-item" *ngIf="match.technologies">
                <strong>Technologies:</strong> {{match.technologies}}
              </div>
            </div>
            <div class="match-actions">
              <button class="btn-contact" (click)="contactMatch(match)">
                <i class="fas fa-envelope"></i>
                Contact
              </button>
              <button class="btn-view" (click)="viewDetails(match)">
                <i class="fas fa-eye"></i>
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results Message -->
      <div *ngIf="showNoResults" class="no-results">
        <i class="fas fa-search"></i>
        <h3>No matches found</h3>
        <p>Try adjusting your project description or technologies to find better matches.</p>
      </div>
    </div>
  `,
  styles: [`
    .ai-matcher-container {
      max-width: 1000px;
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
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4);
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

    /* Matching Results Styles */
    .matching-results {
      margin-top: 3rem;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      border: 1px solid #e9ecef;
    }

    .matching-results h2 {
      margin: 0 0 2rem 0;
      color: #2c3e50;
      font-size: 1.8rem;
      font-weight: 700;
      text-align: center;
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .match-card {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.3s ease;
    }

    .match-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .match-header h3 {
      margin: 0;
      color: #2c3e50;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .match-score {
      text-align: center;
    }

    .score {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #28a745;
    }

    .score-label {
      font-size: 0.8rem;
      color: #6c757d;
    }

    .match-description {
      color: #495057;
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .match-details {
      margin-bottom: 1.5rem;
    }

    .detail-item {
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      color: #495057;
    }

    .detail-item strong {
      color: #2c3e50;
    }

    .match-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-contact,
    .btn-view {
      flex: 1;
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .btn-contact {
      background: #007bff;
      color: white;
    }

    .btn-contact:hover {
      background: #0056b3;
    }

    .btn-view {
      background: #6c757d;
      color: white;
    }

    .btn-view:hover {
      background: #545b62;
    }

    .no-results {
      text-align: center;
      padding: 3rem 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      border: 1px solid #e9ecef;
      margin-top: 3rem;
    }

    .no-results i {
      font-size: 3rem;
      color: #6c757d;
      margin-bottom: 1rem;
    }

    .no-results h3 {
      margin: 0 0 1rem 0;
      color: #495057;
      font-size: 1.5rem;
    }

    .no-results p {
      margin: 0;
      color: #6c757d;
      font-size: 1rem;
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
      .ai-matcher-container {
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

      .results-grid {
        grid-template-columns: 1fr;
      }

      .match-actions {
        flex-direction: column;
      }
    }
  `]
})
export class AiProjectMatcherComponent {
  @Output() matchesFound = new EventEmitter<any[]>();

  isLoading = false;
  matchingResults: any[] = [];
  showNoResults = false;

  projectData = {
    title: '',
    projectType: '',
    shortDescription: ''
  };

  constructor(private http: HttpClient) {}

  async findMatches() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.matchingResults = [];
    this.showNoResults = false;
    
    try {
      // Prepare the project data for AI matching (no database save)
      const matchingPayload = {
        title: this.projectData.title.trim(),
        projectType: this.projectData.projectType,
        description: this.projectData.shortDescription.trim()
      };

      // Call AI matching API endpoint (this would be a new endpoint that doesn't save to DB)
      this.http.post<any>('http://localhost:8081/api/ai/match-projects', matchingPayload).subscribe({
        next: (response: any) => {
          this.matchingResults = response.matches || [];
          this.showNoResults = this.matchingResults.length === 0;
          this.matchesFound.emit(this.matchingResults);
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('AI matching error', err);
          // For demo purposes, show mock results if API fails
          this.showMockResults();
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error in AI matching:', error);
      this.showMockResults();
      this.isLoading = false;
    }
  }

  private showMockResults() {
    // Mock results for demonstration
    this.matchingResults = [
      {
        id: 1,
        name: 'TechCorp Solutions',
        type: 'Company',
        industry: 'Technology',
        description: 'Leading technology company specializing in innovative solutions',
        technologies: 'Various Technologies',
        matchScore: 92
      },
      {
        id: 2,
        name: 'StartupX Ventures',
        type: 'Startup',
        industry: 'Technology',
        description: 'Fast-growing startup looking for collaborative projects',
        technologies: 'React, Node.js, MongoDB',
        matchScore: 78
      },
      {
        id: 3,
        name: 'InnovateHub',
        type: 'Incubator',
        industry: 'Technology',
        description: 'Technology incubator supporting emerging projects',
        technologies: 'Various',
        matchScore: 65
      }
    ];
    this.showNoResults = false;
  }

  resetForm() {
    this.projectData = {
      title: '',
      projectType: '',
      shortDescription: ''
    };
    this.matchingResults = [];
    this.showNoResults = false;
  }

  contactMatch(match: any) {
    // Implement contact functionality
    alert(`Contacting ${match.name}...`);
  }

  viewDetails(match: any) {
    // Implement view details functionality
    alert(`Viewing details for ${match.name}...`);
  }
}
