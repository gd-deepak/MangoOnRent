import { createContext, useContext, useState, useCallback } from 'react'
import { adminLoginApi } from '../utils/sheets'

const AuthContext = createContext(null)

const DEFAULT_ADMIN_USERNAME = 'mangoOnRent'
const DEFAULT_ADMIN_PASSWORD = 'Mango@1288'
const SESSION_KEY            = 'mor_session'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null }
    catch { return null }
  })

  // Async — checks hardcoded creds first, then Admins sheet
  const loginAdmin = useCallback(async (username, password) => {
    if (username === DEFAULT_ADMIN_USERNAME && password === DEFAULT_ADMIN_PASSWORD) {
      const s = { role: 'admin', username, name: 'System Admin' }
      setSession(s)
      localStorage.setItem(SESSION_KEY, JSON.stringify(s))
      return { ok: true }
    }
    try {
      const res = await adminLoginApi({ username, password })
      if (res.ok && res.data) {
        const s = { role: 'admin', username: res.data.username, name: res.data.name, email: res.data.email }
        setSession(s)
        localStorage.setItem(SESSION_KEY, JSON.stringify(s))
        return { ok: true }
      }
      return { ok: false, error: res.error || 'Invalid admin credentials' }
    } catch {
      return { ok: false, error: 'Could not connect. Please check your internet.' }
    }
  }, [])

  const loginUser = useCallback((userData) => {
    const s = { role: 'user', ...userData }
    setSession(s)
    localStorage.setItem(SESSION_KEY, JSON.stringify(s))
  }, [])

  const updateSessionProfile = useCallback((updated) => {
    setSession((prev) => {
      const s = { ...prev, ...updated }
      localStorage.setItem(SESSION_KEY, JSON.stringify(s))
      return s
    })
  }, [])

  const logout = useCallback(() => {
    setSession(null)
    localStorage.removeItem(SESSION_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{
      session,
      loginAdmin,
      loginUser,
      logout,
      updateSessionProfile,
      isAdmin:    session?.role === 'admin',
      isUser:     session?.role === 'user',
      isLoggedIn: !!session,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
