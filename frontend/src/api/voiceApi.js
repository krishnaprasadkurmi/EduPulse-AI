import api from './axios';

export const voiceApi = {
  parseVoiceInput: async (data) => {
    const res = await api.post('/voice/parse', data);
    return res.data;
  },
  confirmVoiceMarks: async (data) => {
    const res = await api.post('/voice/confirm', data);
    return res.data;
  },
  getSampleTranscripts: async () => {
    const res = await api.post('/voice/transcribe');
    return res.data;
  },
};
