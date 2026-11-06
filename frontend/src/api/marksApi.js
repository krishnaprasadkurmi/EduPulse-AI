import api from './axios';

export const marksApi = {
  createMark: async (markData) => {
    const res = await api.post('/marks', markData);
    return res.data;
  },
  updateMark: async (id, markData) => {
    const res = await api.put(`/marks/${id}`, markData);
    return res.data;
  },
  getStudentMarks: async (studentId) => {
    const res = await api.get(`/marks/student/${studentId}`);
    return res.data;
  },
  getSubjectMarks: async (subjectId) => {
    const res = await api.get(`/marks/subject/${subjectId}`);
    return res.data;
  },
};
