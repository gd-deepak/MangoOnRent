import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ShieldCheck, User, ArrowRight, CheckCircle, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { registerUser, loginUser, forgotPassword } from '../utils/sheets'
import { hashPassword } from '../utils/auth'
import { img } from '../config/images'
import { SITE } from '../config/siteConfig'

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, name, type = 'text', value, onChange, placeholder, required }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && ' *'}</label>
      <div className="relative">
        <input
          type={isPassword && show ? 'text' : type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="input-field pr-10"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  )
}

// ── User Login ────────────────────────────────────────────────────────────────
function UserLogin({ onSuccess }) {
  const [mode, setMode]       = useState('login') // 'login' | 'register' | 'forgot'
  const [form, setForm]       = useState({ name: '', email: '', phone: '', city: '', password: '', confirm: '' })
  const [forgotEmail, setForgotEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const hash = await hashPassword(form.password)
      const res  = await loginUser({ email: form.email, passwordHash: hash })
      if (!res.ok) { setError(res.error || 'Login failed'); return }
      onSuccess(res.data)
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const hash = await hashPassword(form.password)
      const res  = await registerUser({ name: form.name, email: form.email, phone: form.phone, city: form.city, passwordHash: hash, passwordPlain: form.password })
      if (!res.ok) { setError(res.error || 'Registration failed'); return }
      setSuccess('Account created! Please log in.')
      setMode('login')
      setForm((f) => ({ ...f, password: '', confirm: '' }))
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    if (!forgotEmail) { setError('Please enter your email.'); return }
    setError(''); setLoading(true)
    try {
      const res = await forgotPassword({ email: forgotEmail })
      if (!res.ok) { setError(res.error || 'Failed. Try again.'); return }
      setSuccess(res.data?.message || 'Your password has been sent to your email.')
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  const switchMode = (m) => { setMode(m); setError(''); setSuccess('') }

  return (
    <div>
      {/* Mode toggle (login / register only — forgot is a sub-flow) */}
      {mode !== 'forgot' && (
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {['login', 'register'].map((m) => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
                mode === m ? 'bg-white shadow text-mango-600' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm text-leaf-700 bg-leaf-50 border border-leaf-200 rounded-xl px-4 py-3 mb-4">
          <CheckCircle size={16} className="shrink-0" /> {success}
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>
      )}

      {/* Forgot password */}
      {mode === 'forgot' && (
        <div>
          <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 mb-5">
            <Mail size={18} className="text-purple-500 shrink-0" />
            <p className="text-sm text-purple-800">Enter your registered email and we'll send your password.</p>
          </div>
          <form onSubmit={handleForgot} className="space-y-4">
            <Field label="Registered Email" name="forgotEmail" type="email"
              value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="you@email.com" required />
            <button type="submit" disabled={loading} className="w-full btn-primary py-3">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <>Send My Password <ArrowRight size={16} /></>}
            </button>
            <p className="text-center text-xs text-gray-500">
              <button type="button" onClick={() => switchMode('login')} className="text-mango-600 font-semibold hover:underline">
                ← Back to Sign In
              </button>
            </p>
          </form>
        </div>
      )}

      {mode === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <Field label="Email" name="email" type="email" value={form.email} onChange={set} placeholder="you@email.com" required />
          <Field label="Password" name="password" type="password" value={form.password} onChange={set} placeholder="••••••••" required />
          <button type="submit" disabled={loading} className="w-full btn-primary py-3">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : <>Sign In <ArrowRight size={16} /></>}
          </button>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <button type="button" onClick={() => switchMode('register')} className="text-mango-600 font-semibold hover:underline">
              Create account
            </button>
            <button type="button" onClick={() => switchMode('forgot')} className="text-gray-400 hover:text-gray-600 hover:underline">
              Forgot password?
            </button>
          </div>
        </form>
      )}

      {mode === 'register' && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Full Name" name="name" value={form.name} onChange={set} placeholder="Rajesh Kumar" required />
            </div>
            <Field label="Email" name="email" type="email" value={form.email} onChange={set} placeholder="you@email.com" required />
            <Field label="Phone" name="phone" value={form.phone} onChange={set} placeholder="+91 98765 43210" required />
            <Field label="City" name="city" value={form.city} onChange={set} placeholder="Mumbai" required />
            <div /> {/* spacer */}
            <Field label="Password" name="password" type="password" value={form.password} onChange={set} placeholder="Min 8 characters" required />
            <Field label="Confirm Password" name="confirm" type="password" value={form.confirm} onChange={set} placeholder="Re-enter password" required />
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary py-3">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : <>Create Account <ArrowRight size={16} /></>}
          </button>
          <p className="text-center text-xs text-gray-500">
            Already have an account?{' '}
            <button type="button" onClick={() => switchMode('login')} className="text-mango-600 font-semibold hover:underline">
              Sign in
            </button>
          </p>
        </form>
      )}
    </div>
  )
}

// ── Admin Login ───────────────────────────────────────────────────────────────
function AdminLogin({ onSuccess }) {
  const [form, setForm]       = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { loginAdmin }        = useAuth()

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await loginAdmin(form.username, form.password)
      if (res.ok) { onSuccess() }
      else { setError(res.error || 'Invalid admin credentials') }
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
        <ShieldCheck size={20} className="text-amber-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Admin Access</p>
          <p className="text-xs text-amber-600">This area is for MangoOnRent staff only</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Username" name="username" value={form.username} onChange={set} placeholder="Admin username" required />
        <Field label="Password" name="password" type="password" value={form.password} onChange={set} placeholder="Admin password" required />
        <button type="submit" disabled={loading} className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying…</> : <><ShieldCheck size={16} /> Admin Sign In</>}
        </button>
      </form>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Login() {
  const [tab, setTab]    = useState('user') // 'user' | 'admin'
  const { loginUser: setUser } = useAuth()
  const navigate         = useNavigate()

  const handleUserSuccess = (userData) => {
    setUser(userData)
    navigate('/dashboard')
  }

  const handleAdminSuccess = () => navigate('/admin')

  return (
    <div className="pt-16 min-h-screen flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0"
          style={{ backgroundImage: `url('${img.booking}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-mango-900/85 to-leaf-900/70" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="text-5xl mb-6">🥭</div>
          <h2 className="font-display text-4xl font-bold mb-4 leading-tight">
            Your Orchard,<br />Your Dashboard
          </h2>
          <p className="text-mango-100 text-lg mb-8 leading-relaxed">
            Sign in to track your mango trees, view booking details, and manage your harvest deliveries — all in one place.
          </p>
          <div className="space-y-3">
            {['Track your tree IDs & bookings', 'View payment & delivery status', 'Update your delivery address', 'Get harvest season updates'].map((t) => (
              <div key={t} className="flex items-center gap-3 text-sm text-mango-100">
                <CheckCircle size={16} className="text-mango-400 shrink-0" /> {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src="/logo.svg" alt="MangoOnRent" className="h-10 w-auto" />
            </Link>
            <p className="text-gray-500 text-sm mt-2">Welcome to {SITE.name}</p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => setTab('user')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                tab === 'user' ? 'border-mango-500 bg-mango-50 text-mango-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              <User size={16} /> Customer Login
            </button>
            <button onClick={() => setTab('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                tab === 'admin' ? 'border-gray-800 bg-gray-900 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              <ShieldCheck size={16} /> Admin Login
            </button>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            {tab === 'user'
              ? <UserLogin onSuccess={handleUserSuccess} />
              : <AdminLogin onSuccess={handleAdminSuccess} />
            }
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            <Link to="/" className="hover:text-mango-500 transition-colors">← Back to MangoOnRent</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
