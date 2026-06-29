import { useState } from 'react'
import { img } from '../config/images'

const photos = [
  { id: 1,  caption: 'Golden Keshar clusters ready for harvest', category: 'harvest', imgKey: 'gallery1', tall: true },
  { id: 2,  caption: 'Lush Ratnagiri orchard in full bloom', category: 'orchard', imgKey: 'gallery2' },
  { id: 3,  caption: 'Close-up of ripening Keshar mangoes', category: 'harvest', imgKey: 'gallery3' },
  { id: 4,  caption: 'Morning dew on mango leaves', category: 'nature', imgKey: 'gallery4', tall: true },
  { id: 5,  caption: 'Harvest day — carefully handpicked', category: 'harvest', imgKey: 'gallery5' },
  { id: 6,  caption: 'Sea breeze through the Konkan orchard', category: 'orchard', imgKey: 'gallery6' },
  { id: 7,  caption: 'Tree MGO-042 — adopted by a Mumbai family', category: 'trees', imgKey: 'gallery7', tall: true },
  { id: 8,  caption: 'Sunrise over the Ratnagiri farm', category: 'nature', imgKey: 'gallery8' },
  { id: 9,  caption: 'Keshar mangoes on the weighing scale', category: 'harvest', imgKey: 'gallery9' },
  { id: 10, caption: 'Fresh mangoes packed for delivery', category: 'delivery', imgKey: 'gallery10' },
  { id: 11, caption: 'The farming family at harvest time', category: 'orchard', imgKey: 'gallery11', tall: true },
  { id: 12, caption: 'Rows of mango trees — the next season', category: 'trees', imgKey: 'gallery12' },
]

const categories = ['all', 'harvest', 'orchard', 'nature', 'delivery', 'trees']

export default function Gallery() {
  const [filter, setFilter] = useState('all')
  const [lightbox, setLightbox] = useState(null)

  const visible = filter === 'all' ? photos : photos.filter((p) => p.category === filter)

  return (
    <div className="pt-16">
      {/* Hero */}
      <section
        className="relative py-32 flex items-center justify-center text-center overflow-hidden"
        style={{ backgroundImage: `url('${img.gallery}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-leaf-900/70 via-black/50 to-black/60" />
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <p className="text-mango-400 font-semibold text-sm uppercase tracking-widest mb-3">The Orchard</p>
          <h1 className="font-display text-5xl font-bold text-white mb-4 drop-shadow-lg">Life in Our Mango Grove</h1>
          <p className="text-gray-200 text-lg">A peek into the Ratnagiri orchard — from first blossom to your doorstep.</p>
        </div>
      </section>

      {/* Filter tabs */}
      <section className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === cat ? 'bg-mango-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-mango-50 hover:text-mango-600'
              }`}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Masonry grid */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {visible.map((photo) => (
              <div key={photo.id}
                className="break-inside-avoid rounded-2xl overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
                onClick={() => setLightbox(photo)}>
                <div className="relative overflow-hidden">
                  <img
                    src={img[photo.imgKey]}
                    alt={photo.caption}
                    className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${photo.tall ? 'h-80' : 'h-56'}`}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-white text-sm font-medium">{photo.caption}</p>
                    <span className="text-mango-300 text-xs capitalize">{photo.category}</span>
                  </div>
                </div>
                <div className="bg-white px-4 py-3">
                  <p className="text-sm font-medium text-gray-700">{photo.caption}</p>
                  <span className="text-xs text-gray-400 capitalize">{photo.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="max-w-4xl w-full relative" onClick={(e) => e.stopPropagation()}>
            <img src={img[lightbox.imgKey]} alt={lightbox.caption} className="w-full rounded-2xl object-cover max-h-[80vh]" />
            <div className="mt-4 text-center">
              <p className="text-white font-medium">{lightbox.caption}</p>
              <p className="text-gray-400 text-sm capitalize mt-1">{lightbox.category}</p>
            </div>
            <button className="absolute top-2 right-2 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center text-xl hover:bg-mango-500 transition-colors" onClick={() => setLightbox(null)}>×</button>
          </div>
        </div>
      )}

      {/* Video section */}
      <section className="py-16 bg-gray-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-display text-3xl font-bold mb-4">🎬 Season Video Updates</h2>
          <p className="text-gray-400 mb-8">Every tree owner gets personal video updates as the season progresses — from flowering to harvest.</p>
          <div className="bg-gray-800 rounded-2xl aspect-video flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">▶️</div>
              <p className="text-gray-400 text-sm">Season 2024 Highlights Video</p>
              <p className="text-xs text-gray-600 mt-1">Coming soon</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
