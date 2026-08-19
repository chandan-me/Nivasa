import api from './api';

export const adminService = {
  // KPIs
  getDashboardKpis: async () => {
    const res = await api.get('/admin/dashboard/kpis');
    return res.data;
  },
  
  // Charts
  getAnalyticsCharts: async (rangeType = 'weekly') => {
    const res = await api.get('/admin/analytics/charts', {
      params: { range_type: rangeType }
    });
    return res.data;
  },

  // Residents List
  getResidents: async () => {
    const res = await api.get('/admin/residents');
    return res.data;
  },
  verifyResident: async (userId) => {
    const res = await api.put(`/admin/residents/${userId}/verify`);
    return res.data;
  },
  deactivateResident: async (userId) => {
    const res = await api.put(`/admin/residents/${userId}/deactivate`);
    return res.data;
  },

  // Vendors List
  getVendors: async () => {
    const res = await api.get('/admin/vendors');
    return res.data;
  },
  verifyVendor: async (vendorId) => {
    const res = await api.put(`/admin/vendors/${vendorId}/verify`);
    return res.data;
  },
  suspendVendor: async (vendorId) => {
    const res = await api.put(`/admin/vendors/${vendorId}/suspend`);
    return res.data;
  }
};
