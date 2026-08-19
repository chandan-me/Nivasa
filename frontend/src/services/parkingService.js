import api from './api';

export const parkingService = {
  registerVehicle: async (data) => {
    const res = await api.post('/parking/vehicles', data);
    return res.data;
  },
  getVehicles: async () => {
    const res = await api.get('/parking/vehicles');
    return res.data;
  },
  deleteVehicle: async (vehicleId) => {
    await api.delete(`/parking/vehicles/${vehicleId}`);
  },
  getSlots: async (status = '') => {
    const res = await api.get('/parking/slots', {
      params: { status }
    });
    return res.data;
  },
  assignSlot: async (slotId, data) => {
    const res = await api.put(`/parking/slots/${slotId}/assign`, data);
    return res.data;
  },
  reportViolation: async (data) => {
    const res = await api.post('/parking/violations', data);
    return res.data;
  },
  getViolations: async () => {
    const res = await api.get('/parking/violations');
    return res.data;
  }
};
