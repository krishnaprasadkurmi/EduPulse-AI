import api from './axios';

export const authApi = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  updateProfile: async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    return res.data;
  },
  sendTestAlert: async () => {
    const res = await api.post('/auth/test-alert');
    return res.data;
  },
  triggerCronCheck: async () => {
    const res = await api.post('/notifications/run-cron');
    return res.data;
  },
  testWhatsAppGateway: async (payload) => {
    const res = await api.post('/auth/test-whatsapp', payload);
    return res.data;
  },
  testEmailGateway: async (payload) => {
    const res = await api.post('/auth/test-email', payload);
    return res.data;
  },
};
