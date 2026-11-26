import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Menu,
  MessageCircle,
  Moon,
  Search,
  ShoppingCart,
  Sun,
  X,
} from 'lucide-react'
import { SITE } from '../data/catalogue'
import { waLink } from '../lib/shop'
import { useCart } from '../context/cart'
import { useTheme } from '../context/theme'
import Logo from './Logo'
import SearchOverlay from './SearchOverlay'

type NavItem = {
  label: string
  to: string
  page: 'home' | 'shop' | 'collections' | 'about' | 'contact'
}

const NAV: NavItem[] = [
  { label: 'Home', to: '/', page: 'home' },
  { label: 'Shop', to: '/shop', page: 'shop' },
  { label: 'Collections', to: '/shop#collections', page: 'collections' },
  { label: 'About Us', to: '/about', page: 'about' },
  { label: 'Contact', to: '/contact', page: 'contact' },
]

const whatsAppLink = waLink('Hello Anonymous Collectives!')

export default function Header() {
  const location = useLocation()
  const { count, openCart } = useCart()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [hidden, setHidden] = useState(false)

  const currentPage =
    location.pathname === '/'
      ? 'home'
      : location.pathname.startsWith('/product')
        ? 'shop'
        : location.pathname.startsWith('/shop')
          ? 'shop'
          : location.pathname.startsWith('/about')
            ? 'about'
            : location.pathname.startsWith('/contact')
              ? 'contact'
              : ''

  useEffect(() => {
    document.body.classList.toggle('no-scroll', menuOpen)
    return () => document.body.classList.remove('no-scroll')
  }, [menuOpen])

  useEffect(() => {
    let last = window.scrollY
    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        const y = window.scrollY
        if (menuOpen || searchOpen) setHidden(false)
        else setHidden(y > last && y > 160)
        last = y
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [menuOpen, searchOpen])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuOpen) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <header
        id="site-header"
        className={`fixed inset-x-0 top-0 z-50 border-b border-ink/10 bg-cream/95 backdrop-blur ${
          hidden ? 'is-hidden' : ''
        }`.trim()}
      >
        <div className="mx-auto grid h-16 max-w-[90rem] grid-cols-[auto_1fr_auto] items-center gap-4 px-5 lg:h-20 lg:px-10">
          <Link
            to="/"
            aria-label="Anonymous Collectives, home"
            className="flex items-center"
            onClick={closeMenu}
          >
            <Logo className="h-12 lg:h-16" />
          </Link>

          <nav className="hidden justify-center gap-10 lg:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="nav-link"
                aria-current={item.page === currentPage ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="col-start-3 flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="grid h-11 w-11 place-items-center"
              aria-label="Search products"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              id="theme-toggle"
              onClick={toggleTheme}
              className="grid h-11 w-11 place-items-center"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={theme === 'dark'}
            >
              <Moon className="icon-moon h-5 w-5" aria-hidden="true" />
              <Sun className="icon-sun h-5 w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={openCart}
              className="relative grid h-11 w-11 place-items-center"
              aria-label={
                count
                  ? `Open shopping cart, ${count} ${count === 1 ? 'item' : 'items'}`
                  : 'Open shopping cart'
              }
              aria-haspopup="dialog"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {count > 0 ? (
                <span className="cart-badge">{count > 99 ? '99+' : count}</span>
              ) : null}
            </button>

            <a
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-11 w-11 place-items-center sm:grid"
              aria-label="Chat with us on WhatsApp"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="grid h-11 w-11 place-items-center lg:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div
          id="mobile-menu"
          className={`absolute inset-x-0 top-full h-[calc(100svh-4rem)] overflow-y-auto bg-cream lg:hidden ${
            menuOpen ? 'is-open' : ''
          }`.trim()}
          aria-hidden={!menuOpen}
        >
          <nav className="flex flex-col px-6 pt-6" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={closeMenu}
                className="border-b border-ink/10 py-5 font-serif text-4xl"
                aria-current={item.page === currentPage ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="px-6 pb-10 pt-8 text-sm">
            <a
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-dark w-full"
            >
              Chat on WhatsApp
            </a>
            <p className="mt-6 flex gap-6">
              {SITE.social.tiktok.url ? (
                <a
                  href={SITE.social.tiktok.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-line"
                >
                  TikTok
                </a>
              ) : null}
              {SITE.social.instagram.url ? (
                <a
                  href={SITE.social.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-line"
                >
                  Instagram
                </a>
              ) : null}
            </p>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
