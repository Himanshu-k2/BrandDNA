import client from './client';

export const terminologyAPI = {
  getByBrand: (brandId) => client.get(`/api/brands/${brandId}/terminology`),
  create: (brandId, data) => client.post(`/api/brands/${brandId}/terminology`, data),
  update: (id, data) => client.patch(`/api/terminology/${id}`, data),
  delete: (id) => client.delete(`/api/terminology/${id}`),
};
