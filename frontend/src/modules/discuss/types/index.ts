export interface Channel {
  id: number;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
}

export interface Message {
  id: number;
  channel_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  created_at: string;
  updated_at?: string;
  reply_to?: number;
  reactions: Reaction[];
  is_edited: boolean;
  is_deleted: boolean;
}

export interface Reaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
}

export interface AIInsight {
  id: string;
  channel_id: number;
  type: 'summary' | 'action_item' | 'decision' | 'question' | 'suggestion';
  content: string;
  confidence: number;
  created_at: string;
  is_resolved: boolean;
}

export interface AIAction {
  id: string;
  channel_id: number;
  type: 'create_task' | 'schedule_meeting' | 'send_email' | 'update_document' | 'create_reminder';
  title: string;
  description: string;
  parameters: Record<string, any>;
  created_at: string;
  is_completed: boolean;
  completed_at?: string;
}




