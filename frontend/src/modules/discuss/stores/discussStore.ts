import { create } from 'zustand';
import { Channel, Message, User, AIInsight, AIAction } from '../types';

interface DiscussState {
  channels: Channel[];
  currentChannel: Channel | null;
  messages: Message[];
  users: User[];
  aiInsights: AIInsight[];
  aiActions: AIAction[];
  
  // Actions
  setCurrentChannel: (channelId: number | null) => void;
  addMessage: (message: Omit<Message, 'id' | 'created_at' | 'updated_at'>) => void;
  updateMessage: (messageId: number, updates: Partial<Message>) => void;
  deleteMessage: (messageId: number) => void;
  addReaction: (messageId: number, emoji: string) => void;
  removeReaction: (messageId: number, emoji: string) => void;
  loadMessages: (channelId: number) => Promise<void>;
  loadChannels: () => Promise<void>;
  loadUsers: () => Promise<void>;
  loadAIInsights: (channelId: number) => Promise<void>;
  loadAIActions: (channelId: number) => Promise<void>;
  clearMessages: () => void;
}

export const useDiscussStore = create<DiscussState>((set, get) => ({
  channels: [
    // Sample data
    {
      id: 1,
      name: 'general',
      description: 'General discussion channel',
      type: 'public',
      is_archived: false,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      created_by: 1
    },
    {
      id: 2,
      name: 'development',
      description: 'Development team discussions',
      type: 'public',
      is_archived: false,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      created_by: 1
    },
    {
      id: 3,
      name: 'ai-assistant',
      description: 'AI Assistant discussions',
      type: 'private',
      is_archived: false,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      created_by: 1
    }
  ],
  currentChannel: null,
  messages: [
    // Sample messages
    {
      id: 1,
      channel_id: 1,
      sender_id: 1,
      sender_name: 'John Doe',
      content: 'Welcome to the general channel!',
      type: 'text',
      created_at: '2024-01-15T10:00:00Z',
      reactions: [],
      is_edited: false,
      is_deleted: false
    },
    {
      id: 2,
      channel_id: 1,
      sender_id: 2,
      sender_name: 'Jane Smith',
      content: 'Thanks for the welcome!',
      type: 'text',
      created_at: '2024-01-15T10:05:00Z',
      reactions: [
        {
          id: 1,
          message_id: 2,
          user_id: 1,
          emoji: '👍',
          created_at: '2024-01-15T10:06:00Z'
        }
      ],
      is_edited: false,
      is_deleted: false
    }
  ],
  users: [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      status: 'online',
      last_seen: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      status: 'away',
      last_seen: '2024-01-15T09:30:00Z'
    }
  ],
  aiInsights: [],
  aiActions: [],

  setCurrentChannel: (channelId) => {
    const channel = channelId ? get().channels.find(c => c.id === channelId) : null;
    set({ currentChannel: channel });
  },

  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    set((state) => ({ messages: [...state.messages, newMessage] }));
  },

  updateMessage: (messageId, updates) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId
          ? { ...message, ...updates, updated_at: new Date().toISOString() }
          : message
      )
    }));
  },

  deleteMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId
          ? { ...message, is_deleted: true, updated_at: new Date().toISOString() }
          : message
      )
    }));
  },

  addReaction: (messageId, emoji) => {
    const newReaction = {
      id: Date.now(),
      message_id: messageId,
      user_id: 1, // This would come from auth context
      emoji,
      created_at: new Date().toISOString()
    };
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId
          ? { ...message, reactions: [...message.reactions, newReaction] }
          : message
      )
    }));
  },

  removeReaction: (messageId, emoji) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              reactions: message.reactions.filter(
                (reaction) => !(reaction.emoji === emoji && reaction.user_id === 1)
              )
            }
          : message
      )
    }));
  },

  loadMessages: async (channelId) => {
    // This would call an API to load messages
    console.log('Loading messages for channel:', channelId);
  },

  loadChannels: async () => {
    // This would call an API to load channels
    console.log('Loading channels');
  },

  loadUsers: async () => {
    // This would call an API to load users
    console.log('Loading users');
  },

  loadAIInsights: async (channelId) => {
    // This would call an API to load AI insights
    console.log('Loading AI insights for channel:', channelId);
  },

  loadAIActions: async (channelId) => {
    // This would call an API to load AI actions
    console.log('Loading AI actions for channel:', channelId);
  },

  clearMessages: () => {
    set({ messages: [] });
  }
}));




