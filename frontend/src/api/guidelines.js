import client from './client';

export const guidelinesAPI = {
  getByBrand: (brandId) => client.get(`/api/brands/${brandId}/guidelines`),
  create: (brandId, data) => client.post(`/api/brands/${brandId}/guidelines`, data),
  update: (id, data) => client.patch(`/api/guidelines/${id}`, data),
  delete: (id) => client.delete(`/api/guidelines/${id}`),
};
