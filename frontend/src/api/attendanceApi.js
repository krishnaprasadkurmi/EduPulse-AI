import api from './axios';

export const attendanceApi = {
  recordAttendance: async (data) => {
    const res = await api.post('/attendance', data);
    return res.data;
  },
  getStudentAttendance: async (studentId) => {
    const res = await api.get(`/attendance/student/${studentId}`);
    return res.data;
  },
  getSubjectAttendance: async (subjectId, date) => {
    const params = date ? { date } : {};
    const res = await api.get(`/attendance/subject/${subjectId}`, { params });
    return res.data;
  },
  getPrediction: async (studentId, subjectId, simulateAttend = 0, simulateMiss = 0) => {
    const res = await api.get(`/attendance/prediction/${studentId}/${subjectId}`, {
      params: { simulateAttend, simulateMiss },
    });
    return res.data;
  },
};
