import api from './axios';

export const subjectApi = {
  getAllSubjects: async () => {
    const res = await api.get('/subjects');
    // Ensure both formats (data or subjects) work
    const list = res.data?.data || res.data?.subjects || [];
    return { subjects: list, data: list, success: true };
  },
  getSubjectById: async (id) => {
    const res = await api.get(`/subjects/${id}`);
    return res.data;
  },
};
