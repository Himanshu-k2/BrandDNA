import client from './client';

export const reviewsAPI = {
  create: (data) => client.post('/api/reviews', data),
  getAll: (params) => client.get('/api/reviews', { params }),
  getById: (id) => client.get(`/api/reviews/${id}`),
  submit: (id) => client.post(`/api/reviews/${id}/submit`),
  approve: (id, data) => client.post(`/api/reviews/${id}/approve`, data),
  requestChanges: (id, data) => client.post(`/api/reviews/${id}/request-changes`, data),
  reject: (id, data) => client.post(`/api/reviews/${id}/reject`, data),
  createRevision: (id, data) => client.post(`/api/reviews/${id}/revisions`, data),
  getRevisions: (id) => client.get(`/api/reviews/${id}/revisions`),
  getRevisionByVersion: (id, version) => client.get(`/api/reviews/${id}/revisions/${version}`),
  getAuditTrail: (id) => client.get(`/api/reviews/${id}/audit-trail`),
};
