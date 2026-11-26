import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Minus,
  Plus,
  ShoppingCart,
} from 'lucide-react'
import { SITE, type Colour, type Product } from '../data/catalogue'
import { useCatalogue } from '../context/catalogue'
import { usePageMeta } from '../hooks/usePageMeta'
import {
  findProduct,
  formatPrice,
  priceInfo,
  productUrl,
  shopUrl,
  sizeName,
  waLink,
} from '../lib/shop'
import { useCart } from '../context/cart'
import ProductCard from '../components/ProductCard'
import Reveal from '../components/Reveal'
import SmartImage from '../components/SmartImage'

type ProductPageProps = {
  id?: string
}

export default function ProductPage({ id }: ProductPageProps) {
  const { products } = useCatalogue()
  const product = findProduct(products, id)
  const { add, openCart, showToast } = useCart()

  const [colour, setColour] = useState<Colour | null>(() =>
    product && product.colours.length === 1 ? product.colours[0] : null,
  )
  const [size, setSize] = useState<string | null>(() =>
    product && product.sizes.length === 1 ? product.sizes[0] : null,
  )
  const [qty, setQty] = useState(1)
  const [imageIndex, setImageIndex] = useState(0)
  const [error, setError] = useState('')
  const [colourError, setColourError] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const [mainMissing, setMainMissing] = useState(false)

  usePageMeta({
    title: product
      ? `${product.name} | Anonymous Collectives`
      : 'Product not found | Anonymous Collectives',
    description: product
      ? `${product.name} from Anonymous Collectives. ${product.description}`.slice(0, 160)
      : 'Anonymous Collectives product details.',
    image: product?.images[0],
  })

  if (!product) {
    return (
      <main id="main">
        <div className="mx-auto max-w-[90rem] px-5 py-24 text-center lg:px-10">
          <h1 className="font-serif text-5xl">We couldn't find that product.</h1>
          <p className="mt-4 text-ink/70">
            The link may be old, or the piece may have been removed.
          </p>
          <Link to="/shop" className="btn btn-dark mt-8">
            Back to the shop
          </Link>
        </div>
      </main>
    )
  }

  const info = priceInfo(product)
  const hasColours = product.colours.length > 0
  const hasSizes = product.sizes.length > 0
  const mainImage = product.images[imageIndex]
  const previewColour = product.colours.find((c) => c.image === mainImage)
  const previewNote =
    previewColour && previewColour.preview
      ? `${previewColour.name} is a digital colour preview made from the original product photo. It is not a photograph of actual stock.`
      : ''

  const showImage = (index: number) => {
    const total = product.images.length
    setImageIndex(((index % total) + total) % total)
    setMainMissing(false)
  }

  const clearError = () => {
    setError('')
    setColourError(false)
    setSizeError(false)
  }

  const validate = (): boolean => {
    clearError()
    const missing: string[] = []
    if (hasColours && !colour) {
      missing.push('colour')
      setColourError(true)
    }
    if (hasSizes && !size) {
      missing.push('size')
      setSizeError(true)
    }
    if (missing.length) {
      setError(`Please choose your ${missing.join(' and ')} first.`)
      return false
    }
    return true
  }

  const addToCart = () => {
    if (!validate()) return
    add({
      id: product.id,
      colour: colour ? colour.name : '',
      size: size || '',
      qty,
    })
    showToast(
      `${product.name}${
        colour ? ` (${colour.name}${size ? `, ${size}` : ''})` : ''
      } added to your cart`,
    )
    openCart()
  }

  const orderOnWhatsApp = () => {
    if (!validate()) return

    const pageUrl = new URL(productUrl(product.id), window.location.href).href
    const lines = [
      'Hello Anonymous Collectives, I would like to order:',
      '',
      `Product: ${product.name}`,
    ]
    if (colour) lines.push(`Colour: ${colour.name}`)
    if (size) lines.push(`Size: ${sizeName(size)}`)
    if (qty > 1) lines.push(`Quantity: ${qty}`)
    if (info.hasDiscount) {
      lines.push(
        `Price: ${formatPrice(info.current)} (discounted from ${formatPrice(info.original)})`,
      )
    } else {
      lines.push(`Price: ${formatPrice(info.current)}`)
    }
    if (qty > 1) lines.push(`Total: ${formatPrice(info.current * qty)}`)
    lines.push(`Product page: ${pageUrl}`, '', 'Please let me know how to proceed with my order.')

    const url = waLink(lines.join('\n'))
    const opened = window.open(url, '_blank', 'noopener')
    if (!opened) window.location.assign(url)
  }

  const score = (other: Product) =>
    (other.category === product.category ? 2 : 0) +
    (other.collection === product.collection ? 1 : 0) +
    (other.gender === product.gender ? 0.5 : 0)

  const related = products.filter((other) => other.id !== product.id)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 4)

  return (
    <main id="main">
      <div className="mx-auto max-w-[90rem] px-5 pb-16 pt-6 lg:px-10 lg:pb-24 lg:pt-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-ink/60 lg:mb-10">
          <Link to="/shop" className="link-line">
            Shop
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <Link to={shopUrl({ category: product.category })} className="link-line">
            {product.category}
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          {/* Gallery */}
          <div className="grid gap-3 lg:grid-cols-[5.5rem_1fr] lg:items-start">
            <div className="gallery-main lg:order-2">
              <SmartImage
                key={mainImage}
                src={mainImage}
                alt={`${product.name}, photo ${imageIndex + 1}`}
                onMissing={() => setMainMissing(true)}
              />

              {product.images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => showImage(imageIndex - 1)}
                    className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-cream/90"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showImage(imageIndex + 1)}
                    className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center bg-cream/90"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </>
              ) : null}

              <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                {mainMissing ? (
                  <span className="badge badge-out">Mockup coming soon</span>
                ) : null}
                {!product.available ? (
                  <span className="badge badge-out">Sold out</span>
                ) : null}
                {info.hasDiscount ? (
                  <span className="badge badge-sale">Sale -{info.percent}%</span>
                ) : null}
                {product.isNewArrival ? (
                  <span className="badge badge-new">New</span>
                ) : null}
                {product.isBestSeller ? (
                  <span className="badge badge-best">Best Seller</span>
                ) : null}
              </div>
            </div>

            {product.images.length > 1 ? (
              <div
                className="no-scrollbar flex gap-2 overflow-x-auto lg:order-1 lg:flex-col lg:overflow-visible"
                role="group"
                aria-label="Product photos"
              >
                {product.images.map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    className="thumb aspect-[4/5] w-16 shrink-0 overflow-hidden sm:w-20 lg:w-full"
                    onClick={() => {
                      const match = product.colours.find((c) => c.image === src)
                      if (match) {
                        setColour(match)
                        clearError()
                      }
                      showImage(index)
                    }}
                    aria-label={`Show photo ${index + 1} of ${product.images.length}`}
                    aria-current={index === imageIndex}
                  >
                    <SmartImage src={src} alt="" />
                  </button>
                ))}
              </div>
            ) : null}

            <p
              className="preview-note text-xs text-ink/70 lg:order-3 lg:col-start-2"
              aria-live="polite"
            >
              {previewNote}
            </p>
          </div>

          {/* Information */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm text-ink/60">
              {product.category}
              {product.gender ? ` · ${product.gender}` : ''}
              {product.collection ? ` · ${product.collection}` : ''}
            </p>
            <h1 className="mt-2 font-serif text-4xl leading-tight lg:text-6xl">
              {product.name}
            </h1>

            <div className="mt-5">
              {info.current <= 0 ? (
                <span className="text-2xl font-semibold">Price on request</span>
              ) : info.hasDiscount ? (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-3xl font-semibold">
                    {formatPrice(info.current)}
                  </span>
                  <span className="text-lg text-ink/50 line-through">
                    {formatPrice(info.original)}
                  </span>
                  <span className="badge badge-sale">Save {info.percent}%</span>
                </div>
              ) : (
                <span className="text-3xl font-semibold">
                  {formatPrice(info.current)}
                </span>
              )}
            </div>

            <p className="mt-5 max-w-lg text-ink/80">{product.description}</p>

            <div className="mt-6 max-w-lg border-l-2 border-choc pl-5">
              <p className="font-serif text-xl italic leading-snug">
                {product.story || SITE.defaultStory}
              </p>
              {product.story ? (
                <p className="mt-3 text-sm text-ink/70">{SITE.defaultStory}</p>
              ) : null}
            </div>

            <p className="mt-5 flex items-center gap-2 text-sm font-medium">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  product.available ? 'bg-[#2F5A3A]' : 'bg-[#A3281F]'
                }`}
              />
              {product.available ? 'In stock' : 'Sold out'}
            </p>
            {product.availabilityNote ? (
              <p className="mt-1 text-sm text-ink/70">{product.availabilityNote}</p>
            ) : null}

            {hasColours ? (
              <div
                className={`mt-8 border border-transparent p-1 ${
                  colourError ? 'field-error' : ''
                }`.trim()}
              >
                <p className="mb-3 text-sm font-medium">
                  Colour:{' '}
                  <span className="font-normal text-ink/70">
                    {colour ? colour.name : 'Select a colour'}
                  </span>
                </p>
                <div className="flex flex-wrap gap-3 p-1" role="group" aria-label="Colour">
                  {product.colours.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      className="swatch"
                      style={{ background: option.hex }}
                      onClick={() => {
                        setColour(option)
                        if (option.image) {
                          const target = product.images.indexOf(option.image)
                          if (target > -1) showImage(target)
                        }
                        clearError()
                      }}
                      aria-pressed={colour?.name === option.name}
                      aria-label={option.name}
                      title={option.name}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {hasSizes ? (
              <div
                className={`mt-4 border border-transparent p-1 ${
                  sizeError ? 'field-error' : ''
                }`.trim()}
              >
                <p className="mb-3 text-sm font-medium">
                  Size:{' '}
                  <span className="font-normal text-ink/70">
                    {size || 'Select a size'}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Size">
                  {product.sizes.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="size-btn"
                      onClick={() => {
                        setSize(option)
                        clearError()
                      }}
                      aria-pressed={size === option}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-4 p-1">
              <p className="mb-3 text-sm font-medium" id="qty-label">
                Quantity
              </p>
              <div
                className="inline-flex items-center border border-ink/35"
                role="group"
                aria-labelledby="qty-label"
              >
                <button
                  type="button"
                  onClick={() => qty > 1 && setQty(qty - 1)}
                  disabled={qty <= 1}
                  className={`grid h-12 w-12 place-items-center ${
                    qty <= 1 ? 'opacity-40' : ''
                  }`.trim()}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <output
                  className="grid h-12 w-12 place-items-center text-sm font-medium"
                  aria-live="polite"
                >
                  {qty}
                </output>
                <button
                  type="button"
                  onClick={() => qty < 99 && setQty(qty + 1)}
                  className="grid h-12 w-12 place-items-center"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <p role="alert" className="msg-err mt-5 min-h-[1.25rem] text-sm">
              {error}
            </p>

            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={addToCart}
                className="btn btn-dark w-full"
                disabled={!product.available}
                aria-disabled={!product.available}
              >
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                {product.available ? 'Add to cart' : 'Sold out'}
              </button>
              <button
                type="button"
                onClick={orderOnWhatsApp}
                className="btn btn-light w-full"
                disabled={!product.available}
                aria-disabled={!product.available}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Order via WhatsApp
              </button>
            </div>

            {product.available ? (
              <p className="mt-3 text-xs text-ink/60">
                No online payment: add pieces to your cart and check out on
                WhatsApp, or order this one piece straight away. We confirm
                delivery and payment with you there.
              </p>
            ) : (
              <a
                className="link-line mt-4 inline-block text-sm"
                target="_blank"
                rel="noopener noreferrer"
                href={waLink(
                  `Hello Anonymous Collectives! Will the ${product.name} be back in stock soon?`,
                )}
              >
                Ask about restocks on WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {related.length ? (
        <section
          className="border-t border-ink/10 bg-sand/60"
          aria-labelledby="related-title"
        >
          <div className="mx-auto max-w-[90rem] px-5 py-16 lg:px-10 lg:py-24">
            <Reveal
              as="h2"
              id="related-title"
              className="font-serif text-4xl lg:text-5xl"
            >
              You may also like
            </Reveal>
            <div id="related-grid" className="rail mt-8 lg:mt-12">
              {related.map((other) => (
                <div key={other.id}>
                  <ProductCard product={other} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}
