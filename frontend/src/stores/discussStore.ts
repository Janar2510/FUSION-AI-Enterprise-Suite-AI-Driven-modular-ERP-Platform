import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface Message {
  id: number;
  channel_id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'video' | 'audio' | 'code' | 'ai_summary' | 'system';
  attachments?: any[];
  mentions?: number[];
  reactions?: Record<string, number[]>;
  sentiment_score?: number;
  summary?: string;
  key_points?: string[];
  action_items?: Array<{
    text: string;
    assignee?: string;
    deadline?: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  created_at: string;
  edited_at?: string;
  edited?: boolean;
}

interface Channel {
  id: number;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct' | 'ai_assisted';
  ai_assistant_enabled: boolean;
  ai_personality?: string;
  unread_count: number;
  members: Array<{
    id: number;
    name: string;
    avatar?: string;
    role: 'admin' | 'member' | 'bot';
    status: 'online' | 'away' | 'offline';
  }>;
  created_at: string;
}

interface DiscussState {
  // State
  channels: Channel[];
  currentChannel: Channel | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setChannels: (channels: Channel[]) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: number, updates: Partial<Message>) => void;
  deleteMessage: (id: number) => void;
  sendMessage: (message: Omit<Message, 'id' | 'created_at'>) => Promise<void>;
  addReaction: (messageId: number, emoji: string) => void;
  removeReaction: (messageId: number, emoji: string) => void;
  markAsRead: (channelId: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // AI Features
  generateSummary: (channelId: number) => Promise<string>;
  getSuggestions: (message: string) => Promise<string[]>;
  analyzeSentiment: (message: string) => Promise<number>;
}

export const useDiscussStore = create<DiscussState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    channels: [],
    currentChannel: null,
    messages: [],
    isLoading: false,
    error: null,

    // Basic actions
    setChannels: (channels) => set({ channels }),
    
    setCurrentChannel: (channel) => {
      set({ currentChannel: channel });
      if (channel) {
        // Load messages for the channel
        get().loadMessages(channel.id);
        // Mark as read
        get().markAsRead(channel.id);
      }
    },
    
    setMessages: (messages) => set({ messages }),
    
    addMessage: (message) => set((state) => ({
      messages: [...state.messages, message]
    })),
    
    updateMessage: (id, updates) => set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === id ? { ...msg, ...updates } : msg
      )
    })),
    
    deleteMessage: (id) => set((state) => ({
      messages: state.messages.filter(msg => msg.id !== id)
    })),

    // Send message
    sendMessage: async (messageData) => {
      const { currentChannel } = get();
      if (!currentChannel) return;

      set({ isLoading: true, error: null });

      try {
        const response = await fetch('/api/v1/discuss/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...messageData,
            channel_id: currentChannel.id,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const message = await response.json();
        get().addMessage(message);
        
        // Update channel unread count
        set((state) => ({
          channels: state.channels.map(channel =>
            channel.id === currentChannel.id
              ? { ...channel, unread_count: 0 }
              : channel
          )
        }));

      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Unknown error' });
      } finally {
        set({ isLoading: false });
      }
    },

    // Reactions
    addReaction: (messageId, emoji) => {
      set((state) => ({
        messages: state.messages.map(msg => {
          if (msg.id === messageId) {
            const reactions = { ...msg.reactions };
            if (reactions[emoji]) {
              reactions[emoji] = [...reactions[emoji], 1]; // Add current user ID
            } else {
              reactions[emoji] = [1];
            }
            return { ...msg, reactions };
          }
          return msg;
        })
      }));
    },

    removeReaction: (messageId, emoji) => {
      set((state) => ({
        messages: state.messages.map(msg => {
          if (msg.id === messageId) {
            const reactions = { ...msg.reactions };
            if (reactions[emoji]) {
              reactions[emoji] = reactions[emoji].filter(id => id !== 1);
              if (reactions[emoji].length === 0) {
                delete reactions[emoji];
              }
            }
            return { ...msg, reactions };
          }
          return msg;
        })
      }));
    },

    // Mark as read
    markAsRead: (channelId) => {
      set((state) => ({
        channels: state.channels.map(channel =>
          channel.id === channelId
            ? { ...channel, unread_count: 0 }
            : channel
        )
      }));
    },

    // Loading and error states
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    // AI Features
    generateSummary: async (channelId) => {
      try {
        const response = await fetch(`/api/v1/discuss/channels/${channelId}/summary`);
        const data = await response.json();
        return data.summary;
      } catch (error) {
        console.error('Failed to generate summary:', error);
        return 'Failed to generate summary';
      }
    },

    getSuggestions: async (message) => {
      try {
        const response = await fetch('/api/v1/discuss/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        });
        const data = await response.json();
        return data.suggestions;
      } catch (error) {
        console.error('Failed to get suggestions:', error);
        return [];
      }
    },

    analyzeSentiment: async (message) => {
      try {
        const response = await fetch('/api/v1/discuss/sentiment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        });
        const data = await response.json();
        return data.sentiment_score;
      } catch (error) {
        console.error('Failed to analyze sentiment:', error);
        return 0;
      }
    },

    // Load messages for a channel
    loadMessages: async (channelId) => {
      set({ isLoading: true });
      try {
        const response = await fetch(`/api/v1/discuss/channels/${channelId}/messages`);
        const messages = await response.json();
        set({ messages, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to load messages', isLoading: false });
      }
    },
  }))
);

// Initialize with sample data
useDiscussStore.setState({
  channels: [
    {
      id: 1,
      name: 'general',
      description: 'General discussion',
      type: 'public',
      ai_assistant_enabled: true,
      ai_personality: 'professional',
      unread_count: 3,
      members: [
        { id: 1, name: 'John Doe', role: 'admin', status: 'online' },
        { id: 2, name: 'Jane Smith', role: 'member', status: 'online' },
        { id: 3, name: 'AI Assistant', role: 'bot', status: 'online' },
      ],
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'project-alpha',
      description: 'Project Alpha discussions',
      type: 'private',
      ai_assistant_enabled: true,
      ai_personality: 'technical',
      unread_count: 0,
      members: [
        { id: 1, name: 'John Doe', role: 'admin', status: 'online' },
        { id: 2, name: 'Jane Smith', role: 'member', status: 'online' },
      ],
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
  messages: [
    {
      id: 1,
      channel_id: 1,
      sender_id: 1,
      sender_name: 'John Doe',
      content: 'Hey team! How is everyone doing today?',
      type: 'text',
      sentiment_score: 0.8,
      created_at: '2024-01-01T10:00:00Z',
    },
    {
      id: 2,
      channel_id: 1,
      sender_id: 2,
      sender_name: 'Jane Smith',
      content: 'Great! Just finished the design mockups. Should I share them?',
      type: 'text',
      sentiment_score: 0.9,
      action_items: [
        { text: 'Share design mockups', priority: 'high' as const }
      ],
      created_at: '2024-01-01T10:05:00Z',
    },
    {
      id: 3,
      channel_id: 1,
      sender_id: 3,
      sender_name: 'AI Assistant',
      content: 'I can help analyze the mockups and provide feedback on design consistency.',
      type: 'ai_summary',
      summary: 'AI Assistant offers to analyze design mockups for consistency',
      created_at: '2024-01-01T10:06:00Z',
    },
  ],
});




