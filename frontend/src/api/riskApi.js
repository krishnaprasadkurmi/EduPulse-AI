import api from './axios';

export const riskApi = {
  getStudentRisk: async (studentId) => {
    const res = await api.get(`/risk/student/${studentId}`);
    return res.data;
  },
  getSubjectRisk: async (studentId, subjectId) => {
    const res = await api.get(`/risk/subject/${studentId}/${subjectId}`);
    return res.data;
  },
  recalculateRisk: async (studentId, subjectId) => {
    const res = await api.post('/risk/recalculate', { studentId, subjectId });
    return res.data;
  },
};
