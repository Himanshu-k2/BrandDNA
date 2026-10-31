import client from './client';

export const reviewsAPI = {
  create: (data) => client.post('/api/reviews', data),
  upload: (formData) => client.post('/api/reviews/upload', formData),
  getAll: (params) => client.get('/api/reviews', { params }),
  getById: (id) => client.get(`/api/reviews/${id}`),
  submit: (id) => client.post(`/api/reviews/${id}/submit`),
  approve: (id, data) => client.post(`/api/reviews/${id}/approve`, data),
  requestChanges: (id, data) => client.post(`/api/reviews/${id}/request-changes`, data),
  reject: (id, data) => client.post(`/api/reviews/${id}/reject`, data),
  createRevision: (id, data) => client.post(`/api/reviews/${id}/revisions`, data),
  uploadRevision: (id, formData) => client.post(`/api/reviews/${id}/revisions/upload`, formData),
  getRevisions: (id) => client.get(`/api/reviews/${id}/revisions`),
  getRevisionByVersion: (id, version) => client.get(`/api/reviews/${id}/revisions/${version}`),
  compareRevisions: (id, v1, v2) =>
    client.get(`/api/reviews/${id}/revisions/compare`, { params: { v1, v2 } }),
  getAuditTrail: (id) => client.get(`/api/reviews/${id}/audit-trail`),
};
