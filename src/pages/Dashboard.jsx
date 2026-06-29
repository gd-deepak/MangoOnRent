import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Package, LogOut, CheckCircle, Loader2, ArrowRight, Edit3, Save, X, TreePine, Calendar, CreditCard, RefreshCw, Key, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getBookingsByEmail, updateProfile, changeUserPassword } from '../utils/sheets'
import { hashPassword } from '../utils/auth'

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = String(status).toLowerCase()
  const cls = s.includes('verified') || s.includes('paid')
    ? 'bg-green-100 text-green-700'
    : s.includes('pending') || s.includes('submitted')
    ? 'bg-amber-100 text-amber-700'
    : 'bg-gray-100 text-gray-600'
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{status || '—'}</span>
}

// ── Booking card ──────────────────────────────────────────────────────────────
function BookingCard({ b }) {
  const trees = b.tree_ids ? String(b.tree_ids).split(',').map((t) => t.trim()) : []
  const date  = b.timestamp ? new Date(b.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Booking ID</p>
          <p className="font-mono font-bold text-gray-900">{b.booking_id || '—'}</p>
        </div>
        <StatusBadge status={b.payment_status} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <TreePine size={14} className="text-leaf-500 shrink-0" />
          <span className="font-medium">{b.tree_count || trees.length || 1} tree{(b.tree_count || 1) > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Package size={14} className="text-mango-500 shrink-0" />
          <span>{b.package_name || b.package_id || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <CreditCard size={14} className="text-gray-400 shrink-0" />
          <span className="font-semibold text-mango-600">₹{Number(b.amount_paid || 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar size={14} className="text-gray-400 shrink-0" />
          <span>{date}</span>
        </div>
      </div>

      {trees.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-1.5">Tree IDs</p>
          <div className="flex flex-wrap gap-1">
            {trees.map((id) => (
              <span key={id} className="font-mono text-xs bg-mango-50 border border-mango-200 text-mango-700 font-bold px-2 py-0.5 rounded">
                {id}
              </span>
            ))}
          </div>
        </div>
      )}

      {b.txn_id && (
        <p className="text-xs text-gray-400 mt-3 font-mono">TXN: {b.txn_id}</p>
      )}
    </div>
  )
}

// ── Profile form ──────────────────────────────────────────────────────────────
function ProfileTab({ session, onUpdate }) {
  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState({ name: session.name || '', phone: session.phone || '', city: session.city || '', address: session.address || '' })
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState('')
  const [error, setError]       = useState('')

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSave = async () => {
    setLoading(true); setError(''); setSuccess('')
    try {
      const res = await updateProfile({ email: session.email, ...form })
      if (!res.ok) { setError(res.error || 'Update failed'); return }
      onUpdate(form)
      setSuccess('Profile updated successfully!')
      setEditing(false)
    } catch { setError('Something went wrong.') }
    finally { setLoading(false) }
  }

  const fields = [
    { label: 'Full Name',        name: 'name',    placeholder: 'Rajesh Kumar' },
    { label: 'Phone / WhatsApp', name: 'phone',   placeholder: '+91 98765 43210' },
    { label: 'City',             name: 'city',    placeholder: 'Mumbai' },
    { label: 'Delivery Address', name: 'address', placeholder: 'Flat, Street, Area...', rows: 3 },
  ]

  return (
    <div className="max-w-xl">
      {success && (
        <div className="flex items-center gap-2 text-sm text-leaf-700 bg-leaf-50 border border-leaf-200 rounded-xl px-4 py-3 mb-4">
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>}

      {/* Email (non-editable) */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-400 mb-0.5">Email (cannot be changed)</p>
        <p className="font-semibold text-gray-700">{session.email}</p>
      </div>

      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
            {f.rows ? (
              <textarea
                name={f.name}
                value={form[f.name]}
                onChange={set}
                disabled={!editing}
                rows={f.rows}
                placeholder={f.placeholder}
                className={`input-field resize-none ${!editing ? 'bg-gray-50 cursor-default' : ''}`}
              />
            ) : (
              <input
                name={f.name}
                value={form[f.name]}
                onChange={set}
                disabled={!editing}
                placeholder={f.placeholder}
                className={`input-field ${!editing ? 'bg-gray-50 cursor-default' : ''}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-mango-500 hover:bg-mango-600 text-white font-semibold rounded-xl text-sm transition-colors">
            <Edit3 size={15} /> Edit Profile
          </button>
        ) : (
          <>
            <button onClick={handleSave} disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-leaf-500 hover:bg-leaf-600 text-white font-semibold rounded-xl text-sm transition-colors">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Changes</>}
            </button>
            <button onClick={() => { setEditing(false); setError('') }}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl text-sm transition-colors">
              <X size={15} /> Cancel
            </button>
          </>
        )}
      </div>

      {/* Change password */}
      <ChangePasswordSection email={session.email} />
    </div>
  )
}

// ── Change password section ───────────────────────────────────────────────────
function ChangePasswordSection({ email }) {
  const [pw,      setPw]      = useState({ current: '', newPw: '', confirm: '' })
  const [show,    setShow]    = useState({ current: false, newPw: false })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error,   setError]   = useState('')

  const set = (e) => setPw((f) => ({ ...f, [e.target.name]: e.target.value }))
  const toggleShow = (k) => setShow((s) => ({ ...s, [k]: !s[k] }))

  const handleSave = async () => {
    setError(''); setSuccess('')
    if (!pw.current || !pw.newPw) { setError('All fields are required.'); return }
    if (pw.newPw.length < 8) { setError('New password must be at least 8 characters.'); return }
    if (pw.newPw !== pw.confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const currentHash = await hashPassword(pw.current)
      const newHash     = await hashPassword(pw.newPw)
      const res = await changeUserPassword({ email, currentHash, newPasswordHash: newHash, newPasswordPlain: pw.newPw })
      if (!res.ok) { setError(res.error || 'Failed to update password'); return }
      setSuccess('Password updated successfully!')
      setPw({ current: '', newPw: '', confirm: '' })
    } catch { setError('Something went wrong.') }
    finally { setLoading(false) }
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Key size={16} className="text-mango-500" /> Change Password</h3>
      {success && (
        <div className="flex items-center gap-2 text-sm text-leaf-700 bg-leaf-50 border border-leaf-200 rounded-xl px-4 py-3 mb-4">
          <CheckCircle size={14} /> {success}
        </div>
      )}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>}
      <div className="space-y-3 max-w-sm">
        {[
          { key: 'current', label: 'Current Password' },
          { key: 'newPw',   label: 'New Password (min 8 chars)' },
          { key: 'confirm', label: 'Confirm New Password' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative">
              <input
                name={key}
                type={show[key] ? 'text' : 'password'}
                value={pw[key]}
                onChange={set}
                placeholder="••••••••"
                className="input-field pr-9"
              />
              {show[key] !== undefined && (
                <button type="button" onClick={() => toggleShow(key)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              )}
            </div>
          </div>
        ))}
        <button onClick={handleSave} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl text-sm transition-colors">
          {loading ? <><Loader2 size={14} className="animate-spin" /> Updating…</> : <><Key size={14} /> Update Password</>}
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { session, isUser, logout, updateSessionProfile } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab]           = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [fetchErr, setFetchErr] = useState('')

  useEffect(() => {
    if (!isUser) { navigate('/login'); return }
    fetchBookings()
  }, [isUser])

  const fetchBookings = async () => {
    setLoading(true); setFetchErr('')
    try {
      const res = await getBookingsByEmail(session.email)
      if (res.ok) setBookings(res.data || [])
      else setFetchErr(res.error || 'Failed to load bookings')
    } catch { setFetchErr('Could not connect. Check your internet.') }
    finally { setLoading(false) }
  }

  const handleLogout = () => { logout(); navigate('/') }

  if (!isUser) return null

  const initials = (session.name || 'U').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

  const tabs = [
    { id: 'bookings', label: 'My Bookings', icon: Package },
    { id: 'profile',  label: 'My Profile',  icon: User },
  ]

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-mango-400 to-mango-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {initials}
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Welcome back</p>
                <h1 className="text-xl font-bold text-gray-900">{session.name || 'Customer'}</h1>
                <p className="text-sm text-gray-500">{session.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/booking" className="hidden sm:flex items-center gap-2 text-sm btn-primary py-2 px-4">
                Book Another Tree <ArrowRight size={14} />
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-2 text-sm px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-colors">
                <LogOut size={15} /> Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  tab === t.id ? 'bg-mango-50 text-mango-700 border border-mango-200' : 'text-gray-500 hover:bg-gray-100'
                }`}>
                <t.icon size={15} /> {t.label}
                {t.id === 'bookings' && bookings.length > 0 && (
                  <span className="ml-1 bg-mango-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {bookings.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {tab === 'bookings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-gray-900 text-lg">
                {bookings.length > 0 ? `${bookings.length} Booking${bookings.length > 1 ? 's' : ''}` : 'My Bookings'}
              </h2>
              <button onClick={fetchBookings} disabled={loading}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-mango-600 font-medium transition-colors">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 size={32} className="animate-spin mb-3" />
                <p className="text-sm">Loading your bookings…</p>
              </div>
            ) : fetchErr ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-red-500 font-medium mb-2">{fetchErr}</p>
                <button onClick={fetchBookings} className="text-sm text-mango-600 underline">Try again</button>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <div className="text-5xl mb-4">🥭</div>
                <h3 className="font-bold text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-500 text-sm mb-6">Pre-book a Keshar mango tree for Season 2026!</p>
                <Link to="/booking" className="btn-primary inline-flex items-center gap-2">
                  Book a Tree <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {bookings.map((b, i) => <BookingCard key={b.booking_id || i} b={b} />)}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div>
            <h2 className="font-bold text-gray-900 text-lg mb-6">My Profile</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <ProfileTab session={session} onUpdate={updateSessionProfile} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
