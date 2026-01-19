import { Injectable, signal } from '@angular/core';

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

  constructor() {
    this.loadSampleConversations();
  }

  get conversations() {
    return this.conversationsSignal();
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

  private loadSampleConversations() {
    const now = new Date();
    const conversations: Conversation[] = [
      {
        id: '1',
        participantId: 'john-doe',
        participantName: 'John Doe',
        participantAvatar: 'JD',
        lastMessage: 'Hey! How\'s the project going?',
        lastMessageTime: new Date(now.getTime() - 1000 * 60 * 30), // 30 minutes ago
        unreadCount: 2,
        online: true,
        messages: [
          {
            id: 'm1',
            senderId: 'john-doe',
            senderName: 'John Doe',
            senderAvatar: 'JD',
            content: 'Hi there! Welcome to CrewUp!',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2 hours ago
            read: true,
            type: 'text'
          },
          {
            id: 'm2',
            senderId: 'current-user',
            senderName: 'You',
            senderAvatar: 'ME',
            content: 'Thanks! This platform looks amazing.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60), // 1 hour ago
            read: true,
            type: 'text'
          },
          {
            id: 'm3',
            senderId: 'john-doe',
            senderName: 'John Doe',
            senderAvatar: 'JD',
            content: 'Hey! How\'s the project going?',
            timestamp: new Date(now.getTime() - 1000 * 60 * 30), // 30 minutes ago
            read: false,
            type: 'text'
          },
          {
            id: 'm4',
            senderId: 'john-doe',
            senderName: 'John Doe',
            senderAvatar: 'JD',
            content: 'Let me know if you need any help!',
            timestamp: new Date(now.getTime() - 1000 * 60 * 25), // 25 minutes ago
            read: false,
            type: 'text'
          }
        ]
      },
      {
        id: '2',
        participantId: 'sarah-miller',
        participantName: 'Sarah Miller',
        participantAvatar: 'SM',
        lastMessage: 'Great work on the presentation! 👏',
        lastMessageTime: new Date(now.getTime() - 1000 * 60 * 60 * 3), // 3 hours ago
        unreadCount: 0,
        online: false,
        messages: [
          {
            id: 'm5',
            senderId: 'sarah-miller',
            senderName: 'Sarah Miller',
            senderAvatar: 'SM',
            content: 'Hi! I saw your latest post. Impressive work!',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 5), // 5 hours ago
            read: true,
            type: 'text'
          },
          {
            id: 'm6',
            senderId: 'current-user',
            senderName: 'You',
            senderAvatar: 'ME',
            content: 'Thank you so much! I really appreciate the feedback.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 4), // 4 hours ago
            read: true,
            type: 'text'
          },
          {
            id: 'm7',
            senderId: 'sarah-miller',
            senderName: 'Sarah Miller',
            senderAvatar: 'SM',
            content: 'Great work on the presentation! 👏',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 3), // 3 hours ago
            read: true,
            type: 'text'
          }
        ]
      },
      {
        id: '3',
        participantId: 'alex-johnson',
        participantName: 'Alex Johnson',
        participantAvatar: 'AJ',
        lastMessage: 'Are you available for a quick call?',
        lastMessageTime: new Date(now.getTime() - 1000 * 60 * 60 * 24), // 1 day ago
        unreadCount: 1,
        online: true,
        messages: [
          {
            id: 'm8',
            senderId: 'alex-johnson',
            senderName: 'Alex Johnson',
            senderAvatar: 'AJ',
            content: 'Hey! I\'d love to collaborate on a project.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 25), // 25 hours ago
            read: true,
            type: 'text'
          },
          {
            id: 'm9',
            senderId: 'alex-johnson',
            senderName: 'Alex Johnson',
            senderAvatar: 'AJ',
            content: 'Are you available for a quick call?',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24), // 1 day ago
            read: false,
            type: 'text'
          }
        ]
      },
      {
        id: '4',
        participantId: 'mike-wilson',
        participantName: 'Mike Wilson',
        participantAvatar: 'MW',
        lastMessage: 'Thanks for connecting!',
        lastMessageTime: new Date(now.getTime() - 1000 * 60 * 60 * 48), // 2 days ago
        unreadCount: 0,
        online: false,
        messages: [
          {
            id: 'm10',
            senderId: 'mike-wilson',
            senderName: 'Mike Wilson',
            senderAvatar: 'MW',
            content: 'Hi! Nice to meet you on CrewUp.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 50), // 50 hours ago
            read: true,
            type: 'text'
          },
          {
            id: 'm11',
            senderId: 'current-user',
            senderName: 'You',
            senderAvatar: 'ME',
            content: 'Likewise! Looking forward to working together.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 49), // 49 hours ago
            read: true,
            type: 'text'
          },
          {
            id: 'm12',
            senderId: 'mike-wilson',
            senderName: 'Mike Wilson',
            senderAvatar: 'MW',
            content: 'Thanks for connecting!',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 48), // 2 days ago
            read: true,
            type: 'text'
          }
        ]
      }
    ];

    this.conversationsSignal.set(conversations);
  }

  setActiveConversation(conversationId: string) {
    this.activeConversationSignal.set(conversationId);
    this.markConversationAsRead(conversationId);
  }

  sendMessage(conversationId: string, content: string, type: 'text' | 'image' | 'file' = 'text') {
    const conversations = this.conversationsSignal();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      const newMessage: Message = {
        id: `m${Date.now()}`,
        senderId: 'current-user',
        senderName: 'You',
        senderAvatar: 'ME',
        content: content,
        timestamp: new Date(),
        read: true,
        type: type
      };

      conversation.messages.push(newMessage);
      conversation.lastMessage = content;
      conversation.lastMessageTime = new Date();

      // Move conversation to top
      const updatedConversations = [
        conversation,
        ...conversations.filter(c => c.id !== conversationId)
      ];

      this.conversationsSignal.set(updatedConversations);
    }
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
