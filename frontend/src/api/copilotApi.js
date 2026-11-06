import api from './axios';

export const copilotApi = {
  chat: async (message, conversationId = null) => {
    const res = await api.post('/copilot/chat', { message, conversationId });
    return res.data;
  },

  confirmAction: async (actionId, confirmed = true) => {
    const res = await api.post('/copilot/confirm', { actionId, confirmed });
    return res.data;
  },
};
