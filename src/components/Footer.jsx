import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube } from 'lucide-react'
import { SITE, PRICING } from '../config/siteConfig'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <img src="/logo.svg" alt="MangoOnRent" className="h-10 w-auto brightness-0 invert" />
            </Link>
            <p className="text-sm leading-relaxed text-gray-400 mb-5">
              Adopt a mango tree from the heart of Ratnagiri and taste the true sweetness of Keshar mangoes — direct from the orchard to your table.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Instagram, label: 'Instagram' },
                { Icon: Facebook, label: 'Facebook' },
                { Icon: Youtube, label: 'YouTube' },
              ].map(({ Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="p-2 bg-gray-800 rounded-lg hover:bg-mango-500 hover:text-white transition-colors">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/', label: 'Home' },
                { to: '/about', label: 'About Us' },
                { to: '/gallery', label: 'Gallery' },
                { to: '/trees', label: 'Our Trees' },
                { to: '/booking', label: 'Book a Tree' },
                { to: '/contact', label: 'Contact' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-mango-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Packages */}
          <div>
            <h3 className="font-semibold text-white mb-4">Packages</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex justify-between"><span>Base Tree</span><span className="text-mango-400 font-semibold">₹5,000</span></li>
              <li className="flex justify-between"><span>Standard Tree</span><span className="text-mango-400 font-semibold">₹7,000</span></li>
              <li className="flex justify-between"><span>Max Tree</span><span className="text-mango-400 font-semibold">₹9,000</span></li>
              <li className="flex justify-between"><span>Corporate Bundle</span><span className="text-mango-400 font-semibold">Custom</span></li>
              <li className="border-t border-gray-700 pt-2 mt-2 flex justify-between text-gray-500">
                <span>Pre-booking deposit</span>
                <span className="text-leaf-400 font-semibold">₹{PRICING.prebookAmount.toLocaleString('en-IN')}</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 text-mango-400 shrink-0" />
                <span>{SITE.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-mango-400 shrink-0" />
                <a href={`tel:${SITE.phone}`} className="hover:text-mango-400 transition-colors">{SITE.phone}</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-mango-400 shrink-0" />
                <a href={`mailto:${SITE.email}`} className="hover:text-mango-400 transition-colors">{SITE.email}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p>Made with 🥭 in Ratnagiri, Maharashtra</p>
        </div>
      </div>
    </footer>
  )
}
