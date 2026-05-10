import { create } from 'zustand';
import { Channel, Message, User, AIInsight, AIAction } from '../types';
import { discussApi, aiActionsApi } from '@/lib/api';

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
  sendMessage: (channelId: number, content: string) => Promise<void>;
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

function mapChannel(ch: Record<string, unknown>): Channel {
  return {
    id: ch.id as number,
    name: ch.name as string,
    description: ch.description as string | undefined,
    type: ch.channelType === 'direct'
      ? 'direct'
      : ch.channelType === 'private'
        ? 'private'
        : 'public',
    is_archived: !(ch.active as boolean ?? true),
    created_at: (ch.createdAt as string) ?? new Date().toISOString(),
    updated_at: (ch.updatedAt as string) ?? new Date().toISOString(),
    created_by: 0,
  };
}

function mapMessage(m: Record<string, unknown>, channelId: number): Message {
  return {
    id: m.id as number,
    channel_id: (m.channelId as number) ?? channelId,
    sender_id: 0,
    sender_name: (m.authorName as string) ?? 'Unknown',
    content: (m.body as string) ?? '',
    type: 'text',
    created_at: (m.date as string) ?? (m.createdAt as string) ?? new Date().toISOString(),
    reactions: [],
    is_edited: false,
    is_deleted: false,
  };
}

export const useDiscussStore = create<DiscussState>((set, get) => ({
  channels: [],
  currentChannel: null,
  messages: [],
  users: [],
  aiInsights: [],
  aiActions: [],

  setCurrentChannel: (channelId) => {
    const channel = channelId ? get().channels.find(c => c.id === channelId) ?? null : null;
    set({ currentChannel: channel });
  },

  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, newMessage] }));
  },

  sendMessage: async (channelId, content) => {
    // Optimistic add
    get().addMessage({
      channel_id: channelId,
      sender_id: 0,
      sender_name: 'You',
      content,
      type: 'text',
      reactions: [],
      is_edited: false,
      is_deleted: false,
    });
    try {
      await discussApi.postMessage(channelId, content);
    } catch {
      // Leave optimistic message in place; a toast could be shown by the caller
    }
  },

  updateMessage: (messageId, updates) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, ...updates, updated_at: new Date().toISOString() }
          : msg
      ),
    }));
  },

  deleteMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, is_deleted: true, updated_at: new Date().toISOString() }
          : msg
      ),
    }));
  },

  addReaction: (messageId, emoji) => {
    const newReaction = {
      id: Date.now(),
      message_id: messageId,
      user_id: 0,
      emoji,
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, reactions: [...msg.reactions, newReaction] }
          : msg
      ),
    }));
    // Persist to API — find channelId from current message
    const msg = get().messages.find(m => m.id === messageId);
    if (msg?.channel_id) {
      discussApi.addReaction(msg.channel_id, messageId, emoji).catch(() => { /* optimistic — ignore */ });
    }
  },

  removeReaction: (messageId, emoji) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: msg.reactions.filter(
                (r) => !(r.emoji === emoji && r.user_id === 0)
              ),
            }
          : msg
      ),
    }));
    const msg = get().messages.find(m => m.id === messageId);
    if (msg?.channel_id) {
      discussApi.removeReaction(msg.channel_id, messageId, emoji).catch(() => { /* optimistic — ignore */ });
    }
  },

  loadMessages: async (channelId) => {
    try {
      const res = await discussApi.getMessages(channelId);
      const raw: Record<string, unknown>[] = res.data?.data ?? res.data ?? [];
      set({ messages: raw.map((m) => mapMessage(m, channelId)) });
    } catch {
      // Keep existing messages on error
    }
  },

  loadChannels: async () => {
    try {
      const res = await discussApi.listChannels();
      const raw: Record<string, unknown>[] = Array.isArray(res.data) ? res.data : [];
      set({ channels: raw.map(mapChannel) });
    } catch {
      // Keep existing channels on error
    }
  },

  loadUsers: async () => {
    // Users come from messages/channels — no dedicated endpoint yet
  },

  loadAIInsights: async (_channelId) => {
    // Surfaced via aiActionsApi.pending in AIAssistantPanel
  },

  loadAIActions: async (channelId) => {
    try {
      const res = await aiActionsApi.pending('MailChannel', String(channelId));
      set({ aiActions: res.data?.data ?? [] });
    } catch {
      // Silently ignore if AI layer not yet deployed
    }
  },

  clearMessages: () => {
    set({ messages: [] });
  },
}));
