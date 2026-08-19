import api from './api';

export const interactionsService = {
  // Announcements
  createAnnouncement: async (data) => {
    const res = await api.post('/announcements', data);
    return res.data;
  },
  getAnnouncements: async () => {
    const res = await api.get('/announcements');
    return res.data;
  },

  // Polls
  createPoll: async (data) => {
    const res = await api.post('/polls', data);
    return res.data;
  },
  getPolls: async () => {
    const res = await api.get('/polls');
    return res.data;
  },
  votePoll: async (pollId, optionId) => {
    const res = await api.post(`/polls/${pollId}/vote`, { option_id: optionId });
    return res.data;
  },

  // Events
  createEvent: async (data) => {
    const res = await api.post('/events', data);
    return res.data;
  },
  getEvents: async () => {
    const res = await api.get('/events');
    return res.data;
  },
  rsvpEvent: async (eventId, status) => {
    const res = await api.post(`/events/${eventId}/rsvp`, { status });
    return res.data;
  },

  // Documents
  uploadDocument: async (data) => {
    const res = await api.post('/documents', data);
    return res.data;
  },
  getDocuments: async (category = '') => {
    const res = await api.get('/documents', {
      params: { category }
    });
    return res.data;
  }
};
