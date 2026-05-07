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

// API endpoints — all paths are relative to VITE_API_URL base (proxied through Vite → localhost:3001)
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),

  register: (data: any) =>
    api.post('/api/auth/register', data),

  logout: () =>
    api.post('/api/auth/logout'),

  me: () =>
    api.get('/api/auth/me'),

  updateProfile: (data: any) =>
    api.patch('/api/auth/profile', data),

  refreshToken: () =>
    api.post('/api/auth/refresh'),

  // Passkey / WebAuthn (Phase 2 optional — not yet implemented)
  getPasskeyRegistrationOptions: (partnerId: number) =>
    api.post('/api/auth/register-options', { partnerId }),

  verifyPasskeyRegistration: (response: any) =>
    api.post('/api/auth/register-verify', response),

  getPasskeyLoginOptions: (email: string) =>
    api.post('/api/auth/login-options', { email }),

  verifyPasskeyLogin: (response: any) =>
    api.post('/api/auth/login-verify', response),
}

// ── Generic module API (legacy, kept for backwards compat) ──────────────────
export const modulesApi = {
  getModules: () =>
    api.get('/api/modules'),

  getModule: (moduleName: string) =>
    api.get(`/api/modules/${moduleName}`),

  getModuleData: (moduleName: string, params?: any) =>
    api.get(`/api/modules/${moduleName}/data`, { params }),

  createModuleData: (moduleName: string, data: any) =>
    api.post(`/api/modules/${moduleName}/data`, data),

  updateModuleData: (moduleName: string, id: string, data: any) =>
    api.patch(`/api/modules/${moduleName}/data/${id}`, data),

  deleteModuleData: (moduleName: string, id: string) =>
    api.delete(`/api/modules/${moduleName}/data/${id}`),
}

// ── AI ───────────────────────────────────────────────────────────────────────
export const aiApi = {
  chat: (message: string, context?: any) =>
    api.post('/api/ai/chat', { message, context }),

  getAgents: () =>
    api.get('/api/ai/agents'),

  getAgentStatus: (agentName?: string) =>
    api.get(`/api/ai/agents/status${agentName ? `?agent=${agentName}` : ''}`),

  getAgentCapabilities: (agentName?: string) =>
    api.get(`/api/ai/agents/capabilities${agentName ? `?agent=${agentName}` : ''}`),
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () =>
    api.get('/api/dashboard/stats'),

  getRecentActivity: () =>
    api.get('/api/dashboard/activity'),

  getNotifications: () =>
    api.get('/api/dashboard/notifications'),
}

// ── Partners ─────────────────────────────────────────────────────────────────
export const partnersApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/partners', { params }),

  get: (id: string) =>
    api.get(`/api/partners/${id}`),

  profile: (id: string) =>
    api.get(`/api/partners/${id}/profile`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/partners', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/api/partners/${id}`, data),

  archive: (id: string) =>
    api.delete(`/api/partners/${id}`),
}

// ── Products ─────────────────────────────────────────────────────────────────
export const productsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/products', { params }),

  get: (id: number) =>
    api.get(`/api/products/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/products', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/api/products/${id}`, data),

  archive: (id: number) =>
    api.delete(`/api/products/${id}`),
}

// ── CRM ──────────────────────────────────────────────────────────────────────
export const crmApi = {
  // Leads / Opportunities
  list: (params?: Record<string, unknown>) =>
    api.get('/api/crm/leads', { params }),

  get: (id: number) =>
    api.get(`/api/crm/leads/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/crm/leads', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/crm/leads/${id}`, data),

  moveStage: (id: number, stageId: number) =>
    api.patch(`/api/crm/leads/${id}/stage`, { stageId }),

  delete: (id: number) =>
    api.delete(`/api/crm/leads/${id}`),

  pipeline: () =>
    api.get('/api/crm/pipeline'),

  // Flow actions (Phase 3 flows A)
  qualify: (id: number) =>
    api.post(`/api/crm/leads/${id}/qualify`),

  markWon: (id: number) =>
    api.post(`/api/crm/leads/${id}/mark-won`),

  newQuotation: (id: number) =>
    api.post(`/api/crm/leads/${id}/new-quotation`),

  convert: (id: number) =>
    api.post(`/api/crm/leads/${id}/convert`),

  // Stages
  stages: () =>
    api.get('/api/crm/stages'),
}

// ── Sales ────────────────────────────────────────────────────────────────────
export const salesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/sales', { params }),

  get: (id: number) =>
    api.get(`/api/sales/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/sales', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/sales/${id}`, data),

  // Flow actions (Phase 3 flows B/C)
  confirm: (id: number) =>
    api.post(`/api/sales/${id}/confirm`),

  invoice: (id: number) =>
    api.post(`/api/sales/${id}/invoice`),

  cancel: (id: number) =>
    api.post(`/api/sales/${id}/cancel`),
}

// ── Accounting ───────────────────────────────────────────────────────────────
export const accountingApi = {
  // Journal moves
  listMoves: (params?: Record<string, unknown>) =>
    api.get('/api/accounting/moves', { params }),

  getMove: (id: number) =>
    api.get(`/api/accounting/moves/${id}`),

  createMove: (data: Record<string, unknown>) =>
    api.post('/api/accounting/moves', data),

  // Flow actions
  postMove: (id: number) =>
    api.post(`/api/accounting/moves/${id}/post`),

  payMove: (id: number, data?: Record<string, unknown>) =>
    api.post(`/api/accounting/moves/${id}/pay`, data),

  reconcileMove: (id: number) =>
    api.post(`/api/accounting/moves/${id}/reconcile`),

  // Journals
  listJournals: () =>
    api.get('/api/accounting/journals'),
}

// ── Inventory ────────────────────────────────────────────────────────────────
export const inventoryApi = {
  // Pickings
  listPickings: (params?: Record<string, unknown>) =>
    api.get('/api/inventory/pickings', { params }),

  getPicking: (id: number) =>
    api.get(`/api/inventory/pickings/${id}`),

  // Flow actions
  markReady: (id: number) =>
    api.post(`/api/inventory/pickings/${id}/ready`),

  validate: (id: number) =>
    api.post(`/api/inventory/pickings/${id}/validate`),

  // Stock
  listLocations: () =>
    api.get('/api/inventory/locations'),

  listMoves: (params?: Record<string, unknown>) =>
    api.get('/api/inventory/moves', { params }),
}

// ── Purchases ────────────────────────────────────────────────────────────────
export const purchasesApi = {
  // RFQs / POs
  list: (params?: Record<string, unknown>) =>
    api.get('/api/purchase', { params }),

  get: (id: number) =>
    api.get(`/api/purchase/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/purchase', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/api/purchase/${id}`, data),

  // Flow actions
  confirm: (id: number) =>
    api.post(`/api/purchase/${id}/confirm`),

  validateReceipt: (id: number) =>
    api.post(`/api/purchase/${id}/validate-receipt`),

  createBill: (id: number) =>
    api.post(`/api/purchase/${id}/bill`),

  cancel: (id: number) =>
    api.post(`/api/purchase/${id}/cancel`),
}

// ── Helpdesk ─────────────────────────────────────────────────────────────────
export const helpdeskApi = {
  // Tickets
  list: (params?: Record<string, unknown>) =>
    api.get('/api/helpdesk', { params }),

  get: (id: number) =>
    api.get(`/api/helpdesk/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/helpdesk', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/api/helpdesk/${id}`, data),

  // Flow actions
  createTask: (id: number) =>
    api.post(`/api/helpdesk/${id}/create-task`),

  addTimesheet: (id: number, data: { taskId: number; hours: number; description?: string }) =>
    api.post(`/api/helpdesk/${id}/timesheet`, data),

  resolve: (id: number) =>
    api.post(`/api/helpdesk/${id}/resolve`),

  // Stages
  stages: () =>
    api.get('/api/helpdesk/stages'),
}

// ── Projects ─────────────────────────────────────────────────────────────────
export const projectsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/projects', { params }),

  get: (id: number) =>
    api.get(`/api/projects/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/projects', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/api/projects/${id}`, data),

  // Tasks
  listTasks: (projectId: number, params?: Record<string, unknown>) =>
    api.get(`/api/projects/${projectId}/tasks`, { params }),

  createTask: (projectId: number, data: Record<string, unknown>) =>
    api.post(`/api/projects/${projectId}/tasks`, data),

  updateTask: (taskId: number, data: Record<string, unknown>) =>
    api.patch(`/api/projects/tasks/${taskId}`, data),

  // Timesheets
  addTimesheet: (taskId: number, data: { hours: number; description?: string }) =>
    api.post(`/api/projects/tasks/${taskId}/timesheets`, data),

  stages: () =>
    api.get('/api/projects/stages'),
}

export default api
