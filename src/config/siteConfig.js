// ─── Master configuration ────────────────────────────────────────────────────
// Edit prices, availability, tree counts, contact info, and mango variety here.
// Every other file in the app reads from this single source of truth.

export const SITE = {
  name: 'MangoOnRent',
  tagline: 'Adopt a Keshar Mango Tree, Taste the Season',
  mangoVariety: 'Keshar',
  region: 'Ratnagiri, Maharashtra',
  phone: '+91 90963 65035',
  whatsapp: '919096365035',
  email: 'mangoonrent@gmail.com',
  address: 'Ratnagiri, Maharashtra, India – 415612',
  upiId: 'mangoonrent@upi',       // ← replace with your real UPI ID
  season: '2026',
}

// ─── Tree inventory ───────────────────────────────────────────────────────────
export const INVENTORY = {
  total: 510,
  booked: 278,
  get available() { return this.total - this.booked },
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
// prebookAmount  = advance collected now (same for all plans)
// fullPrice      = total season price (balance due at season start)
export const PRICING = {
  prebookAmount: 1000,            // ₹1,000 prebooking for ALL plans
  plans: {
    base:      { fullPrice: 5000, available: true },
    standard:  { fullPrice: 7000, available: true },
    max:       { fullPrice: 9000, available: true },
    corporate: { fullPrice: null, available: true },  // null = custom / contact us
  },
}

// ─── Package definitions ──────────────────────────────────────────────────────
// status: 'available' | 'out_of_stock' | 'contact'
// Derived from PRICING so you only need to edit PRICING above.
export const PACKAGES = [
  {
    id: 'base',
    name: 'Base Tree',
    label: 'Base',
    fullPrice: PRICING.plans.base.fullPrice,
    prebookPrice: PRICING.prebookAmount,
    status: PRICING.plans.base.available ? 'available' : 'out_of_stock',
    highlight: false,
    features: [
      '10–20 dozen Keshar mangoes',
      '30–50 kg approximate weight',
      '30 kg minimum guaranteed',
      'Fresh delivery included',
      'Video updates via WhatsApp',
    ],
  },
  {
    id: 'standard',
    name: 'Standard Tree',
    label: 'Standard',
    fullPrice: PRICING.plans.standard.fullPrice,
    prebookPrice: PRICING.prebookAmount,
    status: PRICING.plans.standard.available ? 'available' : 'out_of_stock',
    highlight: true,
    features: [
      '15–25 dozen Keshar mangoes',
      '45–75 kg approximate weight',
      '45 kg minimum guaranteed',
      'Fresh delivery included',
      'Video updates via WhatsApp',
    ],
  },
  {
    id: 'max',
    name: 'Max Tree',
    label: 'Max',
    fullPrice: PRICING.plans.max.fullPrice,
    prebookPrice: PRICING.prebookAmount,
    status: PRICING.plans.max.available ? 'available' : 'out_of_stock',
    highlight: false,
    features: [
      '20–30 dozen Keshar mangoes',
      '60–90 kg approximate weight',
      '60 kg minimum guaranteed',
      'Fresh delivery included',
      'Video updates via WhatsApp',
    ],
  },
  {
    id: 'corporate',
    name: 'Corporate Bundle',
    label: 'Corporate',
    fullPrice: null,
    prebookPrice: PRICING.prebookAmount,
    status: 'contact',
    highlight: false,
    features: [
      'Minimum 10+ trees',
      'Bulk pricing available',
      'Flexible delivery terms',
      'Dedicated account support',
      'Custom packaging option',
    ],
  },
]
