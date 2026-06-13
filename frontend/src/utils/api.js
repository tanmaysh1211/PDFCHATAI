// import axios from 'axios';

// const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';

// const api = axios.create({ baseURL: BASE_URL, timeout: 120000 });

// export const createSession = () => api.post('/sessions').then(r => r.data);
// // export const renameSession = (id, title) =>
// //   api.put(`/sessions/${id}/title`, { title }).then(r => r.data);

// export const renameSession = (id, title) =>
//   api.put(`/sessions/${id}/title`, { title })
//      .then(r => {
//        console.log("Rename response:", r.data);
//        return r.data;
//      });

// export const getSessions = () => api.get('/sessions').then(r => r.data);

// export const getSession = (id) => api.get(`/sessions/${id}`).then(r => r.data);

// export const deleteSession = (id) => api.delete(`/sessions/${id}`).then(r => r.data);

// export const uploadPDFs = (sessionId, files, onProgress) => {
//   const formData = new FormData();
//   files.forEach(f => formData.append('files', f));
//   return api.post(`/sessions/${sessionId}/upload`, formData, {
//     headers: { 'Content-Type': 'multipart/form-data' },
//     onUploadProgress: e => onProgress && onProgress(Math.round((e.loaded * 100) / e.total))
//   }).then(r => r.data);
// };

// export const askQuestion = (sessionId, question) =>
//   api.post(`/sessions/${sessionId}/ask`, { question }).then(r => r.data);

// export const clearMessages = (sessionId) =>
//   api.delete(`/sessions/${sessionId}/messages`).then(r => r.data);










import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
});

export const createSession = () => api.post('/sessions').then(r => r.data);

export const renameSession = (id, title) =>
  api.put(`/sessions/${id}/title`, { title }).then(r => r.data);

export const getSessions = () => api.get('/sessions').then(r => r.data);

// ✅ Timestamp busts browser cache — forces fresh fetch every time
export const getSession = (id) =>
  api.get(`/sessions/${id}`, { params: { _t: Date.now() } }).then(r => r.data);

export const deleteSession = (id) => api.delete(`/sessions/${id}`).then(r => r.data);

export const uploadPDFs = (sessionId, files, onProgress) => {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  return api.post(`/sessions/${sessionId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress && onProgress(Math.round((e.loaded * 100) / e.total))
  }).then(r => r.data);
};

export const askQuestion = (sessionId, question) =>
  api.post(`/sessions/${sessionId}/ask`, { question }).then(r => r.data);

export const clearMessages = (sessionId) =>
  api.delete(`/sessions/${sessionId}/messages`).then(r => r.data);