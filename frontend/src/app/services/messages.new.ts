import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from './auth';
import { signal } from '@angular/core';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  online: boolean;
  messages: Message[];
}

@Injectable({
  providedIn: 'root'
})
export class Messages {
  private conversationsSignal = signal<Conversation[]>([]);
  private activeConversationSignal = signal<string | null>(null);

  constructor(private http: HttpClient, private auth: Auth) {
    this.fetchInbox();
  }

  get conversations() {
    return this.conversationsSignal();
  }

  addConversation(conversation: Conversation) {
    this.conversationsSignal.set([
      conversation,
      ...this.conversationsSignal()
    ]);
  }

  get activeConversationId() {
    return this.activeConversationSignal();
  }

  get activeConversation() {
    const activeId = this.activeConversationSignal();
    return this.conversationsSignal().find(c => c.id === activeId) || null;
  }

  get totalUnreadCount() {
    return this.conversationsSignal().reduce((total, conv) => total + conv.unreadCount, 0);
  }

  fetchInbox() {
    const token = this.auth.token;
    if (!token) {
      this.conversationsSignal.set([]);
      return;
    }
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<any[]>(`http://localhost:8081/api/messages/inbox`, { headers })
      .subscribe({
        next: (messages) => {
          // Group messages by participant
          const conversationsMap: { [key: string]: Conversation } = {};
          messages.forEach(msg => {
            const participantId = msg.sender.id;
            if (!conversationsMap[participantId]) {
              conversationsMap[participantId] = {
                id: `conv-${participantId}`,
                participantId: participantId,
                participantName: msg.sender.username,
                participantAvatar: msg.sender.username ? msg.sender.username.substring(0,2).toUpperCase() : '',
                lastMessage: msg.content,
                lastMessageTime: new Date(msg.createdAt),
                unreadCount: 0, // You can update this if you have read status
                online: false,
                messages: []
              };
            }
            conversationsMap[participantId].messages.push({
              id: msg.id,
              senderId: msg.sender.id,
              senderName: msg.sender.username,
              senderAvatar: msg.sender.username ? msg.sender.username.substring(0,2).toUpperCase() : '',
              content: msg.content,
              timestamp: new Date(msg.createdAt),
              read: true, // Update if you have read status
              type: 'text'
            });
            // Update last message
            conversationsMap[participantId].lastMessage = msg.content;
            conversationsMap[participantId].lastMessageTime = new Date(msg.createdAt);
          });
          this.conversationsSignal.set(Object.values(conversationsMap));
        },
        error: (err) => {
          console.error('Failed to fetch inbox:', err);
          this.conversationsSignal.set([]);
        }
      });
  }

  setActiveConversation(conversationId: string) {
    this.activeConversationSignal.set(conversationId);
    this.markConversationAsRead(conversationId);
  }

  sendMessage(conversationId: string, content: string, type: 'text' | 'image' | 'file' = 'text') {
    // Implement sending message to backend here
    // ...existing code for local update...
  }

  markConversationAsRead(conversationId: string) {
    const conversations = this.conversationsSignal();
    const updatedConversations = conversations.map(conv => 
      conv.id === conversationId 
        ? { 
            ...conv, 
            unreadCount: 0,
            messages: conv.messages.map(msg => ({ ...msg, read: true }))
          }
        : conv
    );
    this.conversationsSignal.set(updatedConversations);
  }

  formatTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  }

  formatMessageTime(timestamp: Date): string {
    const now = new Date();
    const isToday = timestamp.toDateString() === now.toDateString();
    if (isToday) {
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  searchConversations(query: string): Conversation[] {
    if (!query.trim()) {
      return this.conversations;
    }
    return this.conversations.filter(conv =>
      conv.participantName.toLowerCase().includes(query.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(query.toLowerCase())
    );
  }
}
