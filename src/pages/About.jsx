import { Link } from 'react-router-dom'
import { ArrowRight, Leaf, Heart, Award, Users } from 'lucide-react'
import { img } from '../config/images'
import { SITE } from '../config/siteConfig'

const values = [
  { icon: Leaf, title: 'Farm-to-Table Freshness', desc: 'Every mango is picked at peak ripeness and shipped within 24 hours of harvest — no cold storage, no compromise.' },
  { icon: Heart, title: 'Farmer Welfare', desc: 'We work directly with Ratnagiri families, ensuring fair prices and sustainable livelihoods for the people who grow your mangoes.' },
  { icon: Award, title: `Premium ${SITE.mangoVariety}`, desc: `Our orchard grows only authentic ${SITE.mangoVariety} mangoes — known for their rich saffron colour, honey-sweet taste, and irresistible aroma.` },
  { icon: Users, title: 'Community First', desc: 'MangoOnRent is built on trust between tree owners and our farming community. Transparency is at every step.' },
]

const timeline = [
  { year: '2019', title: 'The Idea', desc: 'A city family visits Ratnagiri, falls in love with the orchard, and asks: "Can we adopt a tree?" The seed is planted.' },
  { year: '2020', title: 'First Season', desc: '12 families adopt trees. Every single one re-books. We know we\'ve found something special.' },
  { year: '2022', title: 'Growing the Orchard', desc: 'We expand to 200 trees, partner with three farming families, and launch video updates for tree owners.' },
  { year: '2024', title: '500 Trees & Counting', desc: '275 trees rented in minutes each season. We introduce Corporate Bundles and direct doorstep delivery across India.' },
]

export default function About() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section
        className="relative py-32 overflow-hidden"
        style={{
          backgroundImage: `url('${img.about}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-leaf-900/80 via-leaf-900/60 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-mango-400 font-semibold text-sm uppercase tracking-widest mb-3">Our Story</p>
            <h1 className="font-display text-5xl font-bold text-white leading-tight mb-6 drop-shadow-lg">
              Growing Happiness,<br />One Tree at a Time
            </h1>
            <p className="text-lg text-gray-200 leading-relaxed">
              MangoOnRent was born from a simple belief: everyone deserves to taste fresh, authentic {SITE.mangoVariety} mangoes — and the farmers who grow them deserve a fair deal. We connect you directly to the orchard.
            </p>
          </div>
        </div>
      </section>

      {/* Farm info */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="section-heading mb-6">The Heart of Ratnagiri</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Our orchard sits in the Konkan belt of Maharashtra. The unique combination of laterite soil, sea breeze, and generations of farming knowledge creates the famous {SITE.mangoVariety} mango — loved for its deep saffron colour, sweet honey taste, and rich fragrance unlike any other variety.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                We manage 510 trees across 3 family farms. Each tree is numbered, photographed, and cared for with zero artificial ripening agents. What you get is pure, natural sweetness — the way mangoes were always meant to taste.
              </p>
              <p className="text-gray-600 leading-relaxed">
                When you book a tree with us, you're not just buying mangoes. You're connecting with the land, supporting a farming family, and becoming part of a tradition that has thrived for over 150 years.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { emoji: '🌳', label: '510 Trees', sub: 'Across 3 orchards' },
                { emoji: '🥭', label: SITE.mangoVariety, sub: 'Premium variety' },
                { emoji: '🚚', label: '24hr Delivery', sub: 'Post harvest' },
                { emoji: '🎬', label: 'Video Updates', sub: 'Throughout season' },
              ].map((item) => (
                <div key={item.label} className="bg-mango-50 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-2">{item.emoji}</div>
                  <div className="font-bold text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-mango-500 font-semibold text-sm uppercase tracking-widest mb-2">What We Stand For</p>
            <h2 className="section-heading">Our Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-mango-100 rounded-xl flex items-center justify-center mb-4">
                  <v.icon size={22} className="text-mango-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-mango-500 font-semibold text-sm uppercase tracking-widest mb-2">Our Journey</p>
            <h2 className="section-heading">The MangoOnRent Story</h2>
          </div>
          <div className="relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-mango-200 -translate-x-1/2" />
            <div className="space-y-10">
              {timeline.map((item, i) => (
                <div key={item.year} className={`relative flex gap-6 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`hidden md:block flex-1 ${i % 2 === 0 ? 'text-right' : 'text-left'}`} />
                  <div className="relative flex-shrink-0 w-16 flex flex-col items-center">
                    <div className="w-10 h-10 bg-mango-500 rounded-full flex items-center justify-center text-white text-xs font-bold z-10 shadow">
                      {item.year.slice(2)}
                    </div>
                  </div>
                  <div className="flex-1 bg-mango-50 rounded-2xl p-5 shadow-sm">
                    <span className="text-xs font-bold text-mango-500">{item.year}</span>
                    <h3 className="font-bold text-gray-900 mt-1 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-leaf-600 to-leaf-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-3xl font-bold mb-4">Be Part of Our Orchard</h2>
          <p className="text-leaf-100 mb-8">Join 500+ families who have adopted trees and taste the season's finest {SITE.mangoVariety} mangoes.</p>
          <Link to="/booking" className="bg-white text-leaf-700 hover:bg-leaf-50 btn-primary px-8 py-4">
            Pre-book Your Tree <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
