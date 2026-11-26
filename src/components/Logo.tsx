import { useState } from 'react'
import { SITE } from '../data/catalogue'
import { asset } from '../lib/shop'

type LogoProps = {
  className?: string
  linkClassName?: string
}

/**
 * Two copies of the official logo; CSS shows the right one for the current
 * theme. If the files are unavailable the brand name is shown as text.
 */
export default function Logo({ className = 'h-9', linkClassName = '' }: LogoProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span className={`wordmark text-xl ${className} ${linkClassName}`.trim()}>
        Anonymous Collectives
      </span>
    )
  }

  return (
    <>
      <img
        src={asset(SITE.logoCharcoal)}
        alt=""
        className={`logo-charcoal w-auto ${className}`}
        onError={() => setFailed(true)}
      />
      <img
        src={asset(SITE.logoIvory)}
        alt=""
        className={`logo-ivory w-auto ${className}`}
        onError={() => setFailed(true)}
      />
    </>
  )
}
