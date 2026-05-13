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

/** GET/PUT `/api/settings/:module` — keys stored as `{module}.{key}` in SystemConfig */
export const moduleSettingsApi = {
  get: (module: string) =>
    api.get<Record<string, unknown>>(`/api/settings/${encodeURIComponent(module)}`),

  put: (module: string, body: Record<string, unknown>) =>
    api.put<{ module: string; saved: number }>(
      `/api/settings/${encodeURIComponent(module)}`,
      body,
    ),
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

  markLost: (id: number, lostReason?: string) =>
    api.patch(`/api/crm/leads/${id}/lost`, { lostReason }),

  // Lead activities
  listActivities: (leadId: number) =>
    api.get(`/api/crm/leads/${leadId}/activities`),

  createActivity: (
    leadId: number,
    data: { type: string; summary: string; body?: string; dueAt?: string }
  ) => api.post(`/api/crm/leads/${leadId}/activities`, data),

  markActivityDone: (activityId: number) =>
    api.patch(`/api/crm/activities/${activityId}/done`, {}),

  deleteActivity: (activityId: number) =>
    api.delete(`/api/crm/activities/${activityId}`),

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

  updateMove: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/accounting/moves/${id}`, data),

  // Flow actions (Phase 3 flows C/D)
  postMove: (id: number) =>
    api.post(`/api/accounting/moves/${id}/post`),

  payMove: (id: number, data?: Record<string, unknown>) =>
    api.post(`/api/accounting/moves/${id}/pay`, data),

  reconcileMove: (id: number) =>
    api.post(`/api/accounting/moves/${id}/reconcile`),

  // Journals & Accounts
  listJournals: () =>
    api.get('/api/accounting/journals'),

  listAccounts: (params?: Record<string, unknown>) =>
    api.get('/api/accounting/accounts', { params }),
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
    api.get('/api/purchases', { params }),

  get: (id: number) =>
    api.get(`/api/purchases/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/purchases', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/purchases/${id}`, data),

  // Flow actions (Phase 3 flow D)
  confirm: (id: number) =>
    api.post(`/api/purchases/${id}/confirm`),

  createBill: (id: number) =>
    api.post(`/api/purchases/${id}/bill`),

  postBill: (id: number) =>
    api.post(`/api/purchases/${id}/post-bill`),

  payBill: (id: number, data?: Record<string, unknown>) =>
    api.post(`/api/purchases/${id}/pay-bill`, data),

  cancel: (id: number) =>
    api.post(`/api/purchases/${id}/cancel`),
}

// ── Helpdesk ─────────────────────────────────────────────────────────────────
export const helpdeskApi = {
  // Tickets
  list: (params?: Record<string, unknown>) =>
    api.get('/api/helpdesk/tickets', { params }),

  get: (id: number) =>
    api.get(`/api/helpdesk/tickets/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/helpdesk/tickets', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/helpdesk/tickets/${id}`, data),

  moveStage: (id: number, stageId: number) =>
    api.patch(`/api/helpdesk/tickets/${id}/stage`, { stageId }),

  // Flow actions (Phase 3 flow E)
  createTask: (id: number) =>
    api.post(`/api/helpdesk/tickets/${id}/create-task`),

  addTimesheet: (id: number, data: { taskId: number; hours: number; description?: string }) =>
    api.post(`/api/helpdesk/tickets/${id}/timesheet`, data),

  // Stages / pipeline
  stages: () =>
    api.get('/api/helpdesk/stages'),

  pipeline: () =>
    api.get('/api/helpdesk/pipeline'),
}

// ── Chatter (record-level messages + timeline) ────────────────────────────────
export const chatterApi = {
  load: (ownerType: string, ownerId: string | number) =>
    api.get('/api/messaging/chatter', { params: { ownerType, ownerId: String(ownerId) } }),

  post: (ownerType: string, ownerId: string | number, body: string, isInternal = true) =>
    api.post('/api/messaging/chatter', { ownerType, ownerId: String(ownerId), body, isInternal }),
}

// ── Discuss (Channels + Messages) ────────────────────────────────────────────
export const discussApi = {
  listChannels: () =>
    api.get('/api/messaging/channels'),

  createChannel: (data: { name: string; channelType?: string; description?: string }) =>
    api.post('/api/messaging/channels', data),

  getMessages: (channelId: number, params?: Record<string, unknown>) =>
    api.get(`/api/messaging/channels/${channelId}/messages`, { params }),

  postMessage: (channelId: number, body: string) =>
    api.post(`/api/messaging/channels/${channelId}/messages`, { body, messageType: 'comment' }),

  addReaction: (channelId: number, messageId: number, emoji: string) =>
    api.post(`/api/messaging/channels/${channelId}/messages/${messageId}/reactions`, { emoji }),

  removeReaction: (channelId: number, messageId: number, emoji: string) =>
    api.delete(`/api/messaging/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`),

  getAiSummary: (channelId: number) =>
    api.get(`/api/messaging/channels/${channelId}/ai-summary`),
}

// ── AI Actions (Phase 5) ──────────────────────────────────────────────────────
export const aiActionsApi = {
  run: (agentKey: string, entityType: string, entityId: string, input?: Record<string, unknown>) =>
    api.post('/api/ai/run', { agentKey, entityType, entityId, input }),

  list: (params?: Record<string, unknown>) =>
    api.get('/api/ai/actions', { params }),

  get: (id: string) =>
    api.get(`/api/ai/actions/${id}`),

  approve: (id: string) =>
    api.post(`/api/ai/actions/${id}/approve`),

  reject: (id: string) =>
    api.post(`/api/ai/actions/${id}/reject`),

  apply: (id: string) =>
    api.post(`/api/ai/actions/${id}/apply`),

  rollback: (id: string) =>
    api.post(`/api/ai/actions/${id}/rollback`),

  pending: (entityType?: string, entityId?: string) =>
    api.get('/api/ai/pending', { params: { entityType, entityId } }),
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

// ── Events ─────────────────────────────────────────────────────────────────────
export const eventsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/events', { params }),

  get: (id: number) =>
    api.get(`/api/events/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/events', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/events/${id}`, data),

  delete: (id: number) =>
    api.delete(`/api/events/${id}`),

  // State transition
  updateState: (id: number, state: string) =>
    api.patch(`/api/events/${id}/state`, { state }),

  // Tickets
  listTickets: (eventId: number) =>
    api.get(`/api/events/${eventId}/tickets`),

  createTicket: (eventId: number, data: Record<string, unknown>) =>
    api.post(`/api/events/${eventId}/tickets`, data),

  // Registrations
  listRegistrations: (eventId: number, params?: Record<string, unknown>) =>
    api.get(`/api/events/${eventId}/registrations`, { params }),

  register: (eventId: number, data: Record<string, unknown>) =>
    api.post(`/api/events/${eventId}/register`, data),
}

// ── Surveys ─────────────────────────────────────────────────────────────────────
export const surveysApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/surveys', { params }),

  get: (id: number) =>
    api.get(`/api/surveys/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/surveys', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/surveys/${id}`, data),

  publish: (id: number) =>
    api.patch(`/api/surveys/${id}/publish`),

  close: (id: number) =>
    api.patch(`/api/surveys/${id}/close`),

  delete: (id: number) =>
    api.delete(`/api/surveys/${id}`),

  // Questions
  createQuestion: (surveyId: number, data: Record<string, unknown>) =>
    api.post(`/api/surveys/${surveyId}/questions`, data),

  updateQuestion: (questionId: number, data: Record<string, unknown>) =>
    api.put(`/api/surveys/questions/${questionId}`, data),

  deleteQuestion: (questionId: number) =>
    api.delete(`/api/surveys/questions/${questionId}`),

  // Answer options
  createAnswer: (questionId: number, data: Record<string, unknown>) =>
    api.post(`/api/surveys/questions/${questionId}/answers`, data),

  deleteAnswer: (answerId: number) =>
    api.delete(`/api/surveys/answers/${answerId}`),

  // Results
  getResults: (surveyId: number) =>
    api.get(`/api/surveys/${surveyId}/results`),

  respond: (surveyId: number, data: Record<string, unknown>) =>
    api.post(`/api/surveys/${surveyId}/respond`, data),
}

// ── Notes ────────────────────────────────────────────────────────────────────────
export const notesApi = {
  list: () =>
    api.get('/api/notes'),

  get: (id: number) =>
    api.get(`/api/notes/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/notes', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/notes/${id}`, data),

  delete: (id: number) =>
    api.delete(`/api/notes/${id}`),
}

// ── Knowledge ──────────────────────────────────────────────────────────────────
export const knowledgeApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/knowledge', { params }),

  get: (id: number) =>
    api.get(`/api/knowledge/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/knowledge', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/knowledge/${id}`, data),

  delete: (id: number) =>
    api.delete(`/api/knowledge/${id}`),

  // Workspaces
  listWorkspaces: () =>
    api.get('/api/knowledge/workspaces'),

  createWorkspace: (data: Record<string, unknown>) =>
    api.post('/api/knowledge/workspaces', data),

  // AI generation
  generate: (data: { title?: string; category?: string; existingBody?: string }) =>
    api.post('/api/knowledge/ai/generate', data),
}

// ── Calendar ───────────────────────────────────────────────────────────────────
export const calendarApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/calendar', { params }),

  get: (id: number) =>
    api.get(`/api/calendar/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/calendar', data),

  /** Same body as `create`; preferred path for cross-module calendar pushes (Track B adapter). */
  createEvent: (data: Record<string, unknown>) =>
    api.post('/api/calendar/events', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/calendar/${id}`, data),

  delete: (id: number) =>
    api.delete(`/api/calendar/${id}`),
}

// ── Spreadsheet ────────────────────────────────────────────────────────────────
export const spreadsheetApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/spreadsheet', { params }),

  get: (id: number) =>
    api.get(`/api/spreadsheet/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/spreadsheet', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/spreadsheet/${id}`, data),

  delete: (id: number) =>
    api.delete(`/api/spreadsheet/${id}`),
}

// ── Studio (Website Builder) ───────────────────────────────────────────────────
export const studioApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/studio/pages', { params }),

  get: (id: number) =>
    api.get(`/api/studio/pages/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/studio/pages', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/studio/pages/${id}`, data),

  delete: (id: number) =>
    api.delete(`/api/studio/pages/${id}`),

  publish: (id: number) =>
    api.post(`/api/studio/pages/${id}/publish`),

  unpublish: (id: number) =>
    api.post(`/api/studio/pages/${id}/unpublish`),
}

// ── Rental ──────────────────────────────────────────────────────────────────────
export const rentalApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/api/fs-rental/rentals', { params }),

  get: (id: number) =>
    api.get(`/api/fs-rental/rentals/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/api/fs-rental/rentals', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/fs-rental/rentals/${id}`, data),

  delete: (id: number) =>
    api.delete(`/api/fs-rental/rentals/${id}`),
}

// ── Field Service ──────────────────────────────────────────────────────────────
export const fieldServiceApi = {
  listTasks: (params?: Record<string, unknown>) =>
    api.get('/api/fs-rental/tasks', { params }),

  getTask: (id: number) =>
    api.get(`/api/fs-rental/tasks/${id}`),

  createTask: (data: Record<string, unknown>) =>
    api.post('/api/fs-rental/tasks', data),

  updateTask: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/fs-rental/tasks/${id}`, data),

  deleteTask: (id: number) =>
    api.delete(`/api/fs-rental/tasks/${id}`),
}

export default api
