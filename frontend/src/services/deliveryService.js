import api from './api';

export const deliveryService = {
  recordDelivery: async (data) => {
    const res = await api.post('/deliveries', data);
    return res.data;
  },
  getDeliveries: async (status = '') => {
    const res = await api.get('/deliveries', {
      params: { status }
    });
    return res.data;
  },
  updateDeliveryStatus: async (deliveryId, status) => {
    const res = await api.put(`/deliveries/${deliveryId}`, { status });
    return res.data;
  }
};
