import client from './client';

export const adminAPI = {
  getAuditLogs: (params?: any) => client.get('/api/admin/audit-logs', { params }).catch(() => ({ data: [] })),
  getUsers: (params?: any) => client.get('/api/admin/users', { params }).catch(() => ({ data: [] })),
  updateUserRole: (id: string, role: string) => client.patch(`/api/admin/users/${id}/role`, { role }),
};
