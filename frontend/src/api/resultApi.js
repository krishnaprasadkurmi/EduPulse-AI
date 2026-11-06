import api from './axios';

export const resultApi = {
  getMyResults: async () => {
    const res = await api.get('/results/my-results');
    return res.data;
  },
  getMyGradeHistory: async (studentId) => {
    const res = await api.get('/results/grade-history', { params: { studentId } });
    return res.data;
  },
  getMyAcademicSummary: async (studentId) => {
    const res = await api.get('/results/academic-summary', { params: { studentId } });
    return res.data;
  },
  getExamResults: async (examId) => {
    const res = await api.get(`/results/exam/${examId}`);
    return res.data;
  },
  saveResults: async (data) => {
    const res = await api.post('/results', data);
    return res.data;
  },
  getAdminAnalytics: async () => {
    const res = await api.get('/results/admin-analytics');
    return res.data;
  },
};
