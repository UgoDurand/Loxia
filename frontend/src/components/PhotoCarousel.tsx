import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PhotoCarouselProps {
  photos: string[]
  alt: string
  className?: string
}

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop'

export default function PhotoCarousel({ photos, alt, className = '' }: PhotoCarouselProps) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const images = photos.length > 0 ? photos : [PLACEHOLDER_IMG]

  function go(dir: number) {
    setDirection(dir)
    setIndex((i) => (i + dir + images.length) % images.length)
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  }

  return (
    <div className={`relative overflow-hidden bg-gray-200 ${className}`}>
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.img
          key={index}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.38, ease: 'easeInOut' }}
          src={images[index]}
          alt={`${alt} — photo ${index + 1}`}
          className="w-full h-full object-cover absolute inset-0"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = PLACEHOLDER_IMG
          }}
          draggable={false}
        />
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full p-1.5 shadow-md transition-all"
            aria-label="Photo précédente"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full p-1.5 shadow-md transition-all"
            aria-label="Photo suivante"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i) }}
                className={`rounded-full transition-all ${
                  i === index ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Count badge */}
      {images.length > 1 && (
        <div className="absolute top-3 right-3 z-10 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  )
}
