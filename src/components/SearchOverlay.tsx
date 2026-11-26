import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  formatPrice,
  priceInfo,
  productUrl,
  searchProducts,
  shopUrl,
} from '../lib/shop'
import SmartImage from './SmartImage'
import { useCatalogue } from '../context/catalogue'

type SearchOverlayProps = {
  open: boolean
  onClose: () => void
}

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { products } = useCatalogue()

  const results = useMemo(
    () => (query.trim() ? searchProducts(products, query.trim()) : []),
    [products, query],
  )
  const shown = results.slice(0, 6)

  useEffect(() => {
    if (!open) {
      try {
        document.body.classList.remove('no-scroll')
      } catch {
        /* ignore */
      }
      return
    }

    document.body.classList.add('no-scroll')
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('no-scroll')
    }
  }, [open, onClose])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = query.trim()
    onClose()
    navigate(value ? shopUrl({ q: value }) : shopUrl())
  }

  const hint = !query.trim()
    ? 'Type to search, or press Enter to see every result in the shop.'
    : results.length
      ? `${results.length} ${results.length === 1 ? 'result' : 'results'}. Press Enter to open them in the shop.`
      : `Nothing matches "${query.trim()}". Try a category like tee, cap or tank.`

  return (
    <div
      id="search-overlay"
      className={`fixed inset-0 z-[60] overflow-y-auto bg-cream ${open ? 'is-open' : ''}`.trim()}
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
      aria-hidden={!open}
    >
      <div className="mx-auto max-w-3xl px-5 pb-16 pt-6 lg:pt-12">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center"
            aria-label="Close search"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} role="search" className="mt-2 border-b border-ink">
          <label htmlFor="search-input" className="sr-only">
            Search products
          </label>
          <input
            ref={inputRef}
            id="search-input"
            type="search"
            autoComplete="off"
            placeholder="Search tees, caps, tanks..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent py-4 font-serif text-3xl outline-none placeholder:text-ink/40 lg:text-5xl"
          />
        </form>

        <p id="search-hint" className="mt-4 text-sm text-ink/60">
          {hint}
        </p>

        <ul
          id="search-results"
          className="mt-6 divide-y divide-ink/10"
          aria-live="polite"
        >
          {shown.map((product) => {
            const info = priceInfo(product)
            return (
              <li key={product.id}>
                <Link
                  to={productUrl(product.id)}
                  onClick={onClose}
                  className="flex items-center gap-4 py-4"
                >
                  <span className="img-frame block h-20 w-16 shrink-0">
                    <SmartImage src={product.images[0]} alt="" loading="lazy" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-xl leading-tight">
                      {product.name}
                    </span>
                    <span className="block text-xs text-ink/60">
                      {product.category}
                    </span>
                  </span>
                  <span className="text-sm font-semibold">
                    {formatPrice(info.current)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
