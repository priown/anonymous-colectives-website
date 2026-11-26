import { useState, type ImgHTMLAttributes } from 'react'
import { asset, placeholderImage } from '../lib/shop'

type SmartImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string
  onMissing?: () => void
}

/**
 * Product/banner photo that swaps in the site placeholder when a file is
 * missing, and optionally tells its parent so a "Mockup coming soon" badge can
 * be shown (or the whole card hidden).
 */
export default function SmartImage({
  src,
  alt = '',
  onMissing,
  ...rest
}: SmartImageProps) {
  const [missing, setMissing] = useState(false)

  return (
    <img
      {...rest}
      alt={alt}
      src={missing ? placeholderImage : asset(src)}
      onError={(event) => {
        if (missing) return
        event.currentTarget.onerror = null
        setMissing(true)
        onMissing?.()
      }}
    />
  )
}
