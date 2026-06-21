import axios from 'axios'

const ADMIN_KEY = localStorage.getItem('ryze_admin_key') || ''

const api = axios.create({
  baseURL: '/api/admin',
  headers: { 'x-admin-key': ADMIN_KEY },
})

// Update key at runtime
export function setAdminKey(key: string) {
  localStorage.setItem('ryze_admin_key', key)
  api.defaults.headers['x-admin-key'] = key
}

export function getAdminKey() {
  return localStorage.getItem('ryze_admin_key') || ''
}

// Dashboard
export const getDashboard = () => api.get('/dashboard').then(r => r.data)

// Users
export const getUsers = (params: Record<string, any>) => api.get('/users', { params }).then(r => r.data)
export const getUser = (id: string) => api.get(`/users/${id}`).then(r => r.data)
export const updateUser = (id: string, data: Record<string, any>) => api.put(`/users/${id}`, data).then(r => r.data)
export const deleteUser = (id: string) => api.delete(`/users/${id}`).then(r => r.data)
export const resetOnboarding = (id: string) => api.post(`/users/${id}/reset-onboarding`).then(r => r.data)

// Splits
export const getSplits = (params: Record<string, any>) => api.get('/splits', { params }).then(r => r.data)
export const createSplit = (data: Record<string, any>) => api.post('/splits', data).then(r => r.data)
export const deleteSplit = (id: string) => api.delete(`/splits/${id}`).then(r => r.data)
export const togglePrebuilt = (id: string) => api.patch(`/splits/${id}/toggle-prebuilt`).then(r => r.data)

// Exercises
export const getExercises = (params: Record<string, any>) => api.get('/exercises', { params }).then(r => r.data)
export const createExercise = (data: Record<string, any>) => api.post('/exercises', data).then(r => r.data)

// Exercise Requests
export const getExerciseRequests = (params: Record<string, any>) => api.get('/exercise-requests', { params }).then(r => r.data)
export const updateExerciseRequest = (id: string, data: Record<string, any>) => api.patch(`/exercise-requests/${id}`, data).then(r => r.data)

// Sessions
export const getSessions = (params: Record<string, any>) => api.get('/sessions', { params }).then(r => r.data)

// Notifications
export const sendBroadcast = (data: { title: string; body: string }) =>
  api.post('/notifications/broadcast', data).then(r => r.data)

// Onboarding Stats
export const getOnboardingStats = () => api.get('/onboarding/stats').then(r => r.data)

export default api;
