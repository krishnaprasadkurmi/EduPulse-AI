import api from './axios';

export const resourceApi = {
  getResources: async (params = {}) => {
    const res = await api.get('/resources', { params });
    return res.data;
  },
  getResourceById: async (id) => {
    const res = await api.get(`/resources/${id}`);
    return res.data;
  },
  getResourcesBySubject: async (subjectId) => {
    const res = await api.get(`/resources/subject/${subjectId}`);
    return res.data;
  },
  createResource: async (data) => {
    const res = await api.post('/resources', data);
    return res.data;
  },
  updateResource: async (id, data) => {
    const res = await api.put(`/resources/${id}`, data);
    return res.data;
  },
  deleteResource: async (id) => {
    const res = await api.delete(`/resources/${id}`);
    return res.data;
  },
  getResourceStats: async () => {
    const res = await api.get('/resources/stats');
    return res.data;
  },
};
