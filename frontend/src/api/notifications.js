import client from './client';

export const notificationsAPI = {
  getAll: (params) => client.get('/api/notifications', { params }),
  markAsRead: (id) => client.patch(`/api/notifications/${id}/read`),
  markAllAsRead: () => client.post('/api/notifications/read-all'),
};
