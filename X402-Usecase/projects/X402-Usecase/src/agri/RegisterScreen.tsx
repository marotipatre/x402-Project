import React, { useEffect, useRef, useState } from 'react'
import AuthShell from './AuthShell'
import { AGRI_STATES, register } from './auth'
import type { UserRole } from './auth'

const SUCCESS_MESSAGE = 'Registration successful! Please log in with your new credentials'

interface RegisterScreenProps {
  onRegistered: (message: string) => void
  onGoLogin: () => void
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegistered, onGoLogin }) => {
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [state, setState] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState<UserRole>('Farmer')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const redirectTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimer.current !== null) {
        window.clearTimeout(redirectTimer.current)
      }
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      register(name, mobile, state, userType, password)
      setSuccess(SUCCESS_MESSAGE)
      redirectTimer.current = window.setTimeout(() => onRegistered(SUCCESS_MESSAGE), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="gov-form-card w-full max-w-md space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 font-semibold">New beneficiary</p>
          <h2 className="text-2xl font-semibold text-emerald-950 mt-1">Create your account</h2>
          <p className="text-sm text-emerald-900/70 mt-1">
            Farmers use the portal free. Consumers pay $0.01 Testnet USDC to deploy the allocation agent.
          </p>
        </div>
        <label className="block">
          <span className="text-sm font-medium text-emerald-950">Full Name</span>
          <input className="agri-input mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-emerald-950">Mobile Number</span>
          <input
            className="agri-input mt-1"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="10-digit unique mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-emerald-950">State / Region</span>
          <select className="agri-input mt-1" value={state} onChange={(e) => setState(e.target.value)} required>
            <option value="">Select state</option>
            {AGRI_STATES.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-emerald-950">Role</span>
          <select className="agri-input mt-1" value={userType} onChange={(e) => setUserType(e.target.value as UserRole)}>
            <option value="Farmer">Farmer</option>
            <option value="Consumer">Consumer</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-emerald-950">Password</span>
          <input
            type="password"
            className="agri-input mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        {success && (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{success}</p>
        )}
        <button type="submit" className="agri-btn-primary w-full" disabled={Boolean(success)}>
          Create account
        </button>
        <button type="button" className="w-full text-emerald-900 underline-offset-4 hover:underline" onClick={onGoLogin}>
          Already registered? Sign in
        </button>
      </form>
    </AuthShell>
  )
}

export default RegisterScreen
