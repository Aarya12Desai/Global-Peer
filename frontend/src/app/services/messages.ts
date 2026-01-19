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
    this.http.get<Message[]>(`http://localhost:8081/api/messages/inbox`, { headers })
      .subscribe({
        next: (messages) => {
          // Get current user id from auth
          const currentUser = this.auth.currentUser;
          const currentUserId = currentUser && currentUser.id ? currentUser.id : null;
          const conversationsMap: { [key: string]: Conversation } = {};
          messages.forEach(msg => {
            // The participant is the other user (not the current user)
            let participantId = msg.senderId;
            let participantName = msg.senderName;
            if (currentUserId && msg.senderId === currentUserId) {
              // If the current user is the sender, try to use recipient fields if available (future-proof)
              if ((msg as any).recipientId) {
                participantId = (msg as any).recipientId;
              }
              if ((msg as any).recipientName) {
                participantName = (msg as any).recipientName;
              }
            }
            if (!conversationsMap[participantId]) {
              conversationsMap[participantId] = {
                id: `conv-${participantId}`,
                participantId: participantId,
                participantName: participantName,
                participantAvatar: participantName ? participantName.substring(0, 2).toUpperCase() : '',
                lastMessage: msg.content,
                lastMessageTime: new Date(msg.timestamp),
                unreadCount: 0,
                online: false,
                messages: []
              };
            }
            conversationsMap[participantId].messages.push({
              id: msg.id,
              senderId: msg.senderId,
              senderName: msg.senderName,
              senderAvatar: msg.senderName ? msg.senderName.substring(0, 2).toUpperCase() : '',
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              read: true,
              type: msg.type || 'text'
            });
            // Update last message
            conversationsMap[participantId].lastMessage = msg.content;
            conversationsMap[participantId].lastMessageTime = new Date(msg.timestamp);
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
