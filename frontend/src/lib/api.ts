import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add request timestamp
    config.metadata = { startTime: new Date() }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response time
    const endTime = new Date()
    const startTime = response.config.metadata?.startTime
    if (startTime) {
      const duration = endTime.getTime() - startTime.getTime()
      console.log(`API ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)
    }

    return response
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      // Forbidden
      console.error('Access forbidden:', error.response.data)
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data)
    }

    return Promise.reject(error)
  }
)

// API endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: any) =>
    api.post('/auth/register', data),

  logout: () =>
    api.post('/auth/logout'),

  me: () =>
    api.get('/auth/me'),

  updateProfile: (data: any) =>
    api.patch('/auth/profile', data),

  refreshToken: () =>
    api.post('/auth/refresh'),

  // Passkey / WebAuthn
  getPasskeyRegistrationOptions: (partnerId: number) =>
    api.post('/auth/register-options', { partnerId }),

  verifyPasskeyRegistration: (response: any) =>
    api.post('/auth/register-verify', response),

  getPasskeyLoginOptions: (email: string) =>
    api.post('/auth/login-options', { email }),

  verifyPasskeyLogin: (response: any) =>
    api.post('/auth/login-verify', response),
}

export const modulesApi = {
  getModules: () =>
    api.get('/modules'),

  getModule: (moduleName: string) =>
    api.get(`/modules/${moduleName}`),

  getModuleData: (moduleName: string, params?: any) =>
    api.get(`/modules/${moduleName}/data`, { params }),

  createModuleData: (moduleName: string, data: any) =>
    api.post(`/modules/${moduleName}/data`, data),

  updateModuleData: (moduleName: string, id: string, data: any) =>
    api.patch(`/modules/${moduleName}/data/${id}`, data),

  deleteModuleData: (moduleName: string, id: string) =>
    api.delete(`/modules/${moduleName}/data/${id}`),
}

export const aiApi = {
  chat: (message: string, context?: any) =>
    api.post('/ai/chat', { message, context }),

  getAgents: () =>
    api.get('/ai/agents'),

  getAgentStatus: (agentName?: string) =>
    api.get(`/ai/agents/status${agentName ? `?agent=${agentName}` : ''}`),

  getAgentCapabilities: (agentName?: string) =>
    api.get(`/ai/agents/capabilities${agentName ? `?agent=${agentName}` : ''}`),
}

export const dashboardApi = {
  getStats: () =>
    api.get('/dashboard/stats'),

  getRecentActivity: () =>
    api.get('/dashboard/activity'),

  getNotifications: () =>
    api.get('/dashboard/notifications'),
}

export default api
