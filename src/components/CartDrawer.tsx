import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Minus, Plus, Trash2, X } from 'lucide-react'
import { useCart } from '../context/cart'
import { formatPrice, productUrl } from '../lib/shop'
import SmartImage from './SmartImage'

export default function CartDrawer() {
  const {
    lines,
    count,
    total,
    isOpen,
    closeCart,
    setQty,
    remove,
    clear,
    checkout,
  } = useCart()

  useEffect(() => {
    if (!isOpen) return
    document.body.classList.add('no-scroll')
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCart()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('no-scroll')
    }
  }, [isOpen, closeCart])

  return (
    <>
      <div
        id="cart-overlay"
        className={isOpen ? 'is-open' : ''}
        aria-hidden="true"
        onClick={() => isOpen && closeCart()}
      />

      <aside
        id="cart-drawer"
        className={isOpen ? 'is-open' : ''}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-ink/15 px-5 py-4">
          <h2 className="font-serif text-3xl">
            Your cart{' '}
            <span className="text-base text-ink/60">{count ? `(${count})` : ''}</span>
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="grid h-11 w-11 place-items-center"
            aria-label="Close cart"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {lines.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-3xl">Your cart is empty.</p>
              <p className="mt-3 text-ink/70">
                Pick a colour and a size and it will appear here.
              </p>
              <Link to="/shop" onClick={closeCart} className="btn btn-dark mt-8">
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-ink/10">
              {lines.map((line) => (
                <li key={line.key} className="flex gap-4 py-5">
                  <Link
                    to={productUrl(line.product.id)}
                    onClick={closeCart}
                    className="img-frame block h-28 w-24 shrink-0"
                  >
                    <SmartImage src={line.image} alt={line.product.name} />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={productUrl(line.product.id)}
                        onClick={closeCart}
                        className="font-serif text-xl leading-tight"
                      >
                        {line.product.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(line.key)}
                        className="-mr-2 -mt-1 grid h-9 w-9 shrink-0 place-items-center text-ink/70 hover:text-ink"
                        aria-label={`Remove ${line.product.name} from cart`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <p className="mt-1 text-sm text-ink/70">
                      {[
                        line.item.colour && `Colour: ${line.item.colour}`,
                        line.item.size && `Size: ${line.item.size}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>

                    <p className="mt-1 text-sm">
                      {line.hasDiscount ? (
                        <span className="text-ink/50 line-through">
                          {formatPrice(line.originalPrice)}{' '}
                        </span>
                      ) : null}
                      <span className="font-semibold">
                        {formatPrice(line.currentPrice)}
                      </span>
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div
                        className="inline-flex items-center border border-ink/30"
                        role="group"
                        aria-label={`Quantity for ${line.product.name}`}
                      >
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => setQty(line.key, line.item.qty - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <span
                          className="grid h-9 w-9 place-items-center text-sm font-medium"
                          aria-live="polite"
                        >
                          {line.item.qty}
                        </span>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => setQty(line.key, line.item.qty + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatPrice(line.lineTotal)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 ? (
          <div className="border-t border-ink/15 bg-sand px-5 py-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm">Total</span>
              <span className="font-serif text-3xl">{formatPrice(total)}</span>
            </div>
            <p className="mt-2 text-xs text-ink/60">
              Checkout sends your cart to us on WhatsApp. We confirm the order,
              delivery and payment with you there.
            </p>
            <button
              type="button"
              onClick={checkout}
              className="btn btn-dark mt-4 w-full"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Checkout on WhatsApp
            </button>
            <button
              type="button"
              onClick={closeCart}
              className="btn btn-light mt-3 w-full"
            >
              Continue shopping
            </button>
            <button
              type="button"
              onClick={clear}
              className="link-line mx-auto mt-4 block text-xs text-ink/70"
            >
              Clear cart
            </button>
          </div>
        ) : null}
      </aside>
    </>
  )
}
