import client from './client';

export const brandsAPI = {
  getAll: (params?: any) => client.get('/api/brands', { params }),
  getById: (id: string) => client.get(`/api/brands/${id}`),
  create: (data: any) => client.post('/api/brands', data),
  update: (id: string, data: any) => client.patch(`/api/brands/${id}`, data),
  archive: (id: string) => client.delete(`/api/brands/${id}`),

  // Assets & Claims
  addAsset: (id: string, data: any) => client.post(`/api/brands/${id}/assets`, data),
  deleteAsset: (id: string, assetId: string) => client.delete(`/api/brands/${id}/assets/${assetId}`),
  addClaim: (id: string, data: any) => client.post(`/api/brands/${id}/claims`, data),

  // Guidelines Document Upload & Extraction
  uploadDocument: (id: string, formData: FormData) =>
    client.post(`/api/brands/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadDocumentData: (id: string, data: any) => client.post(`/api/brands/${id}/documents`, data),
  getDocuments: (id: string) => client.get(`/api/brands/${id}/documents`),
  getDocument: (id: string, docId: string) => client.get(`/api/brands/${id}/documents/${docId}`),
  reviewExtractedItem: (id: string, docId: string, itemId: string, data: any) =>
    client.patch(`/api/brands/${id}/documents/${docId}/items/${itemId}`, data),
};

