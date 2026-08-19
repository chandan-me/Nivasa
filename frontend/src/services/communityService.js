import api from './api';

export const communityService = {
  getCommunities: async () => {
    const res = await api.get('/communities');
    return res.data;
  },
  getBuildings: async (communityId) => {
    const res = await api.get(`/communities/${communityId}/buildings`);
    return res.data;
  },
  getUnits: async (buildingId) => {
    const res = await api.get(`/communities/buildings/${buildingId}/units`);
    return res.data;
  },
  getDirectory: async (communityId, search = '') => {
    const res = await api.get(`/communities/${communityId}/directory`, {
      params: { search }
    });
    return res.data;
  }
};
