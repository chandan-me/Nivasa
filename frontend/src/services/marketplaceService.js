import api from './api';

export const marketplaceService = {
  // Classifieds
  createListing: async (data) => {
    const res = await api.post('/marketplace/listings', data);
    return res.data;
  },
  getListings: async (listingType = '', search = '') => {
    const res = await api.get('/marketplace/listings', {
      params: { listing_type: listingType, search }
    });
    return res.data;
  },
  updateListing: async (listingId, data) => {
    const res = await api.put(`/marketplace/listings/${listingId}`, data);
    return res.data;
  },

  // Rentals
  requestRental: async (data) => {
    const res = await api.post('/marketplace/rentals', data);
    return res.data;
  },
  getRentals: async () => {
    const res = await api.get('/marketplace/rentals');
    return res.data;
  },
  updateRentalStatus: async (rentalId, status) => {
    const res = await api.put(`/marketplace/rentals/${rentalId}`, { status });
    return res.data;
  },

  // Lost & Found
  createLostFound: async (data) => {
    const res = await api.post('/marketplace/lost-found', data);
    return res.data;
  },
  getLostFound: async (itemType = '', status = 'OPEN') => {
    const res = await api.get('/marketplace/lost-found', {
      params: { item_type: itemType, status }
    });
    return res.data;
  },
  updateLostFound: async (itemId, data) => {
    const res = await api.put(`/marketplace/lost-found/${itemId}`, data);
    return res.data;
  }
};
