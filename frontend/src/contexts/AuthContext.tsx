import React, { createContext, useContext, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: string
  permissions: string[]
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  // Check if user is authenticated
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get('/auth/me')
      return response.data
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await api.post('/auth/login', { email, password })
      return response.data
    },
    onSuccess: (data) => {
      setUser(data.user)
      localStorage.setItem('token', data.token)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
    onError: (error) => {
      console.error('Login failed:', error)
      throw error
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await api.post('/auth/register', data)
      return response.data
    },
    onSuccess: (data) => {
      setUser(data.user)
      localStorage.setItem('token', data.token)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
    onError: (error) => {
      console.error('Registration failed:', error)
      throw error
    },
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await api.patch('/auth/profile', data)
      return response.data
    },
    onSuccess: (data) => {
      setUser(data.user)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
    onError: (error) => {
      console.error('Profile update failed:', error)
      throw error
    },
  })

  // Initialize auth state
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Set token in API client
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    
    if (userData) {
      setUser(userData)
    }
    
    setIsLoading(false)
  }, [userData])

  // Update API client when token changes
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  }, [user])

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password })
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    queryClient.clear()
  }

  const register = async (data: RegisterData) => {
    await registerMutation.mutateAsync(data)
  }

  const updateProfile = async (data: Partial<User>) => {
    await updateProfileMutation.mutateAsync(data)
  }

  const isAuthenticated = !!user && !userLoading

  const value = {
    user,
    isAuthenticated,
    isLoading: isLoading || userLoading,
    login,
    logout,
    register,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}




