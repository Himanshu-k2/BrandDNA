import client from './client';

export const authAPI = {
  register: (data) => client.post('/api/auth/register', data),
  login: (data) => client.post('/api/auth/login', data),
  getMe: () => client.get('/api/auth/me'),
};
