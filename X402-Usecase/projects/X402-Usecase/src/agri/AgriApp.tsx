import React, { useState } from 'react'
import { getSession, logout } from './auth'
import type { AgriUser } from './auth'
import LoginScreen from './LoginScreen'
import RegisterScreen from './RegisterScreen'
import FarmerDashboard from './FarmerDashboard'
import ConsumerDashboard from './ConsumerDashboard'

type AuthView = 'login' | 'register'

const AgriApp: React.FC = () => {
  const [view, setView] = useState<AuthView>('login')
  const [user, setUser] = useState<AgriUser | null>(() => getSession())
  const [authNotice, setAuthNotice] = useState('')

  const handleLogout = () => {
    logout()
    setUser(null)
    setView('login')
    setAuthNotice('')
  }

  if (!user && view === 'register') {
    return (
      <RegisterScreen
        onRegistered={(message) => {
          setAuthNotice(message)
          setView('login')
        }}
        onGoLogin={() => {
          setAuthNotice('')
          setView('login')
        }}
      />
    )
  }

  if (!user) {
    return (
      <LoginScreen
        onLoggedIn={setUser}
        onGoRegister={() => {
          setAuthNotice('')
          setView('register')
        }}
        notice={authNotice}
      />
    )
  }

  if (user.userType === 'Farmer') {
    return <FarmerDashboard user={user} onLogout={handleLogout} />
  }

  return <ConsumerDashboard user={user} onLogout={handleLogout} />
}

export default AgriApp
