import { useEffect, useMemo, useState } from 'react'
import { asset, placeholderImage } from '../lib/shop'

type SwapImageProps = {
  images: string[]
  alt: string
  fallback?: string
  className?: string
  imageClassName?: string
  cycleMs?: number
}

/**
 * Product photo with a second image on hover. On touch devices (no hover) it
 * gently cycles through the available photos instead of requiring a hover.
 * Missing files are skipped, and the placeholder shows only when none work.
 */
export default function SwapImage({
  images,
  alt,
  fallback,
  className = '',
  imageClassName = '',
  cycleMs = 4000,
}: SwapImageProps) {
  const [failed, setFailed] = useState<number[]>([])
  const [hovered, setHovered] = useState(false)
  const [autoCycle, setAutoCycle] = useState(false)
  const [step, setStep] = useState(0)

  const sources = useMemo(() => {
    const list = [...new Set(images.filter(Boolean))]
    if (fallback && !list.includes(fallback)) list.push(fallback)
    return list
  }, [images, fallback])

  const valid = sources
    .map((_, index) => index)
    .filter((index) => !failed.includes(index))
  const validCount = valid.length

  useEffect(() => {
    const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const update = () => {
      setAutoCycle(!hoverQuery.matches && !motionQuery.matches)
    }

    update()
    hoverQuery.addEventListener('change', update)
    motionQuery.addEventListener('change', update)

    return () => {
      hoverQuery.removeEventListener('change', update)
      motionQuery.removeEventListener('change', update)
    }
  }, [])

  useEffect(() => {
    if (!autoCycle || validCount < 2) return
    const timer = window.setInterval(() => setStep((value) => value + 1), cycleMs)
    return () => window.clearInterval(timer)
  }, [autoCycle, cycleMs, validCount])

  let active = valid[0] ?? -1
  if (validCount > 1) {
    if (hovered) active = valid[1]
    else if (autoCycle) active = valid[step % validCount]
  }

  const markFailed = (index: number) => {
    setFailed((current) =>
      current.includes(index) ? current : [...current, index],
    )
  }

  return (
    <div
      className={`overflow-hidden ${className}`.trim()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {validCount === 0 ? (
        <img
          src={placeholderImage}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover ${imageClassName}`.trim()}
        />
      ) : (
        sources.map((src, index) => {
          if (failed.includes(index)) return null
          const isActive = index === active
          return (
            <img
              key={`${index}-${src.slice(0, 28)}`}
              src={asset(src)}
              alt={isActive ? alt : ''}
              loading="lazy"
              onError={() => markFailed(index)}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                isActive ? 'opacity-100' : 'opacity-0'
              } ${imageClassName}`.trim()}
            />
          )
        })
      )}
    </div>
  )
}
