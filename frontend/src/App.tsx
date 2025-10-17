import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'

// Styles
import './styles/globals.css'

// Components
import { AnimatedBackground } from '@/components/shared/AnimatedBackground'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { WebSocketProvider } from '@/contexts/WebSocketContext'

// Pages
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import ModulePage from '@/pages/ModulePage'
import AIChat from '@/pages/AIChat'
import ContactHub from '@/pages/ContactHub'

// Layout
import { MainLayout } from '@/components/layout/MainLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            <Router>
              <div className="min-h-screen bg-dark-900 text-white relative overflow-hidden">
                <AnimatedBackground />
                
                <Routes>
                  {/* Auth Routes */}
                  <Route path="/login" element={
                    <AuthLayout>
                      <Login />
                    </AuthLayout>
                  } />
                  
                  {/* Main App Routes */}
                  <Route path="/" element={
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  } />
                  
                  <Route path="/module/:moduleName" element={
                    <MainLayout>
                      <ModulePage />
                    </MainLayout>
                  } />
                  
                  <Route path="/ai-chat" element={
                    <MainLayout>
                      <AIChat />
                    </MainLayout>
                  } />
                  
                  <Route path="/contact-hub/*" element={
                    <MainLayout>
                      <ContactHub />
                    </MainLayout>
                  } />
                  
                  {/* Catch all route */}
                  <Route path="*" element={
                    <MainLayout>
                      <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                          <h1 className="heading-1 mb-4">404</h1>
                          <p className="text-white/70 mb-8">Page not found</p>
                          <a href="/" className="btn-primary">
                            Go Home
                          </a>
                        </div>
                      </div>
                    </MainLayout>
                  } />
                </Routes>
                
                {/* Toast Notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'rgba(15, 15, 35, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10B981',
                        secondary: '#ffffff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#EF4444',
                        secondary: '#ffffff',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
      
      {/* React Query Devtools */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

export default App