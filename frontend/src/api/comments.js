import client from './client';

export const commentsAPI = {
  getByReview: (reviewId) => client.get(`/api/reviews/${reviewId}/comments`),
  create: (reviewId, data) => client.post(`/api/reviews/${reviewId}/comments`, data),
};
