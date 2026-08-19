import api from './api';

export const serviceService = {
  getProviders: async (category = '') => {
    const res = await api.get('/services/providers', {
      params: { category }
    });
    return res.data;
  },
  registerProvider: async (data) => {
    const res = await api.post('/services/providers/register', data);
    return res.data;
  },
  createBooking: async (data) => {
    const res = await api.post('/services/requests', data);
    return res.data;
  },
  getRequests: async (status = '') => {
    const res = await api.get('/services/requests', {
      params: { status }
    });
    return res.data;
  },
  updateRequest: async (requestId, data) => {
    const res = await api.put(`/services/requests/${requestId}`, data);
    return res.data;
  }
};
