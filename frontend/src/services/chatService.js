import api from './api';

export const chatService = {
  getConversations: async () => {
    const res = await api.get('/chat/conversations');
    return res.data;
  },
  startConversation: async (recipientId) => {
    const res = await api.post(`/chat/conversations?recipient_id=${recipientId}`);
    return res.data;
  },
  sendMessage: async (conversationId, content) => {
    const res = await api.post(`/chat/conversations/${conversationId}/messages`, { content });
    return res.data;
  },
  getMessages: async (conversationId) => {
    const res = await api.get(`/chat/conversations/${conversationId}/messages`);
    return res.data;
  }
};
