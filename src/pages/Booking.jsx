import { useState, useMemo, useEffect } from 'react'
import { CheckCircle, Loader2, ArrowRight, ArrowLeft, Copy, QrCode, Search, Shuffle, X, LogIn, UserPlus } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { PACKAGES, SITE, PRICING } from '../config/siteConfig'
import { trees } from '../data/trees'
import { submitBooking, getAllBookings } from '../utils/sheets'
import { img } from '../config/images'
import { useAuth } from '../context/AuthContext'

const UPI_ID = SITE.upiId
const STATIC_BOOKED = new Set(trees.filter((t) => t.isRented).map((t) => t.id))

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ['Details', 'Payment', 'Confirmed']
  const idx = { details: 0, payment: 1, success: 2 }[step]
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            i === idx ? 'bg-mango-500 text-white shadow-md'
              : i < idx ? 'bg-leaf-500 text-white'
              : 'bg-gray-100 text-gray-400'
          }`}>
            {i < idx ? <CheckCircle size={14} /> : <span>{i + 1}</span>}
            {label}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-0.5 ${i < idx ? 'bg-leaf-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Package radio option ──────────────────────────────────────────────────────
function PackageOption({ pkg, selected, onSelect }) {
  const canBook = pkg.status === 'available'
  const isContact = pkg.status === 'contact'
  const disabled = pkg.status === 'out_of_stock'
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => (canBook || isContact) && onSelect(pkg.id)}
      className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50'
          : selected ? 'border-mango-500 bg-mango-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-mango-300 hover:bg-mango-50/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900">{pkg.name}</span>
            {pkg.highlight && <span className="text-xs bg-leaf-100 text-leaf-700 px-2 py-0.5 rounded-full font-semibold">Popular</span>}
          </div>
          {pkg.fullPrice ? (
            <div className="text-mango-600 font-bold text-lg">
              ₹{pkg.fullPrice.toLocaleString('en-IN')}
              <span className="text-xs text-gray-400 font-normal ml-1">/season</span>
            </div>
          ) : (
            <div className="text-mango-600 font-bold">Custom Pricing</div>
          )}
          <div className="text-xs text-leaf-600 font-semibold mt-0.5">Pre-book for ₹{pkg.prebookPrice.toLocaleString('en-IN')}</div>
          <div className="text-xs text-gray-500 mt-1">{pkg.features.slice(0, 2).join(' · ')}</div>
        </div>
        <div className="shrink-0 mt-1">
          {disabled ? (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Unavailable</span>
          ) : isContact ? (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Contact</span>
          ) : selected ? (
            <CheckCircle size={22} className="text-mango-500" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
          )}
        </div>
      </div>
    </button>
  )
}

// ── Multi-tree selector ───────────────────────────────────────────────────────
function TreeSelector({ treeMode, selectedTrees, availableTrees, onModeChange, onToggleTree, onClearTrees }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toUpperCase().trim()
    return q ? availableTrees.filter((t) => t.id.includes(q)) : availableTrees
  }, [search, availableTrees])

  const selectedSet = useMemo(() => new Set(selectedTrees), [selectedTrees])
  const firstAvailableId = availableTrees[0]?.id ?? '—'

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onModeChange('auto')}
          className={`rounded-2xl border-2 p-4 text-left transition-all ${
            treeMode === 'auto'
              ? 'border-mango-500 bg-mango-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-mango-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${treeMode === 'auto' ? 'bg-mango-500' : 'bg-gray-100'}`}>
              <Shuffle size={18} className={treeMode === 'auto' ? 'text-white' : 'text-gray-500'} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-sm">Auto-assign</div>
              <div className="text-xs text-gray-500 mt-0.5">We assign trees in sequence based on quantity</div>
              {treeMode === 'auto' && (
                <div className="text-xs text-mango-600 font-semibold mt-1">→ Starts from: {firstAvailableId}</div>
              )}
            </div>
            <div className="shrink-0">
              {treeMode === 'auto'
                ? <CheckCircle size={20} className="text-mango-500" />
                : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('custom')}
          className={`rounded-2xl border-2 p-4 text-left transition-all ${
            treeMode === 'custom'
              ? 'border-mango-500 bg-mango-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-mango-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${treeMode === 'custom' ? 'bg-mango-500' : 'bg-gray-100'}`}>
              <span className="text-lg">🌳</span>
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-sm">Choose My Trees</div>
              <div className="text-xs text-gray-500 mt-0.5">Pick one or more specific tree IDs</div>
              {treeMode === 'custom' && selectedTrees.length > 0 && (
                <div className="text-xs text-mango-600 font-semibold mt-1">
                  {selectedTrees.length} tree{selectedTrees.length > 1 ? 's' : ''} selected
                </div>
              )}
            </div>
            <div className="shrink-0">
              {treeMode === 'custom'
                ? <CheckCircle size={20} className="text-mango-500" />
                : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
            </div>
          </div>
        </button>
      </div>

      {/* Custom tree picker */}
      {treeMode === 'custom' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          {/* Selected chips */}
          {selectedTrees.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-gray-600">
                  Selected ({selectedTrees.length}) — Total: ₹{(selectedTrees.length * PRICING.prebookAmount).toLocaleString('en-IN')}
                </p>
                <button type="button" onClick={onClearTrees} className="text-xs text-red-500 hover:text-red-600 font-medium">
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedTrees.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 bg-mango-100 text-mango-800 text-xs font-mono font-bold px-2 py-1 rounded-lg"
                  >
                    {id}
                    <button type="button" onClick={() => onToggleTree(id)} className="text-mango-500 hover:text-mango-700 ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tree ID… e.g. MGO-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mango-400"
            />
          </div>

          <p className="text-xs text-gray-400 mb-3">
            {filtered.length} available {search && `matching "${search.toUpperCase()}"`} · Tap to select / deselect
          </p>

          {/* Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-56 overflow-y-auto pr-1">
            {filtered.slice(0, 200).map((t) => {
              const isSelected = selectedSet.has(t.id)
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onToggleTree(t.id)}
                  className={`relative text-xs font-mono py-1.5 px-1 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-mango-500 text-white border-mango-500 shadow-md font-bold'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-mango-400 hover:bg-mango-50'
                  }`}
                >
                  {t.id.replace('MGO-', '')}
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-leaf-500 rounded-full flex items-center justify-center">
                      <CheckCircle size={8} className="text-white" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {selectedTrees.length === 0 && (
            <p className="text-xs text-amber-600 mt-3 font-medium">⚠ Please select at least one tree to continue</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Order summary sidebar ─────────────────────────────────────────────────────
function OrderSummary({ pkg, treeCount, amount, bookingId, treeIds, treeMode }) {
  return (
    <div className="sticky top-24 space-y-4">
      <div className="bg-mango-50 rounded-2xl p-6 border border-mango-100">
        <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
        {pkg && (
          <>
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-600">{pkg.name}</span>
              <span className="font-semibold">₹{PRICING.prebookAmount.toLocaleString('en-IN')} × {treeCount}</span>
            </div>

            {/* Tree IDs */}
            {treeIds.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1">
                  {treeMode === 'auto' ? 'Auto-assigned from' : 'Selected trees'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {treeIds.map((id) => (
                    <span key={id} className="text-[10px] font-mono bg-white border border-mango-200 text-mango-700 font-bold px-1.5 py-0.5 rounded">
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between border-t border-mango-200 pt-3 mt-3">
              <span className="font-bold text-gray-900">Total (Pre-book)</span>
              <span className="font-extrabold text-mango-600 text-lg">₹{amount.toLocaleString('en-IN')}</span>
            </div>

            {bookingId && (
              <div className="mt-3 pt-3 border-t border-mango-200 text-xs text-gray-500">
                Booking ID: <span className="font-mono font-bold text-gray-700">{bookingId}</span>
              </div>
            )}

            <div className="mt-4 border-t border-mango-200 pt-4">
              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Includes:</p>
              <ul className="space-y-1.5">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle size={12} className="text-leaf-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2.5">
        {['✅ Secure UPI payment', '📞 Confirmation within 24 hrs', '🥭 Delivery Mar–Jun 2026', '🔄 Full refund if season fails'].map((t) => (
          <p key={t} className="text-xs text-gray-600">{t}</p>
        ))}
      </div>
    </div>
  )
}

// ── Login gate ────────────────────────────────────────────────────────────────
function LoginGate() {
  const [searchParams] = useSearchParams()
  const redirect = `/booking${searchParams.toString() ? '?' + searchParams.toString() : ''}`
  return (
    <div className="py-24 flex items-center justify-center bg-gray-50 min-h-[60vh]">
      <div className="max-w-md w-full mx-auto px-6 text-center">
        <div className="text-6xl mb-4">🥭</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Required</h2>
        <p className="text-gray-500 mb-8">
          Please log in or create a free account to book and track your mango trees.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            <LogIn size={16} /> Sign In
          </Link>
          <Link
            to={`/login?tab=register&redirect=${encodeURIComponent(redirect)}`}
            className="flex items-center justify-center gap-2 px-6 py-3 btn-primary text-sm"
          >
            <UserPlus size={16} /> Create Free Account
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-6">
          Already logged in?{' '}
          <button onClick={() => window.location.reload()} className="text-mango-600 underline">Refresh this page</button>
        </p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Booking() {
  const [searchParams] = useSearchParams()
  const preselectedTree = searchParams.get('tree')
  const { session, isUser } = useAuth()

  const [form, setForm] = useState({
    name:          session?.name    || '',
    email:         session?.email   || '',
    phone:         session?.phone   || '',
    city:          session?.city    || '',
    address:       session?.address || '',
    pincode: '', autoTreeCount: '1', package_id: 'standard', notes: '',
    treeMode: preselectedTree ? 'custom' : 'auto',
    selectedTrees: preselectedTree ? [preselectedTree] : [],
  })
  const [step, setStep]                 = useState('details')
  const [txnId, setTxnId]               = useState('')
  const [screenshot, setScreenshot]     = useState(null)   // base64 data URL
  const [screenshotName, setScreenshotName] = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState('')
  const [copied, setCopied]             = useState(false)
  const [qrMissing, setQrMissing]       = useState(false)

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Screenshot must be under 10 MB.'); return }
    setScreenshotName(file.name)
    // Compress to max 1200px / JPEG 75% so base64 stays small enough for Apps Script
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1200
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        setScreenshot(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const [liveBookedIds, setLiveBookedIds] = useState(STATIC_BOOKED)

  useEffect(() => {
    // Load localStorage booked trees immediately
    const localSet = new Set(STATIC_BOOKED)
    try {
      const stored = JSON.parse(localStorage.getItem('mor_booked_trees') || '{}')
      Object.keys(stored).forEach((id) => localSet.add(id))
    } catch { /* ignore */ }
    setLiveBookedIds(new Set(localSet))

    // Then merge real bookings from spreadsheet (includes pending)
    getAllBookings().then((res) => {
      if (res.ok && Array.isArray(res.data)) {
        res.data.forEach((b) => {
          const status = String(b.payment_status || '').toLowerCase()
          if (status.includes('cancel') || status.includes('failed')) return
          String(b.tree_ids || '').split(',').forEach((id) => {
            const t = id.trim(); if (t) localSet.add(t)
          })
        })
      }
      setLiveBookedIds(new Set(localSet))
    }).catch(() => {})
  }, [])

  const liveAvailableTrees = useMemo(
    () => trees.filter((t) => !liveBookedIds.has(t.id)),
    [liveBookedIds]
  )

  const [bookingId] = useState(() => `BK-${Date.now().toString(36).toUpperCase()}`)

  const selectedPkg = PACKAGES.find((p) => p.id === form.package_id)

  // In custom mode the count comes from the selection; in auto mode it's the dropdown
  const treeCount = form.treeMode === 'custom'
    ? form.selectedTrees.length
    : parseInt(form.autoTreeCount || 1)

  const totalAmount = PRICING.prebookAmount * Math.max(treeCount, 1)

  // The tree IDs shown everywhere: custom = picked array, auto = sequential starting from first live-available
  const resolvedTreeIds = useMemo(() => {
    if (form.treeMode === 'custom') return form.selectedTrees
    const count = parseInt(form.autoTreeCount || 1)
    return liveAvailableTrees.slice(0, count).map((t) => t.id)
  }, [form.treeMode, form.selectedTrees, form.autoTreeCount, liveAvailableTrees])

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleModeChange = (mode) => {
    setForm((f) => ({ ...f, treeMode: mode, selectedTrees: mode === 'auto' ? [] : f.selectedTrees }))
  }

  const handleToggleTree = (id) => {
    setForm((f) => {
      const set = new Set(f.selectedTrees)
      set.has(id) ? set.delete(id) : set.add(id)
      return { ...f, selectedTrees: [...set] }
    })
  }

  const handleClearTrees = () => setForm((f) => ({ ...f, selectedTrees: [] }))

  const handleDetailsSubmit = (e) => {
    e.preventDefault()
    if (form.treeMode === 'custom' && form.selectedTrees.length === 0) {
      setError('Please select at least one tree or switch to Auto-assign.')
      return
    }
    setError('')
    setStep('payment')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    if (!txnId.trim()) {
      setError('Please enter your UPI Transaction ID / UTR number.')
      return
    }
    if (!screenshot) {
      setError('Please upload a screenshot of your payment.')
      return
    }
    setSubmitting(true)
    setError('')
    const treeIdsStr = resolvedTreeIds.join(', ')
    try {
      await submitBooking({
        booking_id:     bookingId,
        screenshot_base64: screenshot || '',
        tree_ids:       treeIdsStr,
        tree_count:     treeCount,
        tree_mode:      form.treeMode === 'auto' ? 'Auto-assigned' : 'Custom pick',
        name:           form.name,
        email:          form.email,
        phone:          form.phone,
        city:           form.city,
        package_id:     form.package_id,
        package_name:   selectedPkg?.name || form.package_id,
        amount_paid:    totalAmount,
        amount:         totalAmount,
        pincode:        form.pincode,
        address:        form.address,
        notes:          form.notes,
        txn_id:         txnId,
        payment_status: 'Payment Submitted – Pending Verification',
      })
      // Mark trees as booked immediately in localStorage so Trees page reflects it instantly
      try {
        const existing = JSON.parse(localStorage.getItem('mor_booked_trees') || '{}')
        resolvedTreeIds.forEach((id) => {
          existing[id] = { name: form.name, bookingId, ts: Date.now() }
        })
        localStorage.setItem('mor_booked_trees', JSON.stringify(existing))
      } catch { /* ignore */ }

      setStep('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Something went wrong. Please try again or WhatsApp us at ' + SITE.phone)
    } finally {
      setSubmitting(false)
    }
  }

  const copyUPI = () => {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const resetForm = () => {
    setForm({ name:'', email:'', phone:'', city:'', address:'', pincode:'', autoTreeCount:'1', package_id:'standard', notes:'', treeMode:'auto', selectedTrees:[] })
    setTxnId('')
    setStep('details')
  }

  if (!isUser) {
    return (
      <div className="pt-16">
        <section
          className="relative py-20 overflow-hidden"
          style={{ backgroundImage: `url('${img.booking}')`, backgroundSize: 'cover', backgroundPosition: 'center 60%' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-mango-900/80 via-mango-900/60 to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl">
              <p className="text-mango-300 font-semibold text-sm uppercase tracking-widest mb-3">Season {SITE.season}</p>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">Pre-book Your Mango Tree</h1>
            </div>
          </div>
        </section>
        <LoginGate />
      </div>
    )
  }

  return (
    <div className="pt-16">
      {/* Hero */}
      <section
        className="relative py-24 overflow-hidden"
        style={{ backgroundImage: `url('${img.booking}')`, backgroundSize: 'cover', backgroundPosition: 'center 60%' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-mango-900/80 via-mango-900/60 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <p className="text-mango-300 font-semibold text-sm uppercase tracking-widest mb-3">Season {SITE.season}</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Pre-book Your Mango Tree
            </h1>
            <p className="text-gray-200">
              Complete your booking in 3 steps — choose your trees, pay ₹1,000 per tree via UPI, and you're set!
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StepBar step={step} />

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <div className="max-w-lg mx-auto text-center py-10">
              <div className="text-7xl mb-4">🥭</div>
              <div className="w-20 h-20 bg-leaf-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={44} className="text-leaf-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
              <p className="text-gray-500 mb-4">Your payment is under verification. We'll confirm within 24 hours via WhatsApp.</p>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 text-left space-y-3 shadow-sm">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Booking ID</span>
                  <span className="font-mono font-bold text-gray-900">{bookingId}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500 block mb-1">Tree{resolvedTreeIds.length > 1 ? 's' : ''} ({resolvedTreeIds.length})</span>
                  <div className="flex flex-wrap gap-1">
                    {resolvedTreeIds.map((id) => (
                      <span key={id} className="font-mono font-bold text-mango-600 bg-mango-50 px-2 py-0.5 rounded text-xs">{id}</span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Package</span>
                  <span className="font-semibold">{selectedPkg?.name}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-3">
                  <span className="text-gray-500">Amount Paid</span>
                  <span className="font-bold text-mango-600 text-lg">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="font-mono text-gray-700">{txnId}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={resetForm} className="btn-secondary">Book More Trees</button>
                <a
                  href={`https://wa.me/${SITE.whatsapp}?text=Hi%21+Booking+ID%3A+${bookingId}+%7C+Trees%3A+${resolvedTreeIds.join('%2C+')}+%7C+Txn%3A+${txnId}`}
                  className="btn-primary"
                  target="_blank"
                  rel="noreferrer"
                >
                  Share on WhatsApp <ArrowRight size={16} />
                </a>
              </div>
            </div>
          )}

          {/* ── DETAILS FORM ── */}
          {step === 'details' && (
            <div className="grid lg:grid-cols-5 gap-10">
              <div className="lg:col-span-3">
                <form onSubmit={handleDetailsSubmit} data-netlify="true" name="booking" className="space-y-7">
                  <input type="hidden" name="form-name" value="booking" />

                  {/* 1. Package */}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">1. Choose Your Package</h2>
                    <p className="text-xs text-gray-400 mb-4">Pre-book any package for ₹1,000 per tree. Balance due at season start.</p>
                    <div className="space-y-3">
                      {PACKAGES.filter((p) => p.id !== 'corporate').map((pkg) => (
                        <PackageOption
                          key={pkg.id}
                          pkg={pkg}
                          selected={form.package_id === pkg.id}
                          onSelect={(id) => setForm((f) => ({ ...f, package_id: id }))}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      For Corporate Bundles (10+ trees), <Link to="/contact" className="text-mango-500 underline">contact us</Link>.
                    </p>
                  </div>

                  {/* 2. Tree selection */}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">2. Select Your Trees</h2>
                    <p className="text-xs text-gray-400 mb-4">
                      {liveAvailableTrees.length} trees available · Pick specific trees or let us assign.
                    </p>
                    <TreeSelector
                      treeMode={form.treeMode}
                      selectedTrees={form.selectedTrees}
                      availableTrees={liveAvailableTrees}
                      onModeChange={handleModeChange}
                      onToggleTree={handleToggleTree}
                      onClearTrees={handleClearTrees}
                    />
                  </div>

                  {/* 3. Personal info */}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">3. Your Details</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                        <input name="name" value={form.name} onChange={handleChange} required placeholder="Rajesh Kumar" className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                        <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="rajesh@email.com" className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone / WhatsApp *</label>
                        <input name="phone" value={form.phone} onChange={handleChange} required placeholder="+91 98765 43210" className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                        <input name="city" value={form.city} onChange={handleChange} required placeholder="Mumbai" className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {form.treeMode === 'custom' ? 'Number of Trees' : 'Number of Trees *'}
                        </label>
                        {form.treeMode === 'custom' ? (
                          <div className="input-field bg-gray-50 text-gray-500 cursor-not-allowed flex items-center justify-between">
                            <span>{form.selectedTrees.length} tree{form.selectedTrees.length !== 1 ? 's' : ''} selected</span>
                            <span className="font-bold text-mango-600">₹{totalAmount.toLocaleString('en-IN')}</span>
                          </div>
                        ) : (
                          <select
                            name="autoTreeCount"
                            value={form.autoTreeCount}
                            onChange={handleChange}
                            className="input-field"
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>{n} tree{n > 1 ? 's' : ''} — ₹{(n * PRICING.prebookAmount).toLocaleString('en-IN')}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">PIN Code *</label>
                        <input name="pincode" value={form.pincode} onChange={handleChange} required placeholder="400001" className="input-field" />
                      </div>
                    </div>
                  </div>

                  {/* 4. Delivery Address */}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">4. Delivery Address</h2>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="Flat/House No., Street, Area, City..."
                      className="input-field resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Instructions (optional)</label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Any delivery preferences..."
                      className="input-field resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
                  )}

                  <button type="submit" className="w-full btn-primary py-4 text-base">
                    Proceed to Payment — ₹{totalAmount.toLocaleString('en-IN')} <ArrowRight size={18} />
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2">
                <OrderSummary
                  pkg={selectedPkg}
                  treeCount={treeCount}
                  amount={totalAmount}
                  bookingId={null}
                  treeIds={resolvedTreeIds}
                  treeMode={form.treeMode}
                />
              </div>
            </div>
          )}

          {/* ── PAYMENT STEP ── */}
          {step === 'payment' && (
            <div className="grid lg:grid-cols-5 gap-10">
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Complete Your Payment</h2>
                  <p className="text-gray-500 text-sm mb-6">
                    Scan the QR code or use the UPI ID below. Then enter your transaction ID.
                  </p>

                  {/* Trees banner */}
                  <div className="bg-leaf-50 border border-leaf-200 rounded-xl px-4 py-3 mb-5">
                    <p className="text-xs text-leaf-700 font-semibold uppercase tracking-wide mb-1.5">
                      Your Tree{resolvedTreeIds.length > 1 ? 's' : ''} ({resolvedTreeIds.length}) · {form.treeMode === 'auto' ? 'Auto-assigned' : 'Custom pick'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {resolvedTreeIds.map((id) => (
                        <span key={id} className="font-mono font-bold text-leaf-800 bg-leaf-100 px-2 py-0.5 rounded text-sm">{id}</span>
                      ))}
                    </div>
                  </div>

                  {/* Amount due */}
                  <div className="bg-mango-50 border border-mango-200 rounded-2xl p-5 mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Amount Due</p>
                      <p className="text-3xl font-extrabold text-mango-600 mt-1">₹{totalAmount.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {treeCount} tree{treeCount > 1 ? 's' : ''} × ₹{PRICING.prebookAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-4xl">💳</div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm">
                      {qrMissing ? (
                        <div className="w-56 h-56 bg-gray-50 rounded-xl flex flex-col items-center justify-center gap-3 text-gray-400">
                          <QrCode size={56} strokeWidth={1} />
                          <p className="text-xs text-center px-4">
                            Add your QR image to<br />
                            <code className="bg-gray-100 px-1 rounded text-gray-600 text-[10px]">public/images/QR/payment-qr.jpeg</code>
                          </p>
                        </div>
                      ) : (
                        <img
                          src="/images/QR/payment-qr.jpeg"
                          alt="UPI Payment QR Code"
                          className="w-56 h-56 object-contain rounded-xl"
                          onError={() => setQrMissing(true)}
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">Scan with PhonePe, GPay, Paytm, or BHIM</p>
                  </div>

                  {/* UPI ID */}
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6">
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-0.5">UPI ID</p>
                      <p className="font-mono font-bold text-gray-900">{UPI_ID}</p>
                    </div>
                    <button
                      type="button"
                      onClick={copyUPI}
                      className="flex items-center gap-1.5 text-xs text-mango-600 font-semibold hover:text-mango-700 transition-colors"
                    >
                      <Copy size={14} />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  {/* Transaction ID */}
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        UPI Transaction ID / UTR Number *
                      </label>
                      <input
                        type="text"
                        value={txnId}
                        onChange={(e) => setTxnId(e.target.value)}
                        required
                        placeholder="e.g. 425810234567 or T2506291234"
                        className="input-field font-mono"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Find this in your UPI app → Transaction History → Reference / UTR No.
                      </p>
                    </div>

                    {/* Screenshot upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                        Payment Screenshot <span className="text-red-500">*</span>
                        <span className="text-gray-400 font-normal text-xs ml-1">(required, max 5 MB)</span>
                      </label>
                      <label className={`flex items-center gap-3 w-full cursor-pointer border-2 border-dashed rounded-xl px-4 py-3 transition-colors ${screenshot ? 'border-leaf-400 bg-leaf-50' : 'border-gray-200 hover:border-mango-400'}`}>
                        <input type="file" accept="image/*" className="sr-only" onChange={handleScreenshotChange} />
                        {screenshot ? (
                          <>
                            <CheckCircle size={18} className="text-leaf-500 shrink-0" />
                            <span className="text-sm text-leaf-700 font-medium truncate">{screenshotName}</span>
                            <button type="button" onClick={(e) => { e.preventDefault(); setScreenshot(null); setScreenshotName('') }}
                              className="ml-auto text-gray-400 hover:text-red-400 text-xs font-semibold shrink-0">Remove</button>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            <span className="text-sm text-gray-500">Click to upload payment screenshot</span>
                          </>
                        )}
                      </label>
                    </div>

                    {error && (
                      <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep('details')}
                        className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 btn-primary py-3"
                      >
                        {submitting
                          ? <><Loader2 size={18} className="animate-spin" /> Confirming…</>
                          : <><CheckCircle size={18} /> I've Paid — Confirm Booking</>}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2">
                <OrderSummary
                  pkg={selectedPkg}
                  treeCount={treeCount}
                  amount={totalAmount}
                  bookingId={bookingId}
                  treeIds={resolvedTreeIds}
                  treeMode={form.treeMode}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
