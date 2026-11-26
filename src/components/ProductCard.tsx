import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../data/catalogue'
import { asset, formatPrice, priceInfo, productUrl } from '../lib/shop'
import SmartImage from './SmartImage'

type ProductCardProps = {
  product: Product
  variant?: 'clean' | 'editorial'
  hideIfMissing?: boolean
}

export default function ProductCard({
  product,
  variant = 'clean',
  hideIfMissing = false,
}: ProductCardProps) {
  const [missing, setMissing] = useState(false)
  const [altMissing, setAltMissing] = useState(false)
  const info = priceInfo(product)
  const editorial = variant === 'editorial'

  if (hideIfMissing && missing) return null

  const dots = product.colours.slice(0, 5)
  const moreDots =
    product.colours.length > 5 ? product.colours.length - 5 : null

  return (
    <Link
      to={productUrl(product.id)}
      className={`product-card zoom ${
        product.available ? '' : 'opacity-90'
      }`.trim()}
      data-product-id={product.id}
    >
      <div className={`img-frame relative ${editorial ? 'aspect-[3/4]' : 'aspect-[4/5]'}`}>
        <SmartImage
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          onMissing={() => setMissing(true)}
        />
        {product.images[1] && !editorial && !altMissing ? (
          <img
            src={asset(product.images[1])}
            alt=""
            className="card-alt-img"
            loading="lazy"
            onError={() => setAltMissing(true)}
          />
        ) : null}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {missing ? (
            <span className="badge badge-out">Mockup coming soon</span>
          ) : null}
          {!product.available ? <span className="badge badge-out">Sold out</span> : null}
          {info.hasDiscount ? (
            <span className="badge badge-sale">Sale -{info.percent}%</span>
          ) : null}
          {product.isNewArrival ? <span className="badge badge-new">New</span> : null}
          {product.isBestSeller ? (
            <span className="badge badge-best">Best Seller</span>
          ) : null}
          {product.isTopRecommended ? (
            <span className="badge badge-top">Top Recommended</span>
          ) : null}
        </div>
      </div>

      <div className="pt-4">
        <p className="text-xs text-ink/60">{product.category}</p>
        <h3
          className={`${
            editorial ? 'font-serif text-2xl lg:text-3xl' : 'font-serif text-xl lg:text-2xl'
          } mt-1 leading-tight`}
        >
          {product.name}
        </h3>

        <div className="mt-2 flex min-h-[1rem] items-center gap-1.5">
          {dots.map((colour) => (
            <span
              key={colour.name}
              className="swatch-dot"
              style={{ background: colour.hex }}
              title={colour.name}
            />
          ))}
          {moreDots ? <span className="text-xs text-ink/60">+{moreDots}</span> : null}
        </div>

        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm">
          {info.current <= 0 ? (
            <span className="font-semibold">Price on request</span>
          ) : info.hasDiscount ? (
            <>
              <span className="text-ink/50 line-through">
                {formatPrice(info.original)}
              </span>
              <span className="font-semibold">{formatPrice(info.current)}</span>
            </>
          ) : (
            <span className="font-semibold">{formatPrice(info.current)}</span>
          )}
        </p>

        <p className="mt-1 text-xs text-ink/60">
          {product.sizes.length ? product.sizes.join(' · ') : ''}
        </p>
        <span className="link-line mt-3 inline-block text-xs font-semibold uppercase tracking-[0.14em]">
          View product
        </span>
      </div>
    </Link>
  )
}
