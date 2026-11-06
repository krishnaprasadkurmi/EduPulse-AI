import api from './axios';

export const adminApi = {
  getAnalytics: async () => {
    const res = await api.get('/admin/analytics');
    return res.data;
  },
  getRiskMonitor: async () => {
    const res = await api.get('/admin/risk');
    return res.data;
  },
  getAuditLogs: async (params) => {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },
  getSubjects: async () => {
    const res = await api.get('/subjects');
    return res.data;
  },
  getStudents: async () => {
    const res = await api.get('/students');
    return res.data;
  },
};
