import { useState, useMemo, useEffect } from 'react'
import { trees, TREE_STATS } from '../data/trees'
import { Link } from 'react-router-dom'
import { Search, ArrowRight } from 'lucide-react'
import { img } from '../config/images'
import { PRICING } from '../config/siteConfig'
import { getAllBookings } from '../utils/sheets'

const PAGE_SIZE = 100

export default function Trees() {
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page,         setPage]         = useState(1)
  const [realBookings, setRealBookings] = useState({}) // treeId → {name, bookingId, isReal}
  const [loadingReal,  setLoadingReal]  = useState(true)
  // Merge static trees with real booking data from spreadsheet + localStorage
  const mergedTrees = useMemo(() => {
    return trees.map((t) => {
      if (realBookings[t.id]) {
        return { ...t, isRented: true, status: 'rented', renterName: realBookings[t.id].name, isRealBooking: true }
      }
      return t
    })
  }, [realBookings])

  // Live stats derived from merged data (includes all dummy + real bookings)
  const dynamicStats = useMemo(() => {
    const rented = mergedTrees.filter((t) => t.isRented).length
    return { total: TREE_STATS.total, rented, available: TREE_STATS.total - rented }
  }, [mergedTrees])

  useEffect(() => {
    // Load immediately-booked trees from localStorage
    const localBooked = {}
    try {
      const stored = JSON.parse(localStorage.getItem('mor_booked_trees') || '{}')
      Object.assign(localBooked, stored)
    } catch { /* ignore */ }

    // Fetch real bookings from spreadsheet
    getAllBookings().then((res) => {
      const combined = { ...localBooked }
      if (res.ok && Array.isArray(res.data)) {
        res.data.forEach((booking) => {
          const ids = String(booking.tree_ids || '').split(',').map((s) => s.trim()).filter(Boolean)
          ids.forEach((id) => {
            combined[id] = { name: booking.name, bookingId: booking.booking_id, isReal: true }
          })
        })
      }
      // Count newly booked trees beyond the pre-rented 278
        setRealBookings(combined)
      setLoadingReal(false)
    }).catch(() => {
      setRealBookings(localBooked)
      setLoadingReal(false)
    })
  }, [])

  const filtered = useMemo(() => {
    return mergedTrees.filter((t) => {
      const matchSearch = !search || t.id.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'all' || t.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [mergedTrees, search, filterStatus])

  const paginated = filtered.slice(0, page * PAGE_SIZE)
  const hasMore   = paginated.length < filtered.length

  return (
    <div className="pt-16">
      {/* Hero */}
      <section
        className="relative py-28 overflow-hidden text-center"
        style={{ backgroundImage: `url('${img.trees}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-leaf-900/75 via-black/50 to-black/60" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-mango-400 font-semibold text-sm uppercase tracking-widest mb-3">The Orchard</p>
          <h1 className="font-display text-5xl font-bold text-white mb-4 drop-shadow-lg">Our 510 Mango Trees</h1>
          <p className="text-gray-200 max-w-xl mx-auto">
            Every tree has a unique ID. Browse all 510 Keshar mango trees, check availability, and pre-book yours for the 2026 season.
          </p>

          <div className="flex justify-center gap-8 mt-10">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{dynamicStats.total}</div>
              <div className="text-xs text-gray-300 mt-1 uppercase tracking-wide">Total Trees</div>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <div className="text-4xl font-bold text-red-400">{dynamicStats.rented}</div>
              <div className="text-xs text-gray-300 mt-1 uppercase tracking-wide">Rented</div>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <div className="text-4xl font-bold text-mango-400">{dynamicStats.available}</div>
              <div className="text-xs text-gray-300 mt-1 uppercase tracking-wide">Available</div>
            </div>
          </div>

          {loadingReal && (
            <p className="text-xs text-mango-300 mt-4 animate-pulse">Fetching live availability…</p>
          )}
        </div>
      </section>

      {/* Legend */}
      <div className="bg-white border-b border-gray-100 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Rented
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-gray-400">○</span> Pre-booked (demo data)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-green-500">✓</span> Real booking (verified customer)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-mango-400 inline-block" /> Available to book
          </span>
        </div>
      </div>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tree ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mango-400"
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: 'all',       label: 'All' },
              { value: 'rented',    label: '🔴 Rented' },
              { value: 'available', label: '🟡 Available' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => { setFilterStatus(f.value); setPage(1) }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filterStatus === f.value ? 'bg-mango-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-mango-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} trees</span>
        </div>
      </section>

      {/* Tree grid */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {paginated.map((tree) => (
              <TreeCard key={tree.id} tree={tree} />
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-10">
              <button onClick={() => setPage((p) => p + 1)} className="btn-secondary px-8">
                Load More Trees ({filtered.length - paginated.length} remaining)
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section
        className="relative py-20 text-center overflow-hidden"
        style={{ backgroundImage: `url('${img.hero}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-mango-900/80 to-mango-900/70" />
        <div className="relative z-10 max-w-xl mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-white mb-4 drop-shadow">Found Your Tree?</h2>
          <p className="text-mango-100 mb-8">
            Pre-book now — {dynamicStats.available} trees available for Season 2026.
          </p>
          <Link to="/booking" className="bg-white text-mango-700 hover:bg-mango-50 btn-primary px-8 py-4">
            Pre-book Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}

// ── Tree card ─────────────────────────────────────────────────────────────────
function TreeCard({ tree }) {
  const displayName = tree.renterName || null

  return (
    <div className={`group relative rounded-2xl overflow-hidden shadow-sm border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
      tree.isRented ? 'border-red-200' : 'border-mango-200'
    }`}>
      <div className="relative h-40 overflow-hidden">
        <img
          src={img.mangoTree}
          alt={`Keshar mango tree ${tree.id}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className={`absolute inset-0 ${tree.isRented ? 'bg-red-900/30' : 'bg-leaf-900/10'}`} />
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            tree.isRented ? 'bg-red-500 text-white' : 'bg-mango-500 text-white'
          }`}>
            {tree.isRented ? 'Rented' : 'Pre-book'}
          </span>
        </div>
      </div>

      <div className={`px-3 py-2.5 ${tree.isRented ? 'bg-red-50' : 'bg-mango-50'}`}>
        <div className={`font-bold text-sm ${tree.isRented ? 'text-red-700' : 'text-mango-700'}`}>
          {tree.id}
        </div>

        {tree.isRented ? (
          <div className="text-xs mt-0.5">
            {displayName ? (
              tree.isRealBooking ? (
                <span className="text-green-600 font-medium">✓ {displayName}</span>
              ) : (
                <span className="text-gray-400">○ {displayName}</span>
              )
            ) : (
              <span className="text-gray-500">🔴 Currently rented</span>
            )}
          </div>
        ) : (
          <Link
            to={`/booking?tree=${tree.id}`}
            className="mt-1.5 flex items-center justify-center gap-1 w-full text-xs font-semibold bg-mango-500 hover:bg-mango-600 text-white py-1.5 rounded-lg transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Book — ₹{PRICING.prebookAmount.toLocaleString('en-IN')} <ArrowRight size={11} />
          </Link>
        )}
      </div>
    </div>
  )
}
