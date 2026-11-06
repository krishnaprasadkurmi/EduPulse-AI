import api from './axios';

export const examApi = {
  getExams: async (params = {}) => {
    const res = await api.get('/exams', { params });
    return res.data;
  },
  getUpcomingExams: async () => {
    const res = await api.get('/exams/upcoming');
    return res.data;
  },
  getExamById: async (id) => {
    const res = await api.get(`/exams/${id}`);
    return res.data;
  },
  createExam: async (data) => {
    const res = await api.post('/exams', data);
    return res.data;
  },
  updateExam: async (id, data) => {
    const res = await api.put(`/exams/${id}`, data);
    return res.data;
  },
  deleteExam: async (id) => {
    const res = await api.delete(`/exams/${id}`);
    return res.data;
  },
};
