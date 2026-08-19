import api from './api';

export const maintenanceService = {
  raiseTicket: async (data) => {
    const res = await api.post('/maintenance/tickets', data);
    return res.data;
  },
  getTickets: async (status = '', priority = '', category = '') => {
    const res = await api.get('/maintenance/tickets', {
      params: { status, priority, category }
    });
    return res.data;
  },
  getTicketDetails: async (ticketId) => {
    const res = await api.get(`/maintenance/tickets/${ticketId}`);
    return res.data;
  },
  updateTicket: async (ticketId, data) => {
    const res = await api.put(`/maintenance/tickets/${ticketId}`, data);
    return res.data;
  }
};
