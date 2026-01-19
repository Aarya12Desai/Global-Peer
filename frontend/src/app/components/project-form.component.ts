import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form (ngSubmit)="onSubmit()" #projectForm="ngForm">
      <div class="form-group">
        <label for="name">Project Name *</label>
        <input type="text" id="name" name="name" [(ngModel)]="project.name" placeholder="Enter your project name" required />
      </div>
      <div class="form-group">
        <label for="description">Description *</label>
        <textarea id="description" name="description" [(ngModel)]="project.description" rows="4" placeholder="Describe your project, goals, and what you're looking for in collaborators" required></textarea>
      </div>
      <div class="form-group">
        <label for="technologiesUsed">Technologies Used *</label>
        <input type="text" id="technologiesUsed" name="technologiesUsed" [(ngModel)]="project.technologiesUsed" placeholder="e.g. Angular, Spring Boot, MySQL" required />
      </div>
      <div class="form-group">
        <label for="domain">Domain *</label>
        <input type="text" id="domain" name="domain" [(ngModel)]="project.domain" placeholder="e.g. FinTech, HealthTech, EdTech" required />
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-primary" [disabled]="!projectForm.valid">Submit</button>
      </div>
    </form>
  `
})
export class ProjectFormComponent {
  @Output() formSubmit = new EventEmitter<any>();
  project: any = {
    name: '',
    description: '',
    technologiesUsed: '',
    domain: ''
  };

  onSubmit() {
    this.formSubmit.emit(this.project);
  }
}
