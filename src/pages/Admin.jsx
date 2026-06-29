import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, Package, Users, CreditCard, LogOut, Search, RefreshCw, Loader2,
  TrendingUp, TreePine, IndianRupee, ChevronLeft, ChevronRight,
  ShieldCheck, Eye, EyeOff, Key, CheckCircle, X, UserPlus, Edit2, XCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  getAllBookings, getAllUsersAdmin, getAllPayments, getAdmins,
  confirmPayment, cancelPayment, adminChangePassword, addAdmin as addAdminApi,
  updateBooking, updateUser, updateAdmin,
} from '../utils/sheets'
import { hashPassword } from '../utils/auth'
import { TREE_STATS } from '../data/trees'

const PAGE_SIZE = 15

// ── Helpers ───────────────────────────────────────────────────────────────────
function Badge({ value }) {
  const s = String(value || '').toLowerCase()
  const cls = s.includes('verified') || s.includes('paid')
    ? 'bg-green-100 text-green-700'
    : s.includes('pending') || s.includes('submitted')
    ? 'bg-amber-100 text-amber-700'
    : 'bg-gray-100 text-gray-500'
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{value || '—'}</span>
}

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Paginated table ───────────────────────────────────────────────────────────
function DataTable({ columns, rows, searchKeys, emptyMsg }) {
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter((r) => searchKeys.some((k) => String(r[k] || '').toLowerCase().includes(q)))
  }, [rows, search, searchKeys])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const slice      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <div className="relative mb-4 max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search…"
          className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mango-400"
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {slice.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400 text-sm">{emptyMsg}</td></tr>
            ) : slice.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {c.render ? c.render(row[c.key], row) : String(row[c.key] || '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
        <span>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span>Page {page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Change Password modal ─────────────────────────────────────────────────────
function ChangePasswordModal({ target, userType, onClose, onSuccess }) {
  const [password, setPassword] = useState('')
  const [show,     setShow]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSave = async () => {
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    try {
      const newPasswordHash = userType === 'user' ? await hashPassword(password) : undefined
      const res = await adminChangePassword({
        identifier:      target,
        newPassword:     password,
        newPasswordHash: newPasswordHash,
        userType,
      })
      if (!res.ok) { setError(res.error || 'Failed to update password'); return }
      onSuccess()
    } catch { setError('Something went wrong.') }
    finally { setLoading(false) }
  }

  return (
    <Modal title={`Change Password — ${target}`} onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4">
        {userType === 'admin' ? 'Admin username' : 'User email'}: <strong>{target}</strong>
      </p>
      <div className="relative mb-4">
        <input
          type={show ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (min 6 chars)"
          className="input-field pr-10"
        />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2 mb-4">{error}</p>}
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors">
          {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Key size={14} /> Update Password</>}
        </button>
      </div>
    </Modal>
  )
}

// ── View Password modal ───────────────────────────────────────────────────────
function ViewPasswordModal({ target, password, onClose }) {
  const [visible, setVisible] = useState(false)
  return (
    <Modal title={`Password — ${target}`} onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4">Stored plaintext password for this account:</p>
      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
        <span className="flex-1 font-mono text-gray-900 text-sm">
          {visible ? (password || '(empty)') : '••••••••'}
        </span>
        <button onClick={() => setVisible(!visible)} className="text-gray-400 hover:text-gray-600 transition-colors">
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <button onClick={onClose} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Close</button>
    </Modal>
  )
}

// ── Add Admin modal ───────────────────────────────────────────────────────────
function AddAdminModal({ addedBy, onClose, onSuccess }) {
  const [form, setForm]     = useState({ username: '', name: '', email: '', password: '' })
  const [show, setShow]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleAdd = async () => {
    if (!form.username || !form.password) { setError('Username and password are required.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    try {
      const res = await addAdminApi({ ...form, addedBy })
      if (!res.ok) { setError(res.error || 'Failed to add admin'); return }
      onSuccess()
    } catch { setError('Something went wrong.') }
    finally { setLoading(false) }
  }

  return (
    <Modal title="Add New Admin" onClose={onClose}>
      <div className="space-y-3 mb-4">
        <input name="username" value={form.username} onChange={set} placeholder="Username *" className="input-field" />
        <input name="name"     value={form.name}     onChange={set} placeholder="Full Name"  className="input-field" />
        <input name="email"    value={form.email}    onChange={set} placeholder="Email"       className="input-field" type="email" />
        <div className="relative">
          <input name="password" type={show ? 'text' : 'password'} value={form.password} onChange={set} placeholder="Password * (min 6 chars)" className="input-field pr-10" />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2 mb-4">{error}</p>}
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={handleAdd} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-mango-500 hover:bg-mango-600 text-white rounded-xl text-sm font-semibold transition-colors">
          {loading ? <><Loader2 size={14} className="animate-spin" /> Adding…</> : <><UserPlus size={14} /> Add Admin</>}
        </button>
      </div>
    </Modal>
  )
}

const PAYMENT_STATUSES = [
  'Payment Submitted – Pending Verification',
  'Verified & Confirmed ✓',
  'Cancelled by Admin',
  'Payment Failed',
]

// ── Generic Edit Record modal ─────────────────────────────────────────────────
function EditRecordModal({ type, row, onClose, onSuccess }) {
  const FIELDS = {
    booking: [
      { key: 'name',           label: 'Customer Name' },
      { key: 'email',          label: 'Email' },
      { key: 'phone',          label: 'Phone' },
      { key: 'city',           label: 'City' },
      { key: 'tree_ids',       label: 'Tree IDs (comma separated)' },
      { key: 'tree_count',     label: 'Tree Count' },
      { key: 'package_name',   label: 'Package Name' },
      { key: 'amount_paid',    label: 'Amount Paid' },
      { key: 'txn_id',         label: 'Transaction ID' },
      { key: 'notes',          label: 'Notes' },
      { key: 'payment_status', label: 'Payment Status', type: 'select', options: PAYMENT_STATUSES },
    ],
    user: [
      { key: 'name',    label: 'Full Name' },
      { key: 'phone',   label: 'Phone' },
      { key: 'city',    label: 'City' },
      { key: 'address', label: 'Address' },
    ],
    admin: [
      { key: 'name',  label: 'Full Name' },
      { key: 'email', label: 'Email' },
    ],
  }
  const ID_FIELD = { booking: 'booking_id', user: 'email', admin: 'username' }

  const [form,    setForm]    = useState(() => {
    const f = {}
    ;(FIELDS[type] || []).forEach(({ key }) => { f[key] = row[key] || '' })
    return f
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const apiMap = { booking: updateBooking, user: updateUser, admin: updateAdmin }

  const handleSave = async () => {
    setError(''); setLoading(true)
    try {
      const idKey = ID_FIELD[type]
      const res = await apiMap[type]({ [idKey]: row[idKey], ...form })
      if (!res.ok) { setError(res.error || 'Failed to save changes'); return }
      onSuccess()
    } catch { setError('Something went wrong.') }
    finally { setLoading(false) }
  }

  const fields = FIELDS[type] || []
  const idKey  = ID_FIELD[type]

  return (
    <Modal title={`Edit ${type.charAt(0).toUpperCase() + type.slice(1)} — ${row[idKey]}`} onClose={onClose}>
      <p className="text-xs text-gray-400 mb-4 font-mono">{idKey}: <strong>{row[idKey]}</strong></p>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {fields.map(({ key, label, type: ftype, options }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-500 mb-0.5">{label}</label>
            {ftype === 'select' ? (
              <select name={key} value={form[key]} onChange={set}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mango-400 bg-white">
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input name={key} value={form[key]} onChange={set} className="input-field text-sm" />
            )}
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2 mt-4">{error}</p>}
      <div className="flex gap-3 mt-5">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-mango-500 hover:bg-mango-600 text-white rounded-xl text-sm font-semibold transition-colors">
          {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><CheckCircle size={14} /> Save Changes</>}
        </button>
      </div>
    </Modal>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Admin() {
  const { session, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const [tab,      setTab]      = useState('overview')
  const [bookings, setBookings] = useState([])
  const [users,    setUsers]    = useState([])
  const [payments, setPayments] = useState([])
  const [admins,   setAdmins]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [fetchErr, setFetchErr] = useState('')

  // Modals
  const [changePasswordModal, setChangePasswordModal] = useState(null) // {target, userType}
  const [viewPasswordModal,   setViewPasswordModal]   = useState(null) // {target, password}
  const [showAddAdmin,        setShowAddAdmin]         = useState(false)
  const [confirmingId,        setConfirmingId]         = useState(null) // bookingId being confirmed
  const [cancellingId,        setCancellingId]         = useState(null)
  const [editModal,           setEditModal]            = useState(null) // {type:'booking'|'user'|'admin', row}

  useEffect(() => {
    if (!isAdmin) { navigate('/login'); return }
    fetchAll()
  }, [isAdmin])

  const fetchAll = async () => {
    setLoading(true); setFetchErr('')
    try {
      const [bRes, uRes, pRes, aRes] = await Promise.all([
        getAllBookings(), getAllUsersAdmin(), getAllPayments(), getAdmins(),
      ])
      if (bRes.ok) setBookings(bRes.data || [])
      if (uRes.ok) setUsers(uRes.data || [])
      if (pRes.ok) setPayments(pRes.data || [])
      if (aRes.ok) setAdmins(aRes.data || [])
      if (!bRes.ok && !uRes.ok) setFetchErr(bRes.error || 'Failed to load data')
    } catch { setFetchErr('Could not connect to Google Sheets. Check the Script URL.') }
    finally { setLoading(false) }
  }

  const handleCancelPayment = async (bookingId) => {
    setCancellingId(bookingId)
    try {
      const res = await cancelPayment({ bookingId })
      if (res.ok) {
        const status = 'Cancelled by Admin'
        const upd = (arr) => arr.map((r) => r.booking_id === bookingId ? { ...r, payment_status: status } : r)
        setBookings(upd); setPayments(upd)
      }
    } catch { /* ignore */ }
    finally { setCancellingId(null) }
  }

  const handleConfirmPayment = async (bookingId) => {
    setConfirmingId(bookingId)
    try {
      const res = await confirmPayment({ bookingId })
      if (res.ok) {
        // Update both bookings and payments in state immediately
        const updateStatus = (arr) => arr.map((r) =>
          r.booking_id === bookingId ? { ...r, payment_status: 'Verified & Confirmed ✓' } : r
        )
        setBookings(updateStatus)
        setPayments((arr) => arr.map((r) =>
          r.booking_id === bookingId ? { ...r, payment_status: 'Verified & Confirmed ✓' } : r
        ))
      }
    } catch { /* ignore */ }
    finally { setConfirmingId(null) }
  }

  const totalRevenue  = useMemo(() => bookings.reduce((s, b) => s + Number(b.amount_paid || 0), 0), [bookings])
  const verifiedCount = useMemo(() => payments.filter((p) => String(p.payment_status || '').toLowerCase().includes('verified')).length, [payments])

  if (!isAdmin) return null

  const navItems = [
    { id: 'overview', label: 'Overview',  icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings',  icon: Package,    badge: bookings.length },
    { id: 'users',    label: 'Users',     icon: Users,      badge: users.length },
    { id: 'payments', label: 'Payments',  icon: CreditCard, badge: payments.length },
    { id: 'admins',   label: 'Admins',    icon: ShieldCheck, badge: admins.length },
  ]

  // ── Column definitions ──────────────────────────────────────────────────────
  const bookingCols = [
    { key: 'timestamp',      label: 'Date',      render: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'booking_id',     label: 'Booking ID', render: (v) => <span className="font-mono font-bold text-xs">{v || '—'}</span> },
    { key: 'name',           label: 'Name' },
    { key: 'email',          label: 'Email' },
    { key: 'tree_ids',       label: 'Trees',     render: (v) => <span className="font-mono text-xs text-mango-700">{v || '—'}</span> },
    { key: 'package_name',   label: 'Package' },
    { key: 'amount_paid',    label: 'Amount',    render: (v) => v ? `₹${Number(v).toLocaleString('en-IN')}` : '—' },
    { key: 'txn_id',         label: 'TXN ID',    render: (v) => <span className="font-mono text-xs">{v || '—'}</span> },
    { key: 'payment_status', label: 'Status',    render: (v) => <Badge value={v} /> },
    {
      key: '_actions', label: '',
      render: (_, row) => (
        <button onClick={() => setEditModal({ type: 'booking', row })}
          className="text-gray-400 hover:text-mango-500 transition-colors" title="Edit booking">
          <Edit2 size={13} />
        </button>
      ),
    },
  ]

  const userCols = [
    { key: 'timestamp',    label: 'Joined',    render: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'name',         label: 'Name' },
    { key: 'email',        label: 'Email' },
    { key: 'phone',        label: 'Phone' },
    { key: 'city',         label: 'City' },
    {
      key: 'password_plain', label: 'Password',
      render: (v, row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-gray-400">{v ? '••••••' : '—'}</span>
          {v && (
            <button onClick={() => setViewPasswordModal({ target: row.email, password: v })}
              className="text-blue-500 hover:text-blue-600 transition-colors" title="View password">
              <Eye size={13} />
            </button>
          )}
          <button onClick={() => setChangePasswordModal({ target: row.email, userType: 'user' })}
            className="text-mango-500 hover:text-mango-600 transition-colors" title="Change password">
            <Key size={13} />
          </button>
        </div>
      ),
    },
    { key: 'updated_at',   label: 'Updated',   render: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    {
      key: '_actions', label: '',
      render: (_, row) => (
        <button onClick={() => setEditModal({ type: 'user', row })}
          className="text-gray-400 hover:text-mango-500 transition-colors" title="Edit user">
          <Edit2 size={13} />
        </button>
      ),
    },
  ]

  const paymentCols = [
    { key: 'timestamp',      label: 'Date',      render: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'booking_id',     label: 'Booking ID', render: (v) => <span className="font-mono font-bold text-xs">{v || '—'}</span> },
    { key: 'name',           label: 'Name' },
    { key: 'email',          label: 'Email' },
    { key: 'tree_ids',       label: 'Trees',     render: (v) => <span className="font-mono text-xs text-mango-700">{v || '—'}</span> },
    { key: 'amount',         label: 'Amount',    render: (v) => v ? `₹${Number(v).toLocaleString('en-IN')}` : '—' },
    { key: 'txn_id',         label: 'TXN ID',    render: (v) => <span className="font-mono text-xs">{v || '—'}</span> },
    {
      key: 'payment_status', label: 'Status',
      render: (v, row) => {
        const verified   = String(v || '').toLowerCase().includes('verified')
        const cancelled  = String(v || '').toLowerCase().includes('cancel')
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge value={v} />
            {!verified && !cancelled && (
              <>
                <button
                  onClick={() => handleConfirmPayment(row.booking_id)}
                  disabled={confirmingId === row.booking_id || cancellingId === row.booking_id}
                  className="flex items-center gap-1 text-xs font-semibold bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  {confirmingId === row.booking_id
                    ? <><Loader2 size={11} className="animate-spin" /> Confirming…</>
                    : <><CheckCircle size={11} /> Confirm</>}
                </button>
                <button
                  onClick={() => handleCancelPayment(row.booking_id)}
                  disabled={cancellingId === row.booking_id || confirmingId === row.booking_id}
                  className="flex items-center gap-1 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  {cancellingId === row.booking_id
                    ? <><Loader2 size={11} className="animate-spin" /> Cancelling…</>
                    : <><XCircle size={11} /> Cancel</>}
                </button>
              </>
            )}
          </div>
        )
      },
    },
  ]

  const adminCols = [
    { key: 'timestamp',  label: 'Added',     render: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'username',   label: 'Username',  render: (v) => <span className="font-mono font-bold">{v || '—'}</span> },
    { key: 'name',       label: 'Name' },
    { key: 'email',      label: 'Email' },
    { key: 'added_by',   label: 'Added By' },
    {
      key: 'password_plain', label: 'Password',
      render: (v, row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-gray-400">{v ? '••••••' : '—'}</span>
          {v && (
            <button onClick={() => setViewPasswordModal({ target: row.username, password: v })}
              className="text-blue-500 hover:text-blue-600 transition-colors" title="View password">
              <Eye size={13} />
            </button>
          )}
          {row.username !== 'mangoOnRent' && (
            <button onClick={() => setChangePasswordModal({ target: row.username, userType: 'admin' })}
              className="text-mango-500 hover:text-mango-600 transition-colors" title="Change password">
              <Key size={13} />
            </button>
          )}
        </div>
      ),
    },
    {
      key: '_actions', label: '',
      render: (_, row) => row.username !== 'mangoOnRent' ? (
        <button onClick={() => setEditModal({ type: 'admin', row })}
          className="text-gray-400 hover:text-mango-500 transition-colors" title="Edit admin">
          <Edit2 size={13} />
        </button>
      ) : null,
    },
  ]

  return (
    <div className="pt-16 min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-gray-900 text-white fixed top-16 bottom-0 left-0 z-30">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-mango-500 flex items-center justify-center text-sm font-bold">A</div>
            <div>
              <p className="text-xs font-bold text-white">Admin Panel</p>
              <p className="text-xs text-gray-400 truncate">{session?.name || 'Admin'}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === item.id ? 'bg-mango-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <span className="flex items-center gap-2.5"><item.icon size={16} /> {item.label}</span>
              {item.badge > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === item.id ? 'bg-white/20 text-white' : 'bg-gray-700 text-gray-300'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800 space-y-1">
          <button onClick={fetchAll} disabled={loading}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all font-medium">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh Data
          </button>
          <Link to="/" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all font-medium">
            <ChevronLeft size={15} /> Back to Site
          </Link>
          <button onClick={() => { logout(); navigate('/') }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-900/20 transition-all font-medium">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-30 bg-gray-900 flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                tab === item.id ? 'bg-mango-500 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              <item.icon size={13} /> {item.label}
            </button>
          ))}
        </div>
        <button onClick={() => { logout(); navigate('/') }} className="ml-3 text-gray-400 hover:text-red-400 shrink-0">
          <LogOut size={16} />
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pt-12 md:pt-0 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {tab === 'overview' ? 'Dashboard Overview' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">MangoOnRent Admin · Season 2026</p>
          </div>
          <button onClick={fetchAll} disabled={loading}
            className="hidden md:flex items-center gap-2 text-sm px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <Loader2 size={36} className="animate-spin mb-3" />
            <p>Loading data from Google Sheets…</p>
          </div>
        ) : fetchErr ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-semibold mb-1">Failed to load data</p>
            <p className="text-red-500 text-sm mb-4">{fetchErr}</p>
            <button onClick={fetchAll} className="text-sm text-mango-600 underline">Try again</button>
          </div>
        ) : (
          <>
            {/* Overview */}
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Bookings"    value={bookings.length}                                color="bg-mango-500" icon={Package}      />
                  <StatCard label="Revenue Collected" value={`₹${totalRevenue.toLocaleString('en-IN')}`}    color="bg-leaf-500"  icon={IndianRupee}  sub="Pre-book amounts" />
                  <StatCard label="Registered Users"  value={users.length}                                  color="bg-blue-500"  icon={Users}        />
                  <StatCard label="Trees Available"   value={TREE_STATS.available}                          color="bg-amber-500" icon={TreePine}      sub={`of ${TREE_STATS.total} total`} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900">Recent Bookings</h3>
                      <button onClick={() => setTab('bookings')} className="text-xs text-mango-600 hover:underline font-medium">View all</button>
                    </div>
                    {bookings.slice(-5).reverse().map((b, i) => (
                      <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 text-sm">
                        <div>
                          <p className="font-semibold text-gray-800">{b.name || '—'}</p>
                          <p className="text-xs text-gray-400 font-mono">{b.booking_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-mango-600">₹{Number(b.amount_paid || 0).toLocaleString('en-IN')}</p>
                          <Badge value={b.payment_status} />
                        </div>
                      </div>
                    ))}
                    {bookings.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No bookings yet</p>}
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
                    {[
                      { label: 'Payments Verified',  value: verifiedCount },
                      { label: 'Payments Pending',   value: payments.length - verifiedCount },
                      { label: 'Trees Booked',       value: TREE_STATS.rented },
                      { label: 'Admin Accounts',     value: admins.length },
                      { label: 'Avg. Booking Value', value: bookings.length ? `₹${Math.round(totalRevenue / bookings.length).toLocaleString('en-IN')}` : '—' },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 text-sm">
                        <span className="text-gray-600">{s.label}</span>
                        <span className="font-bold text-gray-900">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bookings */}
            {tab === 'bookings' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <DataTable columns={bookingCols} rows={[...bookings].reverse()} searchKeys={['name','email','booking_id','tree_ids','phone']} emptyMsg="No bookings found" />
              </div>
            )}

            {/* Users */}
            {tab === 'users' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <DataTable columns={userCols} rows={[...users].reverse()} searchKeys={['name','email','phone','city']} emptyMsg="No registered users yet" />
              </div>
            )}

            {/* Payments */}
            {tab === 'payments' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-400 mb-4">Click <strong>Confirm</strong> to verify a payment — customer will receive an email notification.</p>
                <DataTable columns={paymentCols} rows={[...payments].reverse()} searchKeys={['name','email','booking_id','txn_id']} emptyMsg="No payments found" />
              </div>
            )}

            {/* Admins */}
            {tab === 'admins' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Manage admin accounts. The default admin (mangoOnRent) always exists.</p>
                  <button onClick={() => setShowAddAdmin(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-mango-500 hover:bg-mango-600 text-white text-sm font-semibold rounded-xl transition-colors">
                    <UserPlus size={15} /> Add Admin
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <DataTable columns={adminCols} rows={admins} searchKeys={['username','name','email','added_by']} emptyMsg="No admins found" />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {changePasswordModal && (
        <ChangePasswordModal
          target={changePasswordModal.target}
          userType={changePasswordModal.userType}
          onClose={() => setChangePasswordModal(null)}
          onSuccess={() => { setChangePasswordModal(null); fetchAll() }}
        />
      )}
      {viewPasswordModal && (
        <ViewPasswordModal
          target={viewPasswordModal.target}
          password={viewPasswordModal.password}
          onClose={() => setViewPasswordModal(null)}
        />
      )}
      {showAddAdmin && (
        <AddAdminModal
          addedBy={session?.username || 'admin'}
          onClose={() => setShowAddAdmin(false)}
          onSuccess={() => { setShowAddAdmin(false); fetchAll() }}
        />
      )}
      {editModal && (
        <EditRecordModal
          type={editModal.type}
          row={editModal.row}
          onClose={() => setEditModal(null)}
          onSuccess={() => { setEditModal(null); fetchAll() }}
        />
      )}
    </div>
  )
}
