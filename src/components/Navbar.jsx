import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, User, LayoutDashboard, ShieldCheck, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/',       label: 'Home' },
  { to: '/about',  label: 'About Us' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/trees',  label: 'Our Trees' },
  { to: '/contact', label: 'Contact' },
]

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <img src="/logo.svg" alt="MangoOnRent logo" className="h-9 w-auto" />
    </Link>
  )
}

// ── User avatar dropdown ──────────────────────────────────────────────────────
function UserMenu({ session, isAdmin, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = isAdmin
    ? 'A'
    : (session.name || 'U').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${isAdmin ? 'bg-gray-800' : 'bg-mango-500'}`}>
          {initials}
        </div>
        <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
          {isAdmin ? 'Admin' : (session.name?.split(' ')[0] || 'Account')}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 py-1.5 z-50">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-900 truncate">{session.name || session.username}</p>
            <p className="text-xs text-gray-400 truncate">{session.email || 'Admin'}</p>
          </div>

          {isAdmin ? (
            <Link to="/admin" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium">
              <LayoutDashboard size={15} className="text-gray-400" /> Admin Panel
            </Link>
          ) : (
            <Link to="/dashboard" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium">
              <User size={15} className="text-gray-400" /> My Dashboard
            </Link>
          )}

          <button onClick={() => { setOpen(false); onLogout() }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-medium">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
export default function Navbar({ minimal = false }) {
  const [open,     setOpen]     = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location  = useLocation()
  const { session, isAdmin, isLoggedIn, logout } = useAuth()

  useEffect(() => { setOpen(false) }, [location])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />

          {/* Desktop nav */}
          {!minimal && (
            <div className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'text-mango-600 bg-mango-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <UserMenu session={session} isAdmin={isAdmin} onLogout={logout} />
            ) : (
              <>
                <Link to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 transition-colors">
                  <User size={15} /> Login
                </Link>
                {!minimal && (
                  <Link to="/booking" className="btn-primary text-sm py-2">
                    Book a Tree
                  </Link>
                )}
              </>
            )}
            {isAdmin && (
              <Link to="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 transition-colors">
                <ShieldCheck size={13} /> Admin
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1">
          {!minimal && links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'text-mango-600 bg-mango-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}

          {isLoggedIn ? (
            <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
              <div className="px-4 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                {isAdmin ? 'Admin' : session.name}
              </div>
              <Link to={isAdmin ? '/admin' : '/dashboard'}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                {isAdmin ? <ShieldCheck size={15} /> : <User size={15} />}
                {isAdmin ? 'Admin Panel' : 'My Dashboard'}
              </Link>
              <button onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50">
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          ) : (
            <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
              <Link to="/login" className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Login / Register
              </Link>
              {!minimal && (
                <Link to="/booking" className="block mt-2 text-center btn-primary text-sm py-2.5">
                  Book a Tree
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
