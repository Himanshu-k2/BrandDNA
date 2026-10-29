import client from './client';

export const factsAPI = {
  getByBrand: (brandId) => client.get(`/api/brands/${brandId}/facts`),
  create: (brandId, data) => client.post(`/api/brands/${brandId}/facts`, data),
  update: (id, data) => client.patch(`/api/facts/${id}`, data),
  delete: (id) => client.delete(`/api/facts/${id}`),
};
