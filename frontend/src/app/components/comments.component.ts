import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Comment, CreateCommentRequest } from '../models/post.model';
import { PostService } from '../services/post.service';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="comments-container">
      <!-- Add new comment -->
      <div class="add-comment-section" *ngIf="showAddCommentBox !== false">
        <div class="comment-input-container">
          <div class="user-avatar-small">{{ getCurrentUserInitial() }}</div>
          <textarea 
            [(ngModel)]="newComment" 
            placeholder="Write a comment..."
            class="comment-input"
            rows="2"
            maxlength="500"
            (keydown)="onKeyDown($event)">
          </textarea>
        </div>
        <div class="comment-actions">
          <span class="character-count" [class.warning]="newComment.length > 450">
            {{ newComment.length }}/500
          </span>
          <button 
            class="submit-comment-btn" 
            (click)="submitComment()"
            [disabled]="!canSubmitComment()"
            [class.loading]="isSubmitting">
            {{ isSubmitting ? 'Posting...' : 'Comment' }}
          </button>
        </div>
      </div>
  @Input() showAddCommentBox: boolean = true;

      <!-- Comments list -->
      <div class="comments-list" *ngIf="comments.length > 0">
        <div class="comment" *ngFor="let comment of comments; trackBy: trackByCommentId">
          <div class="comment-header">
            <div class="comment-author">
              <div class="author-avatar-small">{{ comment.authorUsername[0].toUpperCase() }}</div>
              <div class="comment-info">
                <span class="comment-author-name">{{ comment.authorUsername }}</span>
                <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
              </div>
            </div>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
          <div class="comment-actions">
            <button class="comment-action-btn like-comment-btn">
              <span class="like-icon">🤍</span> Like
            </button>
            <button class="comment-action-btn reply-btn" (click)="startReply(comment)">
              💬 Reply
            </button>
          </div>
          
          <!-- Reply input -->
          <div class="reply-input-section" *ngIf="replyingTo === comment.id">
            <div class="reply-input-container">
              <div class="user-avatar-tiny">{{ getCurrentUserInitial() }}</div>
              <textarea 
                [(ngModel)]="replyText" 
                placeholder="Write a reply..."
                class="reply-input"
                rows="1">
              </textarea>
            </div>
            <div class="reply-actions">
              <button class="cancel-reply-btn" (click)="cancelReply()">Cancel</button>
              <button 
                class="submit-reply-btn" 
                (click)="submitReply(comment.id)"
                [disabled]="!replyText.trim() || isSubmittingReply">
                {{ isSubmittingReply ? 'Posting...' : 'Reply' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No comments message -->
      <div class="no-comments" *ngIf="comments.length === 0 && !isLoading">
        <div class="no-comments-icon"></div>
        <p></p>
      </div>

      <!-- Loading indicator -->
      <div class="comments-loading" *ngIf="isLoading">
        <div class="loading-spinner"></div>
        <p>Loading comments...</p>
      </div>
    </div>
  `,
  styles: [`
    .comments-container {
      margin-top: 15px;
    }

    .add-comment-section {
      margin-bottom: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e1e8ed;
    }

    .comment-input-container {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }

    .user-avatar-small {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      flex-shrink: 0;
    }

    .user-avatar-tiny {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
      flex-shrink: 0;
    }

    .comment-input, .reply-input {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid #e1e8ed;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      min-height: 40px;
      transition: border-color 0.2s;
    }

    .comment-input:focus, .reply-input:focus {
      outline: none;
      border-color: #1da1f2;
      box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.1);
    }

    .comment-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .character-count {
      font-size: 12px;
      color: #657786;
    }

    .character-count.warning {
      color: #e0245e;
    }

    .submit-comment-btn {
      background: #1da1f2;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 70px;
    }

    .submit-comment-btn:hover:not(:disabled) {
      background: #1991da;
      transform: translateY(-1px);
    }

    .submit-comment-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .submit-comment-btn.loading {
      opacity: 0.8;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .comment {
      padding: 15px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e1e8ed;
      transition: border-color 0.2s;
    }

    .comment:hover {
      border-color: #ccd6dd;
    }

    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .comment-author {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .comment-info {
      display: flex;
      flex-direction: column;
    }

    .comment-author-name {
      font-weight: 600;
      color: #1a1a1a;
      font-size: 14px;
    }

    .comment-time {
      color: #657786;
      font-size: 12px;
    }

    .comment-content {
      color: #1a1a1a;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 10px;
      word-wrap: break-word;
    }

    .comment-actions {
      display: flex;
      gap: 15px;
    }

    .comment-action-btn {
      background: none;
      border: none;
      color: #657786;
      font-size: 12px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .comment-action-btn:hover {
      background-color: #f7f9fa;
      color: #1a1a1a;
    }

    .reply-input-section {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #e1e8ed;
    }

    .reply-input-container {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }

    .reply-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .cancel-reply-btn, .submit-reply-btn {
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .cancel-reply-btn {
      background: none;
      border: 1px solid #e1e8ed;
      color: #657786;
    }

    .cancel-reply-btn:hover {
      background: #f7f9fa;
      border-color: #657786;
    }

    .submit-reply-btn {
      background: #1da1f2;
      color: white;
      border: none;
    }

    .submit-reply-btn:hover:not(:disabled) {
      background: #1991da;
    }

    .submit-reply-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .no-comments {
      text-align: center;
      padding: 40px 20px;
      color: #657786;
    }

    .no-comments-icon {
      font-size: 32px;
      margin-bottom: 10px;
    }

    .no-comments p {
      margin: 0;
      font-size: 14px;
    }

    .comments-loading {
      text-align: center;
      padding: 30px;
      color: #657786;
    }

    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #e1e8ed;
      border-top: 2px solid #1da1f2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .comments-loading p {
      margin: 0;
      font-size: 14px;
    }
  `]
})
export class CommentsComponent implements OnInit {
  @Input() postId!: number;
  @Input() comments: Comment[] = [];
  @Input() showAddCommentBox: boolean = true;
  @Output() commentAdded = new EventEmitter<Comment>();
  @Output() commentsLoaded = new EventEmitter<Comment[]>();

  newComment = '';
  replyText = '';
  replyingTo: number | null = null;
  isSubmitting = false;
  isSubmittingReply = false;
  isLoading = false;

  constructor(private postService: PostService) {}

  ngOnInit() {
    if (this.comments.length === 0) {
      this.loadComments();
    }
  }

  loadComments() {
    this.isLoading = true;
    this.postService.getComments(this.postId).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.commentsLoaded.emit(comments);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.isLoading = false;
      }
    });
  }

  canSubmitComment(): boolean {
    return this.newComment.trim().length > 0 && 
           this.newComment.length <= 500 && 
           !this.isSubmitting;
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.canSubmitComment()) {
        this.submitComment();
      }
    }
  }

  submitComment() {
    if (!this.canSubmitComment()) return;

    this.isSubmitting = true;
    const request: CreateCommentRequest = {
      content: this.newComment.trim()
    };

    this.postService.addComment(this.postId, request).subscribe({
      next: (comment) => {
        this.comments.unshift(comment);
        this.commentAdded.emit(comment);
        this.newComment = '';
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.isSubmitting = false;
      }
    });
  }

  startReply(comment: Comment) {
    this.replyingTo = comment.id;
    this.replyText = '';
  }

  cancelReply() {
    this.replyingTo = null;
    this.replyText = '';
  }

  submitReply(parentCommentId: number) {
    if (!this.replyText.trim() || this.isSubmittingReply) return;

    this.isSubmittingReply = true;
    const request: CreateCommentRequest = {
      content: this.replyText.trim(),
      parentCommentId: parentCommentId
    };

    this.postService.addComment(this.postId, request).subscribe({
      next: (comment) => {
        this.comments.push(comment);
        this.commentAdded.emit(comment);
        this.cancelReply();
        this.isSubmittingReply = false;
      },
      error: (error) => {
        console.error('Error adding reply:', error);
        this.isSubmittingReply = false;
      }
    });
  }

  trackByCommentId(index: number, comment: Comment): number {
    return comment.id;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return date.toLocaleDateString();
  }

  getCurrentUserInitial(): string {
    // For now, just return a default. In a real app, you'd get this from the auth service
    return 'U';
  }
}
