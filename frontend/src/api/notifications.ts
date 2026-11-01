import client from './client';

export const notificationsAPI = {
  getAll: (params?: any) => client.get('/api/notifications', { params }),
  markAsRead: (id: string) => client.patch(`/api/notifications/${id}/read`),
  markAllAsRead: () => client.post('/api/notifications/read-all'),
};

