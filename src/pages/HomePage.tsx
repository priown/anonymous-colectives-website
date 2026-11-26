import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'
import {
  BANNERS,
  CAMPAIGNS,
  CATEGORIES,
  type Campaign,
  type Product,
} from '../data/catalogue'
import { useCatalogue } from '../context/catalogue'
import { useCart } from '../context/cart'
import { usePageMeta } from '../hooks/usePageMeta'
import {
  campaignProducts,
  formatPrice,
  priceInfo,
  productUrl,
  shopUrl,
} from '../lib/shop'
import NewsletterForm from '../components/NewsletterForm'
import Reveal from '../components/Reveal'
import SmartImage from '../components/SmartImage'
import SwapImage from '../components/SwapImage'

const PHRASES = [
  'Anonymous Collectives',
  'Stay low, stand out',
  'Streetwear without limits',
  'Anonymous Collectives',
]

const LOOKBOOK_LAYOUT = [
  'md:col-span-7',
  'md:col-span-5 md:mt-28',
  'md:col-span-4',
  'md:col-span-4 md:mt-20',
  'md:col-span-4 md:mt-40',
  'md:col-span-4',
  'md:col-span-4 md:mt-16',
  'md:col-span-4 md:mt-32',
]

function MarqueeStar() {
  return (
    <svg className="marquee-star" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z"
      />
    </svg>
  )
}

function FeaturedCategoryCard({
  category,
  images,
}: {
  category: (typeof CATEGORIES)[number]
  images: string[]
}) {
  return (
    <Link
      to={shopUrl({ category: category.name })}
      className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-sand"
    >
      <SwapImage
        images={images}
        fallback={category.image}
        alt={`${category.name} by Anonymous Collectives`}
        className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 lg:p-5">
        <h3 className="font-display text-base font-extrabold uppercase leading-tight tracking-[0.02em] text-white lg:text-xl">
          {category.name}
        </h3>
        <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90">
          Shop now
          <ArrowRight
            className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  )
}

function BestSellerCard({ product }: { product: Product }) {
  const { add, showToast } = useCart()
  const info = priceInfo(product)

  const quickAdd = () => {
    if (!product.available) return
    const colour = product.colours[0]?.name ?? ''
    const size = product.sizes[0] ?? ''
    add({ id: product.id, colour, size, qty: 1 })
    showToast(
      `${product.name}${
        colour ? ` (${colour}${size ? `, ${size}` : ''})` : ''
      } added to your cart`,
    )
  }

  return (
    <article className="flex h-full flex-col">
      <Link to={productUrl(product.id)} className="group relative block">
        <SwapImage
          images={product.images}
          alt={product.name}
          className="relative aspect-square w-full rounded-xl bg-[#EFEFEB] transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {!product.available ? (
          <span className="badge badge-out absolute left-3 top-3">Sold out</span>
        ) : null}
      </Link>

      <div className="mt-3 flex flex-1 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            to={productUrl(product.id)}
            className="block truncate text-sm font-medium text-ink"
          >
            {product.name}
          </Link>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
            {info.current <= 0 ? (
              <span className="text-ink/60">Price on request</span>
            ) : info.hasDiscount ? (
              <>
                <span className="text-ink/40 line-through">
                  {formatPrice(info.original)}
                </span>
                <span className="font-medium text-ink">
                  {formatPrice(info.current)}
                </span>
              </>
            ) : (
              <span className="text-ink/60">{formatPrice(info.current)}</span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={quickAdd}
          disabled={!product.available}
          className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink/30 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={
            product.available
              ? `Quick add ${product.name} to cart`
              : `${product.name} is sold out`
          }
          title={product.available ? 'Quick add to cart' : 'Sold out'}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}

export default function HomePage() {
  const { products, featuredCategories, bestSellers } = useCatalogue()
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const featuredCategoryCards = featuredCategories
    .map((name) => CATEGORIES.find((category) => category.name === name))
    .filter(
      (category): category is (typeof CATEGORIES)[number] => Boolean(category),
    )

  const bestSellerProducts = bestSellers
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product))

  usePageMeta({
    title: 'Anonymous Collectives | Stay Low. Stand Out.',
    description:
      'Anonymous Collectives is a streetwear label built on quiet confidence. Shop tank tops, beanies and more, and order on WhatsApp.',
  })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (activeCampaign && !dialog.open) dialog.showModal()
    if (!activeCampaign && dialog.open) dialog.close()
  }, [activeCampaign])

  const closeCampaign = () => setActiveCampaign(null)
  const worn = activeCampaign ? campaignProducts(products, activeCampaign) : []
  const categoryImages = (name: string) => [
    ...new Set(
      products.filter((product) => product.category === name).flatMap((product) => product.images),
    ),
  ]

  return (
    <main id="main">
      {/* 1. HERO BANNER */}
      <section
        className="on-dark relative isolate flex min-h-[calc(100svh-4rem)] items-end overflow-hidden bg-charcoal text-ivory lg:min-h-[calc(100svh-5rem)] lg:items-center"
        aria-label="Campaign"
      >
        <SmartImage
          src={BANNERS.hero.image}
          alt={BANNERS.hero.alt}
          className="banner-img object-[58%_30%] lg:object-[50%_30%]"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/35 to-charcoal/10 sm:hidden" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-charcoal/85 via-charcoal/40 to-transparent sm:block" />
        <div className="relative z-10 mx-auto w-full max-w-[90rem] px-5 pb-12 pt-24 lg:px-10 lg:pb-0 lg:pt-0">
          <h1 className="wordmark enter text-[12.5vw] sm:text-[min(10vw,6rem)] lg:text-[min(6.6vw,7rem)]">
            Anonymous
            <br />
            Collectives
          </h1>
          <p className="enter enter-2 mt-6 font-serif text-3xl italic sm:text-4xl lg:mt-8 lg:text-5xl">
            Stay Low. Stand Out.
          </p>
          <p className="enter enter-2 mt-3 max-w-md text-base text-ivory/85 lg:text-lg">
            A statement beyond the ordinary.
          </p>
          <div className="enter enter-3 mt-8 lg:mt-10">
            <Link to="/shop" className="btn btn-ivory w-full sm:w-auto">
              Explore Collection
            </Link>
          </div>
        </div>
      </section>

      {/* 2. FEATURED CATEGORIES */}
      <section
        className="mx-auto max-w-[90rem] px-5 pb-12 pt-12 lg:px-10 lg:pb-16 lg:pt-16"
        aria-labelledby="featured-categories-title"
      >
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <h2
            id="featured-categories-title"
            className="font-serif text-3xl lg:text-4xl"
          >
            Featured categories
          </h2>
          <Link
            to="/shop"
            className="link-line hidden pb-1 text-sm sm:inline-block"
          >
            View all products
          </Link>
        </Reveal>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
          {featuredCategoryCards.map((category) => (
            <Reveal key={category.name}>
              <FeaturedCategoryCard
                category={category}
                images={categoryImages(category.name)}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* 3. MARQUEE */}
      <section
        className="marquee"
        aria-label="Anonymous Collectives, Stay low, stand out, Streetwear without limits"
      >
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="marquee-group"
              aria-hidden={copy === 1 ? true : undefined}
            >
              {PHRASES.map((phrase, index) => (
                <span key={`${copy}-${index}`} className="contents">
                  <span className="marquee-item">{phrase}</span>
                  <MarqueeStar />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* 4. BEST SELLING */}
      <section
        className="mx-auto max-w-[90rem] px-5 py-20 lg:px-10 lg:py-28"
        aria-labelledby="best-selling-title"
      >
        <Reveal className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-ink/50">
            Best Sellers
          </p>
          <h2
            id="best-selling-title"
            className="mt-3 font-display text-4xl font-extrabold uppercase leading-none tracking-tight sm:text-5xl lg:text-6xl"
          >
            Best Selling
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-ink/60 sm:text-base">
            Our most loved pieces, chosen by you.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:mt-12 lg:grid-cols-4 lg:gap-x-6">
          {bestSellerProducts.slice(0, 4).map((product) => (
            <Reveal key={product.id}>
              <BestSellerCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* 5. SECOND CAMPAIGN BANNER */}
      <section
        className="on-dark relative isolate flex min-h-[78svh] items-end justify-center overflow-hidden bg-charcoal text-center text-ivory"
        aria-labelledby="beyond-title"
      >
        <SmartImage
          src={BANNERS.campaign.image}
          alt={BANNERS.campaign.alt}
          className="banner-img object-[70%_50%] lg:object-center"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-charcoal/10" />
        <Reveal className="relative z-10 mx-auto max-w-4xl px-5 pb-14 pt-32 lg:pb-20">
          <h2
            id="beyond-title"
            className="wordmark text-[11.5vw] sm:text-[min(9vw,6.5rem)]"
          >
            Beyond the ordinary.
          </h2>
          <p className="mt-5 font-serif text-3xl italic lg:text-4xl">
            Not made to blend in.
          </p>
          <div className="mt-8">
            <Link to="/shop" className="btn btn-ghost-ivory">
              Explore the collection
            </Link>
          </div>
        </Reveal>
      </section>

      {/* 7. AC LOOKBOOK */}
      <section id="lookbook" className="bg-sand/60 py-20 lg:py-28" aria-labelledby="look-title">
        <div className="mx-auto max-w-[90rem] px-5 lg:px-10">
          <Reveal className="max-w-2xl">
            <h2 id="look-title" className="font-serif text-4xl lg:text-6xl">
              AC Lookbook
            </h2>
            <p className="mt-4 text-ink/70">
              Photographed in walls, hallways and quiet corners. Tap a photo to see
              what's being worn.
            </p>
          </Reveal>

          <div
            id="lookbook-grid"
            className="mt-12 grid gap-x-6 gap-y-14 md:grid-cols-12 lg:mt-16"
          >
            {CAMPAIGNS.map((campaign, index) => (
              <Reveal
                key={campaign.id}
                as="figure"
                className={LOOKBOOK_LAYOUT[index % LOOKBOOK_LAYOUT.length]}
              >
                <button
                  type="button"
                  className="zoom block w-full text-left"
                  onClick={() => setActiveCampaign(campaign)}
                  aria-label={`${campaign.title}: see the products in this photo`}
                >
                  <div
                    className={`img-frame ${index === 0 ? 'aspect-[4/5]' : 'aspect-[3/4]'}`}
                  >
                    <SmartImage
                      src={campaign.image}
                      alt={campaign.alt}
                      loading="lazy"
                    />
                  </div>
                </button>
                <figcaption className="mt-4">
                  <p className="font-serif text-2xl lg:text-3xl">{campaign.title}</p>
                  <p className="mt-1 max-w-sm text-sm text-ink/70">{campaign.text}</p>
                </figcaption>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8. STAY LOW, STAND OUT */}
      <section
        className="on-dark bg-charcoal py-24 text-ivory lg:py-36"
        aria-labelledby="statement-title"
      >
        <div className="mx-auto max-w-[90rem] px-5 lg:px-10">
          <Reveal
            as="h2"
            id="statement-title"
            className="wordmark text-[13vw] sm:text-[min(11vw,7rem)] lg:text-[min(9vw,10rem)]"
          >
            Stay low.
            <br />
            Stand out.
          </Reveal>
          <Reveal className="mt-10 grid gap-8 lg:mt-16 lg:grid-cols-12">
            <p className="max-w-xl font-serif text-2xl leading-snug lg:col-span-6 lg:col-start-7 lg:text-3xl">
              You don't have to ask for attention to have it. This is confidence
              that stays quiet, and style that speaks for the person wearing it.
            </p>
            <div className="lg:col-span-6 lg:col-start-7">
              <Link to="/about" className="btn btn-ghost-ivory">
                Read our story
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 9. NEWSLETTER */}
      <section id="newsletter" className="bg-sand" aria-labelledby="news-title">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center lg:py-28">
          <Reveal
            as="h2"
            id="news-title"
            className="wordmark text-5xl lg:text-7xl"
          >
            Stay in the loop.
          </Reveal>
          <Reveal
            as="p"
            className="mx-auto mt-6 max-w-lg text-ink/70"
          >
            Be the first to discover new collections, exclusive releases and
            everything happening at Anonymous Collectives.
          </Reveal>
          <Reveal className="mx-auto mt-10 max-w-xl">
            <NewsletterForm />
          </Reveal>
        </div>
      </section>

      {/* Lookbook dialog */}
      <dialog
        id="lookbook-dialog"
        ref={dialogRef}
        className="lookbook"
        aria-labelledby="lb-title"
        onClose={closeCampaign}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeCampaign()
        }}
      >
        {activeCampaign ? (
          <div className="grid md:grid-cols-2">
            <div className="img-frame aspect-[4/5] md:aspect-auto md:min-h-[34rem]">
              <SmartImage src={activeCampaign.image} alt={activeCampaign.alt} />
            </div>
            <div className="flex flex-col p-6 lg:p-10">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeCampaign}
                  className="grid h-11 w-11 place-items-center"
                  aria-label="Close"
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
              <h3 id="lb-title" className="font-serif text-4xl">
                {activeCampaign.title}
              </h3>
              <p id="lb-text" className="mt-3 text-ink/70">
                {activeCampaign.text}
              </p>
              <h4 className="mt-8 text-sm font-semibold">Worn in this shot</h4>
              <ul id="lb-products" className="mt-2 divide-y divide-ink/10">
                {worn.length ? (
                  worn.map((product) => {
                    const info = priceInfo(product)
                    return (
                      <li key={product.id}>
                        <Link
                          to={productUrl(product.id)}
                          onClick={closeCampaign}
                          className="flex items-center gap-4 py-3"
                        >
                          <span className="img-frame block h-16 w-14 shrink-0">
                            <SmartImage src={product.images[0]} alt="" />
                          </span>
                          <span className="flex-1 font-serif text-xl">
                            {product.name}
                          </span>
                          <span className="text-sm font-semibold">
                            {formatPrice(info.current)}
                          </span>
                        </Link>
                      </li>
                    )
                  })
                ) : (
                  <li className="py-3 text-sm text-ink/70">
                    Products from this shoot are coming soon.
                  </li>
                )}
              </ul>
              <Link
                to="/shop"
                onClick={closeCampaign}
                className="btn btn-dark mt-8 w-full sm:w-auto"
              >
                Browse the shop
              </Link>
            </div>
          </div>
        ) : null}
      </dialog>
    </main>
  )
}
