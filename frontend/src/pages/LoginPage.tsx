import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authSlice'
import { useTeamStore } from '../store/teamSlice'
import api from '../services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const { users, recordLogin } = useTeamStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Try real API first
      const response = await api.post('/auth/login', { email, password })
      const { accessToken, user } = response.data

      login(
        {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          teams: user.teams?.map((t: { id: string }) => t.id) || [],
        },
        accessToken
      )

      // Record login activity
      recordLogin(user.id)

      navigate('/dashboard')
    } catch (apiError) {
      // Fallback to local user store validation
      if (email && password) {
        // Find user in team store (case-insensitive)
        const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

        if (!user) {
          setError('Invalid email or password')
          setLoading(false)
          return
        }

        // Check if user is active
        if (user.status !== 'active') {
          setError('Your account has been deactivated. Please contact an administrator.')
          setLoading(false)
          return
        }

        // Validate password
        if (user.password !== password) {
          setError('Invalid email or password')
          setLoading(false)
          return
        }

        // Login successful
        login(
          {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles,
            teams: user.teams,
          },
          'mock-jwt-token'
        )

        // Record login activity
        recordLogin(user.id)

        navigate('/dashboard')
      } else {
        setError('Please enter email and password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Project Management Platform
            </h1>
            <p className="text-slate-400">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Default Admin Credentials Info */}
          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <p className="text-sm text-slate-300 font-medium mb-2">Default Admin Credentials</p>
            <div className="text-xs text-slate-400 space-y-1">
              <p><strong>Email:</strong> admin@company.com</p>
              <p><strong>Password:</strong> Admin@123</p>
              <p className="text-amber-400 mt-2">Please change the default password after first login.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
