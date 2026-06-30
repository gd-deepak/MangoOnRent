import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, ArrowRight, Star, TreePine, Package, Truck } from 'lucide-react'
import { PACKAGES, SITE } from '../config/siteConfig'
import { reviews } from '../data/reviews'
import { TREE_STATS, trees } from '../data/trees'
import { getAllBookings } from '../utils/sheets'
import { img } from '../config/images'

// Build the set of tree IDs that are statically pre-booked (dummy data)
const STATIC_BOOKED_IDS = new Set(trees.filter((t) => t.isRented).map((t) => t.id))

// Fetch live booking counts: static dummy count + real bookings on top
function useLiveTreeCounts() {
  const [liveRented, setLiveRented] = useState(TREE_STATS.rented)
  useEffect(() => {
    getAllBookings().then((res) => {
      if (!res.ok || !Array.isArray(res.data)) return
      const extra = new Set()
      res.data.forEach((b) => {
        const status = String(b.payment_status || '').toLowerCase()
        if (status.includes('cancel') || status.includes('failed')) return
        String(b.tree_ids || '').split(',').forEach((id) => {
          const t = id.trim()
          if (t && !STATIC_BOOKED_IDS.has(t)) extra.add(t)
        })
      })
      setLiveRented(TREE_STATS.rented + extra.size)
    }).catch(() => {})
  }, [])
  return {
    rented:    liveRented,
    available: TREE_STATS.total - liveRented,
    total:     TREE_STATS.total,
  }
}

// ── Animated hero slideshow ───────────────────────────────────────────────────
// 4 distinct mango photos — orchard wide shot, yellow ripe pile, ripe on tree, market
const HERO_SLIDES = [img.hero, img.hero2, img.hero3, img.hero4]

function HeroSlideshow() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % HERO_SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {HERO_SLIDES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            backgroundImage: `url('${src}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: i === current ? 1 : 0,
          }}
        />
      ))}
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-mango-900/30 to-transparent" />
      {/* Slide dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-mango-400 w-6' : 'bg-white/50 hover:bg-white/80'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </>
  )
}

// ── Package card ──────────────────────────────────────────────────────────────
function PackageCard({ pkg }) {
  const canBook = pkg.status === 'available'
  const isContact = pkg.status === 'contact'

  const statusBadge = {
    available: <span className="inline-block px-3 py-1 bg-leaf-100 text-leaf-700 text-xs font-semibold rounded-full uppercase tracking-wide">Available</span>,
    out_of_stock: <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full uppercase tracking-wide">Out of Stock</span>,
    contact: <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wide">Contact Us</span>,
  }[pkg.status]

  return (
    <div className={`relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
      pkg.highlight
        ? 'bg-gradient-to-b from-mango-500 to-mango-600 text-white shadow-2xl scale-105'
        : 'bg-white text-gray-800 shadow-lg hover:shadow-xl border border-gray-100'
    }`}>
      {pkg.highlight && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <span className="bg-leaf-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow">Most Popular</span>
        </div>
      )}

      <div className="p-7 pt-9">
        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${pkg.highlight ? 'text-mango-100' : 'text-mango-500'}`}>{pkg.label}</p>
        <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>

        {pkg.fullPrice ? (
          <div className="mb-1">
            <span className={`text-3xl font-extrabold ${pkg.highlight ? 'text-white' : 'text-gray-900'}`}>
              ₹{pkg.fullPrice.toLocaleString('en-IN')}
            </span>
            <span className={`text-xs ml-1 ${pkg.highlight ? 'text-mango-100' : 'text-gray-500'}`}>/season</span>
          </div>
        ) : (
          <div className="text-2xl font-extrabold mb-1">Custom Pricing</div>
        )}

        <div className={`text-xs font-semibold mb-3 ${pkg.highlight ? 'text-mango-100' : 'text-mango-600'}`}>
          Pre-book for just ₹{pkg.prebookPrice.toLocaleString('en-IN')}
        </div>

        {statusBadge}
      </div>

      <div className={`px-7 pb-2 border-t ${pkg.highlight ? 'border-mango-400' : 'border-gray-100'}`}>
        <ul className="space-y-3 py-5">
          {pkg.features.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <CheckCircle size={16} className={`mt-0.5 shrink-0 ${pkg.highlight ? 'text-mango-100' : 'text-leaf-500'}`} />
              <span className={pkg.highlight ? 'text-mango-50' : 'text-gray-600'}>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-7 pb-7 mt-auto">
        {canBook ? (
          <Link to="/booking" className={`w-full text-center block py-3 rounded-xl font-semibold text-sm transition-all ${
            pkg.highlight
              ? 'bg-white text-mango-600 hover:bg-mango-50'
              : 'bg-mango-500 text-white hover:bg-mango-600'
          }`}>
            Book Now — ₹{pkg.prebookPrice.toLocaleString('en-IN')} <ArrowRight size={14} className="inline ml-1" />
          </Link>
        ) : isContact ? (
          <Link to="/contact" className="w-full text-center block py-3 rounded-xl font-semibold text-sm bg-gray-900 text-white hover:bg-gray-800 transition-all">
            Get in Touch <ArrowRight size={14} className="inline ml-1" />
          </Link>
        ) : (
          <button disabled className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-400 cursor-not-allowed">
            Currently Unavailable
          </button>
        )}
      </div>
    </div>
  )
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 flex flex-col gap-4">
      <div className="flex gap-1">
        {Array.from({ length: review.rating }).map((_, i) => (
          <Star key={i} size={14} className="fill-mango-400 text-mango-400" />
        ))}
      </div>
      <p className="text-gray-600 text-sm leading-relaxed flex-1">"{review.text}"</p>
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${review.color}`}>
          {review.avatar}
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-900">{review.name}</p>
          <p className="text-xs text-gray-400">{review.location} · {review.tree}</p>
        </div>
      </div>
    </div>
  )
}

// ── Animated Orchard Availability ────────────────────────────────────────────
function OrchardAvailability({ liveCounts }) {
  const [active, setActive] = useState(false)
  const [counts, setCounts] = useState({ booked: 0, available: 0, total: 0 })
  const ref = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true) },
      { threshold: 0.2 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  // Re-run animation whenever liveCounts updates or section becomes visible
  useEffect(() => {
    if (!active) return
    let raf
    const duration = 1600
    const start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setCounts({
        booked:    Math.round(liveCounts.rented    * ease),
        available: Math.round(liveCounts.available * ease),
        total:     Math.round(liveCounts.total     * ease),
      })
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, liveCounts.rented])

  const pct    = liveCounts.rented / liveCounts.total
  const radius = 70
  const circ   = 2 * Math.PI * radius

  return (
    <section ref={ref} className="py-20 text-white overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #030712 0%, #0a1a0a 50%, #111827 100%)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Title */}
        <div className="text-center mb-12">
          <p className="text-mango-400 font-semibold text-sm uppercase tracking-widest mb-2">Real-Time</p>
          <h2 className="font-display text-4xl font-bold">Orchard Availability</h2>
          <p className="text-gray-400 mt-3 text-sm">
            Live snapshot of our {liveCounts.total}-tree orchard for Season {SITE.season}
          </p>
        </div>

        {/* Gauge + Stats row */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 mb-12">

          {/* SVG circular gauge */}
          <div className="relative flex-shrink-0">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {/* Track — available (mango orange) */}
              <circle cx="100" cy="100" r={radius} fill="none"
                stroke="rgba(251,146,60,0.18)" strokeWidth="18" />
              {/* Filled — booked (leaf green) */}
              <circle cx="100" cy="100" r={radius} fill="none"
                stroke="#4ade80" strokeWidth="18"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={active ? circ * (1 - pct) : circ}
                transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1)' }}
              />
              <text x="100" y="92" textAnchor="middle" fill="white"
                fontSize="26" fontWeight="bold" fontFamily="sans-serif">
                {Math.round(pct * 100)}%
              </text>
              <text x="100" y="115" textAnchor="middle" fill="rgba(255,255,255,0.45)"
                fontSize="11" fontFamily="sans-serif">Adopted</text>
            </svg>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 md:grid-cols-1 gap-3 md:gap-4 w-full md:w-64">
            {[
              { label: 'Total Trees',     value: counts.total,     color: 'text-white'      },
              { label: 'Trees Adopted',   value: counts.booked,    color: 'text-green-400'  },
              { label: 'Trees Available', value: counts.available,  color: 'text-mango-400'  },
            ].map((s) => (
              <div key={s.label}
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-center md:flex md:items-center md:gap-4">
                <div className={`text-3xl md:text-4xl font-extrabold tabular-nums ${s.color}`}>
                  {s.value.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mt-1 md:mt-0 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8 flex items-center gap-3 max-w-2xl mx-auto">
          <span className="text-xs text-gray-400 w-16 text-right shrink-0">Adopted</span>
          <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden relative">
            {/* Available portion (mango) fills full width underneath */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-mango-500/50 to-mango-400/50" />
            {/* Adopted portion (leaf green) fills from left */}
            <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 relative"
              style={{
                width: active ? `${pct * 100}%` : '0%',
                transition: 'width 1.6s cubic-bezier(0.4,0,0.2,1)',
              }} />
          </div>
          <span className="text-xs text-gray-400 w-16 shrink-0">Available</span>
        </div>

        {/* Dot grid — CSS class-driven animation, no per-dot RAF */}
        <style>{`
          @keyframes dotPop {
            from { opacity: 0; transform: scale(0); }
            to   { opacity: 1; transform: scale(1); }
          }
          .dot-active .orchard-dot {
            animation: dotPop 0.25s ease forwards;
          }
        `}</style>
        <div className={`flex flex-wrap justify-center gap-[3px] max-w-2xl mx-auto mb-10 px-2 ${active ? 'dot-active' : ''}`}>
          {Array.from({ length: liveCounts.total }, (_, i) => (
            <div
              key={i}
              title={`MGO-${String(i + 1).padStart(3, '0')}`}
              className={`orchard-dot w-2 h-2 rounded-full ${i < liveCounts.rented ? 'bg-green-400' : 'bg-mango-400'}`}
              style={{
                opacity: 0,
                animationDelay: `${Math.min(i * 1.5, 900)}ms`,
              }}
            />
          ))}
        </div>

        {/* Legend + CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="flex gap-6 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-400 shrink-0" />
              <span className="text-gray-300">Adopted ({liveCounts.rented})</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-mango-400 shrink-0" />
              <span className="text-gray-300">Available ({liveCounts.available})</span>
            </span>
          </div>
          <Link to="/trees"
            className="inline-flex items-center gap-2 bg-mango-500 hover:bg-mango-400 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors">
            Browse All Trees <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}

const steps = [
  { icon: Package, title: 'Choose Your Package', desc: 'Pick from Base (₹5k), Standard (₹7k), Max (₹9k) or Corporate. Pre-book any plan for just ₹1,000.' },
  { icon: TreePine, title: 'Get Your Tree ID', desc: 'We assign a unique tree (MGO-XXX) from our 510-tree Ratnagiri orchard — yours for the full season.' },
  { icon: Truck, title: 'Receive Fresh Mangoes', desc: `Harvest-fresh ${SITE.mangoVariety} mangoes are hand-picked and delivered straight to your doorstep.` },
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const liveCounts = useLiveTreeCounts()
  const rentedPct = Math.round((liveCounts.rented / liveCounts.total) * 100)

  return (
    <div className="pt-16">

      {/* ── Hero (animated slideshow) ── */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <HeroSlideshow />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <span className="inline-block mb-4 px-4 py-1.5 bg-mango-500/90 text-white text-sm font-semibold rounded-full backdrop-blur-sm">
              🌳 Season {SITE.season} — All Packages Now Open
            </span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 drop-shadow-lg">
              Adopt a Mango Tree,
              <span className="block text-mango-400">Taste the Season</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl leading-relaxed">
              Own a tree in the lush {SITE.mangoVariety} orchards of {SITE.region}. Get fresh mangoes delivered to your doorstep, watch your tree grow with live video updates, and taste the real sweetness of nature.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/booking" className="btn-primary text-base px-8 py-4">
                Pre-book for ₹1,000 <ArrowRight size={18} />
              </Link>
              <Link to="/gallery" className="border-2 border-white/70 text-white hover:bg-white/10 inline-flex items-center justify-center gap-2 text-base px-8 py-4 rounded-xl font-semibold transition-all">
                View the Orchard
              </Link>
            </div>
            <div className="flex flex-wrap gap-5 mt-10 text-sm text-white/80">
              {[`Premium ${SITE.mangoVariety}`, 'Harvest-fresh Delivery', 'Video Updates Included', 'Since 2019'].map((b) => (
                <span key={b} className="flex items-center gap-1.5">
                  <CheckCircle size={15} className="text-mango-400" /> {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-gray-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: liveCounts.total, label: 'Total Trees' },
              { value: liveCounts.rented, label: 'Trees Booked' },
              { value: liveCounts.available, label: 'Trees Available' },
              { value: `${rentedPct}%`, label: 'Orchard Adopted' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold text-mango-400">{s.value}</div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-mango-500 font-semibold text-sm uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="section-heading">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center px-6">
                <div className="w-16 h-16 bg-mango-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <step.icon size={28} className="text-mango-600" />
                </div>
                <div className="text-4xl font-extrabold text-mango-100 -mb-4">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 relative z-10">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Packages ── */}
      <section id="packages" className="py-20 bg-gradient-to-b from-mango-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-mango-500 font-semibold text-sm uppercase tracking-widest mb-2">Season {SITE.season}</p>
            <h2 className="section-heading">Choose Your Package</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              All plans available now. Pre-book any tree for ₹1,000 and pay the balance at season start.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 items-start pt-6">
            {PACKAGES.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)}
          </div>
        </div>
      </section>

      {/* ── Animated Orchard Availability ── */}
      <OrchardAvailability liveCounts={liveCounts} />

      {/* ── Reviews ── */}
      <section className="py-20 bg-mango-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-mango-500 font-semibold text-sm uppercase tracking-widest mb-2">Happy Customers</p>
            <h2 className="section-heading">What Our Tree Owners Say</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-gradient-to-r from-mango-500 to-mango-600">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="font-display text-4xl font-bold mb-4">Ready to Adopt Your Mango Tree?</h2>
          <p className="text-mango-100 text-lg mb-8">
            Only {liveCounts.available} trees left. Pre-book any package for just ₹1,000 before the season fills up!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/booking" className="bg-white text-mango-600 hover:bg-mango-50 btn-primary px-8 py-4">
              Pre-book for ₹1,000 <ArrowRight size={18} />
            </Link>
            <Link to="/contact" className="border-2 border-white text-white hover:bg-white/10 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all">
              Ask a Question
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
