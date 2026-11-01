import client from './client';

export const reviewsAPI = {
  create: (data: any) => client.post('/api/reviews', data),
  upload: (formData: FormData) => client.post('/api/reviews/upload', formData),
  getAll: (params?: any) => client.get('/api/reviews', { params }),
  getById: (id: string) => client.get(`/api/reviews/${id}`),
  submit: (id: string) => client.post(`/api/reviews/${id}/submit`),
  approve: (id: string, data?: any) => client.post(`/api/reviews/${id}/approve`, data),
  requestChanges: (id: string, data?: any) => client.post(`/api/reviews/${id}/request-changes`, data),
  reject: (id: string, data?: any) => client.post(`/api/reviews/${id}/reject`, data),
  createRevision: (id: string, data: any) => client.post(`/api/reviews/${id}/revisions`, data),
  uploadRevision: (id: string, formData: FormData) => client.post(`/api/reviews/${id}/revisions/upload`, formData),
  getRevisions: (id: string) => client.get(`/api/reviews/${id}/revisions`),
  getRevisionByVersion: (id: string, version: number) => client.get(`/api/reviews/${id}/revisions/${version}`),
  compareRevisions: (id: string, v1: number | string, v2: number | string) =>
    client.get(`/api/reviews/${id}/revisions/compare`, { params: { v1, v2 } }),
  getAuditTrail: (id: string) => client.get(`/api/reviews/${id}/audit-trail`),
};

