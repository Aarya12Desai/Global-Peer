import { Component, Output, EventEmitter } from '@angular/core';
import { Post } from '../models/post.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../services/post.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="create-post">
      <form (ngSubmit)="createPost()">
        <textarea [(ngModel)]="content" name="content" placeholder="What's on your mind?" required></textarea>
        <input type="file" accept="image/*" (change)="onFileSelected($event)" />
        <div *ngIf="imagePreview" class="image-preview-container">
          <img [src]="imagePreview" alt="Image preview" class="image-preview" />
          <button type="button" (click)="removeImage()">Remove</button>
        </div>
        <button type="submit">Post</button>
      </form>
    </div>
  `,
  styles: [`
    .create-post {
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    textarea {
      width: 100%;
      height: 80px;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #ddd;
      resize: none;
      margin-bottom: 10px;
    }

    input {
      width: 100%;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #ddd;
      margin-bottom: 10px;
    }

    button {
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 10px 16px;
      cursor: pointer;
    }

    button:hover {
      background: #5563c1;
    }
  `]
})

export class CreatePostComponent {
  @Output() postCreated = new EventEmitter<Post>();
  content: string = '';
  imageUrl: string = '';
  imagePreview: string | null = null;
  isLoading: boolean = false;

  constructor(private postService: PostService) {}
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
  this.imagePreview = e.target.result;
  this.imageUrl = this.imagePreview || '';
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.imagePreview = null;
    this.imageUrl = '';
  }

  createPost() {
    if (!this.content.trim() || this.isLoading) return;
    this.isLoading = true;
    this.postService.createPost({
      content: this.content,
      imageUrl: this.imageUrl || undefined
    }).subscribe({
      next: (createdPost) => {
        this.postCreated.emit(createdPost);
        this.content = '';
        this.imageUrl = '';
        this.imagePreview = null;
        this.isLoading = false;
      },
      error: (error) => {
        alert('Failed to create post: ' + (error.error?.message || error.message || 'Unknown error'));
        this.isLoading = false;
      }
    });
  }
}
