import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useCart } from '../context/cart'
import CartDrawer from './CartDrawer'
import Footer from './Footer'
import Header from './Header'

function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const timer = window.setTimeout(() => {
        const target = document.querySelector(hash)
        if (target) target.scrollIntoView()
      }, 80)
      return () => window.clearTimeout(timer)
    }

    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}

export default function Layout() {
  const { toast } = useCart()

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-charcoal focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to content
      </a>

      <ScrollManager />
      <Header />
      <div className="h-16 lg:h-20" />

      <Outlet />

      <Footer />
      <CartDrawer />

      <div
        id="toast"
        className={`toast ${toast ? 'is-on' : ''}`.trim()}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </>
  )
}
