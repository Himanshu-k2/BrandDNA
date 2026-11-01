import client from './client';

export const commentsAPI = {
  getByReview: (reviewId: string) => client.get(`/api/reviews/${reviewId}/comments`),
  create: (reviewId: string, data: { text: string; location?: any }) => client.post(`/api/reviews/${reviewId}/comments`, data),
};

