import { Component, ElementRef, ViewChild, AfterViewChecked, signal, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Messages as MessagesService, Conversation, Message } from '../services/messages';

@Component({
  selector: 'app-messages',
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.html',
  styleUrl: './messages.css'
})
export class Messages implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private messagesService = inject(MessagesService);
  private route = inject(ActivatedRoute);
  
  // Search functionality
  searchQuery = signal('');
  
  // Message input
  newMessageText = '';
  
  // Computed properties
  filteredConversations = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const allConversations = this.messagesService.conversations;
    
    if (!query) return allConversations;
    
    return allConversations.filter((conv: Conversation) => 
      conv.participantName.toLowerCase().includes(query) ||
      conv.lastMessage.toLowerCase().includes(query)
    );
  });
  
  get conversations() {
    return this.messagesService.conversations;
  }
  
  get activeConversationId() {
    return this.messagesService.activeConversationId;
  }
  
  get activeConversation() {
    return this.messagesService.activeConversation;
  }

  private shouldScrollToBottom = false;

  ngOnInit() {
    // Always respond to query param changes to select the correct conversation
    this.route.queryParams.subscribe(params => {
      const participantId = params['user'];
      if (participantId) {
        // Try to find the conversation
        let conv = this.messagesService.conversations.find(c => c.participantId === participantId);
        if (!conv) {
          // Fallback: create a minimal conversation if not found
          conv = {
            id: `conv-${participantId}`,
            participantId,
            participantName: participantId,
            participantAvatar: participantId.substring(0,2).toUpperCase(),
            lastMessage: '',
            lastMessageTime: new Date(),
            unreadCount: 0,
            online: false,
            messages: []
          };
          this.messagesService.addConversation(conv);
        }
        this.selectConversation(conv.id);
      }
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  selectConversation(conversationId: string) {
    this.messagesService.setActiveConversation(conversationId);
    this.messagesService.markConversationAsRead(conversationId);
    this.shouldScrollToBottom = true;
  }

  onSearchChange() {
    // Search is reactive through computed signal
  }

  sendMessage() {
    const content = this.newMessageText?.trim();
    if (!content || !this.activeConversationId) return;

    this.messagesService.sendMessage(this.activeConversationId, content);
    this.newMessageText = '';
    this.shouldScrollToBottom = true;
  }

  onInputChange(event: Event) {
    // Auto-resize textarea
    const textarea = event.target as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }

  formatTimeAgo(timestamp: Date): string {
    return this.messagesService.formatTimeAgo(timestamp);
  }

  formatMessageTime(timestamp: Date): string {
    return this.messagesService.formatMessageTime(timestamp);
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  // Keyboard event handlers
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
