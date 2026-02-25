import { useEffect, useState, useCallback } from 'react';
import { useDiscussStore } from '../stores/discussStore';
import { Channel, Message, AIInsight, AIAction } from '../types';

export const useDiscuss = (channelId?: number) => {
  const { 
    channels, 
    currentChannel, 
    messages, 
    users,
    aiInsights,
    aiActions,
    setCurrentChannel,
    addMessage,
    updateMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    loadMessages,
    loadChannels,
    loadUsers,
    loadAIInsights,
    loadAIActions
  } = useDiscussStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadChannels();
        await loadUsers();
        if (channelId) {
          await loadMessages(channelId);
          await loadAIInsights(channelId);
          await loadAIActions(channelId);
        }
      } catch (err) {
        setError('Failed to load discuss data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [channelId, loadChannels, loadUsers, loadMessages, loadAIInsights, loadAIActions]);

  const handleSendMessage = useCallback(async (content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!currentChannel) return;
    
    setLoading(true);
    try {
      const newMessage: Omit<Message, 'id' | 'created_at' | 'updated_at'> = {
        channel_id: currentChannel.id,
        sender_id: 1, // This would come from auth context
        sender_name: 'Current User',
        content,
        type,
        reactions: [],
        is_edited: false,
        is_deleted: false
      };
      addMessage(newMessage);
    } catch (err) {
      setError('Failed to send message.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentChannel, addMessage]);

  const handleEditMessage = useCallback(async (messageId: number, content: string) => {
    setLoading(true);
    try {
      updateMessage(messageId, { content, is_edited: true });
    } catch (err) {
      setError('Failed to edit message.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [updateMessage]);

  const handleDeleteMessage = useCallback(async (messageId: number) => {
    setLoading(true);
    try {
      deleteMessage(messageId);
    } catch (err) {
      setError('Failed to delete message.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [deleteMessage]);

  const handleAddReaction = useCallback(async (messageId: number, emoji: string) => {
    try {
      addReaction(messageId, emoji);
    } catch (err) {
      setError('Failed to add reaction.');
      console.error(err);
    }
  }, [addReaction]);

  const handleRemoveReaction = useCallback(async (messageId: number, emoji: string) => {
    try {
      removeReaction(messageId, emoji);
    } catch (err) {
      setError('Failed to remove reaction.');
      console.error(err);
    }
  }, [removeReaction]);

  const handleCreateChannel = useCallback(async (name: string, description?: string, type: 'public' | 'private' = 'public') => {
    setLoading(true);
    try {
      // This would call an API to create a channel
      console.log('Creating channel:', { name, description, type });
    } catch (err) {
      setError('Failed to create channel.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleJoinChannel = useCallback(async (channelId: number) => {
    setLoading(true);
    try {
      setCurrentChannel(channelId);
      await loadMessages(channelId);
      await loadAIInsights(channelId);
      await loadAIActions(channelId);
    } catch (err) {
      setError('Failed to join channel.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [setCurrentChannel, loadMessages, loadAIInsights, loadAIActions]);

  const handleLeaveChannel = useCallback(async (channelId: number) => {
    setLoading(true);
    try {
      // This would call an API to leave the channel
      console.log('Leaving channel:', channelId);
    } catch (err) {
      setError('Failed to leave channel.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleArchiveChannel = useCallback(async (channelId: number) => {
    setLoading(true);
    try {
      // This would call an API to archive the channel
      console.log('Archiving channel:', channelId);
    } catch (err) {
      setError('Failed to archive channel.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCompleteAIAction = useCallback(async (actionId: string) => {
    setLoading(true);
    try {
      // This would call an API to complete the AI action
      console.log('Completing AI action:', actionId);
    } catch (err) {
      setError('Failed to complete AI action.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleResolveAIInsight = useCallback(async (insightId: string) => {
    setLoading(true);
    try {
      // This would call an API to resolve the AI insight
      console.log('Resolving AI insight:', insightId);
    } catch (err) {
      setError('Failed to resolve AI insight.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Data
    channels,
    currentChannel,
    messages,
    users,
    aiInsights,
    aiActions,
    loading,
    error,
    
    // Actions
    setCurrentChannel,
    sendMessage: handleSendMessage,
    editMessage: handleEditMessage,
    deleteMessage: handleDeleteMessage,
    addReaction: handleAddReaction,
    removeReaction: handleRemoveReaction,
    createChannel: handleCreateChannel,
    joinChannel: handleJoinChannel,
    leaveChannel: handleLeaveChannel,
    archiveChannel: handleArchiveChannel,
    completeAIAction: handleCompleteAIAction,
    resolveAIInsight: handleResolveAIInsight,
    
    // Computed values
    channelMessages: messages.filter(msg => msg.channel_id === channelId),
    onlineUsers: users.filter(user => user.status === 'online'),
    unreadMessages: messages.filter(msg => !msg.is_deleted && msg.created_at > new Date().toISOString()),
    pendingAIActions: aiActions.filter(action => !action.is_completed),
    unresolvedInsights: aiInsights.filter(insight => !insight.is_resolved)
  };
};




