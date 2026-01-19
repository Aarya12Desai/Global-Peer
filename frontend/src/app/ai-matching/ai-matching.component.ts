import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '../services/auth';
import { Notifications } from '../services/notifications';
import { ProjectFormComponent } from '../components/project-form.component';

@Component({
  selector: 'app-ai-matching',
  standalone: true,
  imports: [CommonModule, ProjectFormComponent],
  template: `
    <div class="ai-matching-form-container">
      <div class="ai-matching-form-card">
        <div class="header">
          <h2>AI Project Matching</h2>
          <p>Find matching projects using AI (no project will be created)</p>
        </div>
        <app-project-form (formSubmit)="onProjectFormSubmit($event)"></app-project-form>
        <div *ngIf="error" class="error-message">{{ error }}</div>
        <div *ngIf="matches && matches.length > 0" class="matches-list">
          <h3>Matched Projects ({{ matches.length }} found)</h3>
          <div class="match-cards">
            <div *ngFor="let match of matches" class="match-card">
              <div class="match-header">
                <h4>{{ match.title }}</h4>
                <span class="match-score">{{ match.matchScore }}% match</span>
              </div>
              <div class="match-details">
                <p><strong>Creator:</strong> {{ match.creator || 'Unknown' }}</p>
                <p><strong>Domain:</strong> {{ match.domain }}</p>
                <p><strong>Technologies:</strong> {{ match.technologies }}</p>
                <p><strong>Description:</strong> {{ match.description }}</p>
                <p *ngIf="match.createdAt" class="created-date">Created: {{ formatDate(match.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>
        <div *ngIf="matches && matches.length === 0 && !loading" class="no-matches">
          <h4>No matching projects found</h4>
          <p>No projects in the database match your criteria with sufficient similarity (≥50%).</p>
          <p>Try adjusting your domain, technologies, or description to find more matches.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-matching-form-container { max-width: 800px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #43cea2 0%, #185a9d 100%); min-height: 100vh; }
    .ai-matching-form-card { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); }
    .header { text-align: center; margin-bottom: 30px; }
    .form-group { margin-bottom: 20px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .btn-primary { background: #185a9d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
    .btn-primary:disabled { background: #b0b0b0; cursor: not-allowed; }
    .error-message { color: #d32f2f; margin-top: 10px; text-align: center; }
    .matches-list { margin-top: 30px; }
    .match-cards { display: flex; flex-direction: column; gap: 15px; }
    .match-card { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; transition: transform 0.2s, box-shadow 0.2s; }
    .match-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .match-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .match-header h4 { margin: 0; color: #333; font-size: 1.2em; }
    .match-score { background: #4caf50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.9em; font-weight: bold; }
    .match-details p { margin: 8px 0; color: #555; }
    .match-details strong { color: #333; }
    .created-date { font-size: 0.9em; color: #888; font-style: italic; }
    .no-matches { margin-top: 30px; text-align: center; color: #888; background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px dashed #ddd; }
    .no-matches h4 { color: #666; margin-bottom: 10px; }
    .no-matches p { margin: 5px 0; font-size: 0.95em; }
  `]
})
export class AiMatchingComponent {
  matches: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient, private auth: Auth, private notifications: Notifications) {}

  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  onProjectFormSubmit(form: any) {
    if (this.loading) return;
    const token = this.auth.token;
    if (!token) {
      this.error = 'Please log in to use AI matching';
      return;
    }
    this.loading = true;
    this.error = null;
    this.matches = [];
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const payload = {
      name: form.name,
      description: form.description,
      technologiesUsed: form.technologiesUsed,
      domain: form.domain
    };
    this.http.post<any[]>('http://localhost:8081/api/ai-matching', payload, { headers })
      .subscribe({
        next: (response) => {
          this.matches = response || [];
          this.loading = false;
          if (this.matches.length > 0) {
            this.notifications.addNotification({
              type: 'project_match',
              title: 'AI Project Match',
              message: `Found ${this.matches.length} matching projects!`,
              read: false
            });
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to find matches. Please try again.';
          this.loading = false;
        }
      });
  }
}
