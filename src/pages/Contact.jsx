import { useState } from 'react'
import { Phone, Mail, MapPin, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { submitContactForm } from '../utils/sheets'
import { img } from '../config/images'
import { SITE } from '../config/siteConfig'

const initForm = { name: '', email: '', phone: '', subject: '', message: '' }

export default function Contact() {
  const [form, setForm] = useState(initForm)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('submitting')
    try {
      await submitContactForm(form)
      setStatus('success')
      setForm(initForm)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="pt-16">
      {/* Hero */}
      <section
        className="relative py-28 flex items-center justify-center text-center overflow-hidden"
        style={{
          backgroundImage: `url('${img.contact}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10 max-w-xl mx-auto px-4">
          <p className="text-mango-400 font-semibold text-sm uppercase tracking-widest mb-3">Get in Touch</p>
          <h1 className="font-display text-5xl font-bold text-white mb-4 drop-shadow-lg">We'd Love to Hear From You</h1>
          <p className="text-gray-200 max-w-lg mx-auto">Have questions about packages, delivery, or your tree? Our team is happy to help.</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Contact info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Details</h2>
                <p className="text-gray-500 text-sm">Reach us via WhatsApp, email, or visit the farm.</p>
              </div>

              {[
                { icon: Phone, title: 'Phone / WhatsApp', lines: [SITE.phone, 'Mon–Sat, 9 AM – 6 PM'] },
                { icon: Mail, title: 'Email', lines: [SITE.email, 'We reply within 24 hours'] },
                { icon: MapPin, title: 'Farm Address', lines: ['Ratnagiri, Maharashtra', 'India – 415612'] },
                { icon: Clock, title: 'Season', lines: ['March – June (Delivery)', 'Bookings open year-round'] },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-10 h-10 bg-mango-100 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon size={18} className="text-mango-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    {item.lines.map((l) => (
                      <p key={l} className="text-sm text-gray-500">{l}</p>
                    ))}
                  </div>
                </div>
              ))}

              {/* FAQ teaser */}
              <div className="bg-mango-50 rounded-2xl p-5 mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Common Questions</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>🥭 Delivery to all major cities across India</li>
                  <li>📦 Mangoes delivered in 1–3 shipments per season</li>
                  <li>🎬 Video updates via WhatsApp throughout season</li>
                  <li>♻️ No contract renewal — re-book each season</li>
                </ul>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
                {status === 'success' ? (
                  <div className="text-center py-12">
                    <CheckCircle size={56} className="text-leaf-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-500 mb-6">Thanks for reaching out. We'll get back to you within 24 hours.</p>
                    <button onClick={() => setStatus('idle')} className="btn-secondary">Send Another Message</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} data-netlify="true" name="contact" className="space-y-5">
                    <input type="hidden" name="form-name" value="contact" />
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                        <input
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          placeholder="Rajesh Kumar"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="rajesh@email.com"
                          className="input-field"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone / WhatsApp</label>
                        <input
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="+91 98765 43210"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                        <select
                          name="subject"
                          value={form.subject}
                          onChange={handleChange}
                          required
                          className="input-field"
                        >
                          <option value="">Select a topic</option>
                          <option>Booking Enquiry</option>
                          <option>Package Details</option>
                          <option>Delivery Questions</option>
                          <option>Corporate Bundle</option>
                          <option>Existing Order</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="Tell us how we can help you..."
                        className="input-field resize-none"
                      />
                    </div>

                    {status === 'error' && (
                      <p className="text-red-600 text-sm">Something went wrong. Please try again or WhatsApp us directly.</p>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full btn-primary py-4 text-base"
                    >
                      {status === 'submitting' ? (
                        <><Loader2 size={18} className="animate-spin" /> Sending…</>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                    <p className="text-xs text-gray-400 text-center">
                      Your details are safe with us and never shared with third parties.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
