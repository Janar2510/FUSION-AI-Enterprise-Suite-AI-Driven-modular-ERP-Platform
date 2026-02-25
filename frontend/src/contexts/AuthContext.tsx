import React, { createContext, useContext, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, authApi } from '@/lib/api'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
import { toast } from 'react-hot-toast'

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
  loginWithPasskey: (email: string) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<void>
  registerPasskey: (partnerId: number) => Promise<void>
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

  const loginWithPasskey = async (email: string) => {
    try {
      // 1. Get options from server
      const options = await authApi.getPasskeyLoginOptions(email)

      // 2. Start browser authentication
      const authResponse = await startAuthentication(options.data)

      // 3. Verify on server
      const verification = await authApi.verifyPasskeyLogin(authResponse)

      if (verification.data.verified) {
        setUser(verification.data.user)
        // Backend sets cookie, no localStorage token needed but we clear it to be clean
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']

        queryClient.invalidateQueries({ queryKey: ['auth'] })
        toast.success('Logged in with Passkey!')
      }
    } catch (error: any) {
      console.error('Passkey login failed:', error)
      toast.error(error.message || 'Passkey login failed')
      throw error
    }
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

  const registerPasskey = async (partnerId: number) => {
    try {
      // 1. Get options from server
      const options = await authApi.getPasskeyRegistrationOptions(partnerId)

      // 2. Start browser registration
      const regResponse = await startRegistration(options.data)

      // 3. Verify on server
      const verification = await authApi.verifyPasskeyRegistration(regResponse)

      if (verification.data.verified) {
        toast.success('Passkey registered successfully!')
        queryClient.invalidateQueries({ queryKey: ['auth'] })
      }
    } catch (error: any) {
      console.error('Passkey registration failed:', error)
      toast.error(error.message || 'Passkey registration failed')
      throw error
    }
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
    loginWithPasskey,
    logout,
    register,
    registerPasskey,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
