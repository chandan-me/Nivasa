import api from './api';

export const visitorService = {
  createVisitor: async (data) => {
    const res = await api.post('/visitors', data);
    return res.data;
  },
  getVisitors: async (search = '', status = '') => {
    const res = await api.get('/visitors', {
      params: { search, status }
    });
    return res.data;
  },
  updateVisitorStatus: async (visitorId, status) => {
    const res = await api.put(`/visitors/${visitorId}`, { status });
    return res.data;
  }
};
