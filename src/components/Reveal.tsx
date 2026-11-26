import { createElement, useEffect, useState, type ElementType, type ReactNode } from 'react'

type RevealProps = {
  as?: ElementType
  children: ReactNode
  className?: string
  id?: string
}

/**
 * Fades content in as it enters the viewport. Falls back to always visible when
 * IntersectionObserver is unavailable or the visitor prefers reduced motion.
 */
export default function Reveal({
  as = 'div',
  children,
  className = '',
  id,
}: RevealProps) {
  const [element, setElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!element) return

    if (
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      element.classList.add('is-visible')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            element.classList.add('is-visible')
            observer.unobserve(element)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  return createElement(
    as,
    {
      ref: setElement,
      className: `reveal ${className}`.trim(),
      id,
      'data-reveal': '',
    },
    children,
  )
}
