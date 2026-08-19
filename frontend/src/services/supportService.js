import api from './api';

export const supportService = {
  // Support Tickets
  createTicket: async (data) => {
    const res = await api.post('/support/tickets', data);
    return res.data;
  },
  getTickets: async (status = '') => {
    const res = await api.get('/support/tickets', {
      params: { status }
    });
    return res.data;
  },
  getTicketDetails: async (ticketId) => {
    const res = await api.get(`/support/tickets/${ticketId}`);
    return res.data;
  },
  updateTicket: async (ticketId, data) => {
    const res = await api.put(`/support/tickets/${ticketId}`, data);
    return res.data;
  },
  sendTicketReply: async (ticketId, message, fileUrl = '') => {
    const res = await api.post(`/support/tickets/${ticketId}/messages`, {
      message,
      file_url: fileUrl
    });
    return res.data;
  },

  // Moderation
  fileReport: async (data) => {
    const res = await api.post('/reports', data);
    return res.data;
  },
  getReports: async (status = '') => {
    const res = await api.get('/reports', {
      params: { status }
    });
    return res.data;
  },
  resolveReport: async (reportId, status, details = '') => {
    const res = await api.put(`/reports/${reportId}/resolve`, { status, details });
    return res.data;
  }
};
