import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { GlassCard } from '@/components/shared/GlassCard'
import { GradientButton } from '@/components/shared/GradientButton'
import { Fingerprint } from 'lucide-react'
import { toast } from 'react-hot-toast'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, loginWithPasskey } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasskeyLogin = async () => {
    if (!email) {
      toast.error('Please enter your email first to login with Passkey')
      return
    }

    setIsLoading(true)
    try {
      await loginWithPasskey(email)
    } catch (error) {
      console.error('Passkey login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-dark-bg via-primary-purple to-secondary-purple">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8" gradient glow>
          <div className="text-center mb-8">
            <h1 className="heading-1 mb-2 text-white">Welcome Back</h1>
            <p className="text-white/70">Sign in to your FusionAI account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-glass w-full"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-glass w-full"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="flex flex-col gap-3">
              <GradientButton
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                Sign In
              </GradientButton>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-4 text-white/40 text-xs uppercase tracking-widest">Or Securely</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={isLoading}
                className="w-full bg-white/10 hover:bg-white/15 text-white py-3 rounded-lg border border-white/10 transition-all flex items-center justify-center gap-3 backdrop-blur-md"
              >
                <Fingerprint className="w-5 h-5 text-blue-400" />
                Login with Passkey
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-white/40">
            Don't have an account? <span className="text-blue-400 cursor-pointer hover:underline">Contact Administrator</span>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  )
}

export default Login
