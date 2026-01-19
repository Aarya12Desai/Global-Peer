import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '../services/auth';

interface Project {
  id: number;
  name: string;
  description: string;
  country?: string;
  language?: string;
  createdAt: string;
  creatorUsername?: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './projects.html',
  styleUrl: './projects.css'
})
export class ProjectsComponent implements OnInit {
  projects = signal<Project[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    console.log('Loading projects...');
    const token = this.auth.token;
    console.log('Token available:', !!token);
    
    if (!token) {
      console.log('No token found, user needs to log in');
      this.error.set('Please log in to view your projects');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('Making request to:', 'http://localhost:8081/api/projects/my-projects');
    console.log('Headers:', headers.keys());

    this.http.get<Project[]>('http://localhost:8081/api/projects/my-projects', { headers })
      .subscribe({
        next: (projects) => {
          console.log('Projects received:', projects);
          this.projects.set(projects);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading projects:', err);
          console.error('Error status:', err.status);
          console.error('Error message:', err.error);
          this.error.set(err.error?.message || 'Failed to load projects');
          this.loading.set(false);
        }
      });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  deleteProject(projectId: number) {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    const token = this.auth.token;
    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.delete(`http://localhost:8081/api/projects/${projectId}`, { headers })
      .subscribe({
        next: () => {
          this.projects.update(projects => 
            projects.filter(p => p.id !== projectId)
          );
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to delete project');
        }
      });
  }
}
