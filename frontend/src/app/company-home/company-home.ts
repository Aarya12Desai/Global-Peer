import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProjectsBrowseComponent } from '../user-projects-browse/user-projects-browse';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-company-home',
  standalone: true,
  imports: [CommonModule, UserProjectsBrowseComponent],
  template: `
    <div class="company-dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <h1>Welcome back, {{companyName}}</h1>
        <p class="text-muted">Manage your job postings and company profile</p>
      </div>
      <div class="user-projects-section">
        <h2>User Project Postings</h2>
        <app-user-projects-browse></app-user-projects-browse>
      </div>
    </div>
  `
})
export class CompanyHomeComponent implements OnInit {
  companyName: string = '';

  ngOnInit(): void {
    // Optionally, set companyName from a service if needed
  }
}
