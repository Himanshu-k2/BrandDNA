import client from './client';

export const brandsAPI = {
  getAll: (params) => client.get('/api/brands', { params }),
  getById: (id) => client.get(`/api/brands/${id}`),
  create: (data) => client.post('/api/brands', data),
  update: (id, data) => client.patch(`/api/brands/${id}`, data),
  archive: (id) => client.delete(`/api/brands/${id}`),

  // Assets & Claims
  addAsset: (id, data) => client.post(`/api/brands/${id}/assets`, data),
  deleteAsset: (id, assetId) => client.delete(`/api/brands/${id}/assets/${assetId}`),
  addClaim: (id, data) => client.post(`/api/brands/${id}/claims`, data),

  // Guidelines Document Upload & Extraction
  uploadDocument: (id, formData) =>
    client.post(`/api/brands/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  uploadDocumentData: (id, data) => client.post(`/api/brands/${id}/documents`, data),
  getDocuments: (id) => client.get(`/api/brands/${id}/documents`),
  getDocument: (id, docId) => client.get(`/api/brands/${id}/documents/${docId}`),
  reviewExtractedItem: (id, docId, itemId, data) =>
    client.patch(`/api/brands/${id}/documents/${docId}/items/${itemId}`, data)
};
