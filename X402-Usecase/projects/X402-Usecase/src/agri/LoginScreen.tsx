import React, { useState } from 'react'
import AuthShell from './AuthShell'
import { login, loginWithOtp, sendLoginOtp } from './auth'
import type { AgriUser } from './auth'

interface LoginScreenProps {
  onLoggedIn: (user: AgriUser) => void
  onGoRegister: () => void
  notice?: string
}

type LoginMode = 'password' | 'otp'

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoggedIn, onGoRegister, notice }) => {
  const [mode, setMode] = useState<LoginMode>('password')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [mockOtp, setMockOtp] = useState('')
  const [error, setError] = useState('')

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      onLoggedIn(login(mobile, password))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  const handleSendOtp = () => {
    setError('')
    try {
      const code = sendLoginOtp(mobile)
      setMockOtp(code)
      setOtp('')
    } catch (err) {
      setMockOtp('')
      setError(err instanceof Error ? err.message : 'Could not send OTP')
    }
  }

  const handleOtpLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      onLoggedIn(loginWithOtp(mobile, otp, mockOtp))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <AuthShell>
      {mockOtp && (
        <div className="gov-otp-badge" role="status">
          Mock OTP: {mockOtp}
        </div>
      )}
      <form
        onSubmit={mode === 'password' ? handlePasswordLogin : handleOtpLogin}
        className="gov-form-card w-full max-w-md space-y-5"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 font-semibold">Citizen login</p>
          <h2 className="text-2xl font-semibold text-emerald-950 mt-1">Welcome back</h2>
          <p className="text-sm text-emerald-900/70 mt-1">Sign in with your registered mobile number.</p>
        </div>

        <div className="gov-tabs" role="tablist" aria-label="Login method">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'password'}
            className={`gov-tab ${mode === 'password' ? 'gov-tab-active' : ''}`}
            onClick={() => {
              setMode('password')
              setError('')
            }}
          >
            Login with Password
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'otp'}
            className={`gov-tab ${mode === 'otp' ? 'gov-tab-active' : ''}`}
            onClick={() => {
              setMode('otp')
              setError('')
            }}
          >
            Login with OTP
          </button>
        </div>

        {notice && (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{notice}</p>
        )}

        <label className="block">
          <span className="text-sm font-medium text-emerald-950">Mobile Number</span>
          <input
            className="agri-input mt-1"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="10-digit mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />
        </label>

        {mode === 'password' ? (
          <label className="block">
            <span className="text-sm font-medium text-emerald-950">Password</span>
            <input
              type="password"
              className="agri-input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
        ) : (
          <div className="space-y-3">
            <button type="button" className="agri-btn-secondary w-full" onClick={handleSendOtp}>
              Send OTP
            </button>
            <label className="block">
              <span className="text-sm font-medium text-emerald-950">Enter 6-digit OTP</span>
              <input
                className="agri-input mt-1 tracking-[0.35em]"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="------"
                required
              />
            </label>
          </div>
        )}

        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" className="agri-btn-primary w-full">
          {mode === 'password' ? 'Sign in' : 'Verify OTP & sign in'}
        </button>
        <button type="button" className="w-full text-emerald-900 underline-offset-4 hover:underline" onClick={onGoRegister}>
          New User? Register
        </button>
      </form>
    </AuthShell>
  )
}

export default LoginScreen
