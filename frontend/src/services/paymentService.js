import api from './api';

export const paymentService = {
  getPayments: async (status = '') => {
    const res = await api.get('/payments', {
      params: { status }
    });
    return res.data;
  },
  getSummary: async () => {
    const res = await api.get('/payments/summary');
    return res.data;
  },
  raiseInvoice: async (data) => {
    const res = await api.post('/payments', data);
    return res.data;
  },
  checkout: async (paymentId, status = 'SUCCESSFUL', transactionReference = '') => {
    const res = await api.post(`/payments/${paymentId}/checkout`, {
      status,
      transaction_reference: transactionReference
    });
    return res.data;
  }
};
