import client from './client';

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  role?: string;
}

export const authAPI = {
  register: (data: RegisterPayload) => client.post('/api/auth/register', data),
  login: (data: LoginPayload) => client.post('/api/auth/login', data),
  getMe: () => client.get('/api/auth/me'),
};
