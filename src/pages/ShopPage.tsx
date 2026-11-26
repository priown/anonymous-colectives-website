import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import {
  CATEGORIES,
  COLLECTIONS,
  type Product,
} from '../data/catalogue'
import { useCatalogue } from '../context/catalogue'
import { usePageMeta } from '../hooks/usePageMeta'
import {
  collectionImage,
  priceInfo,
  searchProducts,
  shopUrl,
} from '../lib/shop'
import ProductCard from '../components/ProductCard'
import Reveal from '../components/Reveal'
import SmartImage from '../components/SmartImage'

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size']

const STATE_KEYS = [
  'q',
  'category',
  'gender',
  'colour',
  'size',
  'avail',
  'flag',
  'collection',
  'sort',
] as const

type StateKey = (typeof STATE_KEYS)[number]
type ShopState = Record<StateKey, string>

const DEFAULTS: ShopState = {
  q: '',
  category: '',
  gender: '',
  colour: '',
  size: '',
  avail: '',
  flag: '',
  collection: '',
  sort: 'featured',
}

const unique = <T,>(values: T[]): T[] => [...new Set(values)]

const rankSize = (size: string) => {
  const index = SIZE_ORDER.indexOf(size)
  return index === -1 ? 99 : index
}

const sorters: Record<string, (a: Product, b: Product) => number> = {
  featured: (a, b) =>
    Number(b.isFeatured) - Number(a.isFeatured) ||
    Number(b.isBestSeller) - Number(a.isBestSeller) ||
    (b.dateAdded || '').localeCompare(a.dateAdded || ''),
  newest: (a, b) => (b.dateAdded || '').localeCompare(a.dateAdded || ''),
  'price-asc': (a, b) => priceInfo(a).current - priceInfo(b).current,
  'price-desc': (a, b) => priceInfo(b).current - priceInfo(a).current,
}

const initialSort = (): string => {
  try {
    return localStorage.getItem('ac:sort') || 'featured'
  } catch {
    return 'featured'
  }
}

const readState = (params: URLSearchParams, savedSort: string): ShopState => {
  const next: ShopState = { ...DEFAULTS }
  STATE_KEYS.forEach((key) => {
    const value = params.get(key)
    if (value !== null) next[key] = value
  })
  if (!params.has('sort')) next.sort = savedSort
  return next
}

const countActive = (state: ShopState): number =>
  ['gender', 'colour', 'size', 'avail', 'flag', 'collection'].filter(
    (key) => state[key as StateKey],
  ).length

const isFiltered = (state: ShopState): boolean =>
  STATE_KEYS.some((key) => key !== 'sort' && state[key] !== '')

type CollectionCardProps = {
  collection: (typeof COLLECTIONS)[number]
  image: string
  span: string
  count: number
  onSelect: (name: string) => void
}

function CollectionCard({
  collection,
  image,
  span,
  count,
  onSelect,
}: CollectionCardProps) {
  const [missing, setMissing] = useState(false)
  if (missing) return null

  return (
    <Reveal className={span}>
      <Link
        to={shopUrl({ collection: collection.name })}
        className="zoom relative block"
        onClick={(event) => {
          event.preventDefault()
          onSelect(collection.name)
        }}
      >
        <div className="img-frame aspect-[4/5] sm:aspect-[16/11] md:aspect-auto md:h-full md:min-h-[24rem]">
          <SmartImage
            src={image}
            alt={`${collection.name} collection`}
            loading="lazy"
            onMissing={() => setMissing(true)}
          />
          <div className="absolute inset-0 bg-charcoal/45" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-6 text-ivory lg:p-8">
          <h3 className="font-serif text-4xl">{collection.name}</h3>
          <p className="mt-2 max-w-sm text-sm opacity-90">{collection.description}</p>
          <span className="link-line mt-4 inline-block text-xs font-semibold uppercase tracking-[0.14em]">
            {count} {count === 1 ? 'piece' : 'pieces'}, view collection
          </span>
        </div>
      </Link>
    </Reveal>
  )
}

export default function ShopPage() {
  const { products, featuredCollections, bestSellers } = useCatalogue()
  const [searchParams, setSearchParams] = useSearchParams()
  const [savedSort, setSavedSort] = useState(initialSort)
  const [filtersOpen, setFiltersOpen] = useState(
    () => countActive(readState(new URLSearchParams(window.location.search), 'featured')) > 0,
  )

  usePageMeta({
    title: 'Shop | Anonymous Collectives',
    description:
      'Shop Anonymous Collectives: tees, tank tops, sleeveless tops, caps and beanies. Filter by category, colour and size, then order on WhatsApp.',
  })

  const state = useMemo(
    () => readState(searchParams, savedSort),
    [searchParams, savedSort],
  )

  const setFilter = (key: StateKey, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (!value || value === DEFAULTS[key]) next.delete(key)
    else next.set(key, value)
    setSearchParams(next, { replace: true })
  }

  const clearFilters = () => {
    const next = new URLSearchParams()
    if (state.sort !== DEFAULTS.sort) next.set('sort', state.sort)
    setSearchParams(next, { replace: true })
  }

  const changeSort = (value: string) => {
    setSavedSort(value)
    try {
      localStorage.setItem('ac:sort', value)
    } catch {
      /* storage unavailable */
    }
    setFilter('sort', value)
  }

  const { categories, genders, colourNames, sizes } = useMemo(() => {
    const colourMap = new Map<string, string>()
    products.forEach((product) =>
      product.colours.forEach((colour) => colourMap.set(colour.name, colour.hex)),
    )

    return {
      categories: unique([
        ...CATEGORIES.map((category) => category.name),
        ...products.map((product) => product.category),
      ]),
      genders: unique(products.map((product) => product.gender)).filter(Boolean),
      colourNames: [...colourMap.keys()],
      sizes: unique(products.flatMap((product) => product.sizes)).sort(
        (a, b) => rankSize(a) - rankSize(b),
      ),
    }
  }, [products])

  const results = useMemo(() => {
    const matches = state.q
      ? new Set(searchProducts(products, state.q).map((product) => product.id))
      : null

    return products.filter((product) => {
      if (matches && !matches.has(product.id)) return false
      if (state.category && product.category !== state.category) return false
      if (state.gender) {
        const ok =
          product.gender === state.gender ||
          (state.gender !== 'Unisex' && product.gender === 'Unisex')
        if (!ok) return false
      }
      if (state.colour && !product.colours.some((c) => c.name === state.colour))
        return false
      if (state.size && !product.sizes.includes(state.size)) return false
      if (state.avail === 'in' && !product.available) return false
      if (state.avail === 'out' && product.available) return false
      if (state.flag === 'new' && !product.isNewArrival) return false
      if (state.flag === 'best' && !product.isBestSeller) return false
      if (state.collection && product.collection !== state.collection) return false
      return true
    }).sort(sorters[state.sort] || sorters.featured)
  }, [products, state])

  const filtered = isFiltered(state)
  const activeCount = countActive(state)

  const scrollToResults = () => {
    window.setTimeout(() => {
      document
        .getElementById('all-products')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  const selectCategory = (category: string) => {
    setFilter('category', category)
    scrollToResults()
  }

  const selectCollection = (collection: string) => {
    setFilter('collection', collection)
    scrollToResults()
  }

  const newest = products
    .filter((product) => product.isNewArrival)
    .sort(sorters.newest)
    .slice(0, 4)
  const best = bestSellers
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product))
    .slice(0, 8)

  const shownCollections = featuredCollections
    .map((name) => COLLECTIONS.find((collection) => collection.name === name))
    .filter(
      (collection): collection is (typeof COLLECTIONS)[number] =>
        Boolean(collection),
    )
    .map((collection) => ({
      ...collection,
      image: collectionImage(products, collection),
    }))
    .filter(
      (collection): collection is typeof collection & { image: string } =>
        Boolean(collection.image),
    )

  return (
    <main id="main">
      {/* Page heading */}
      <section className="mx-auto max-w-[90rem] px-5 pb-10 pt-14 lg:px-10 lg:pb-14 lg:pt-24">
        <h1 className="wordmark enter text-[16vw] sm:text-[min(12vw,7rem)] lg:text-[min(9vw,9rem)]">
          Shop
        </h1>
        <p className="enter enter-2 mt-6 max-w-xl font-serif text-2xl leading-snug lg:text-3xl">
          Everything in the collection, from loud walls to quiet chests. Pick a
          piece, choose your size, and order on WhatsApp.
        </p>
      </section>

      {/* Category navigation */}
      <nav className="border-y border-ink/10" aria-label="Product categories">
        <div
          id="category-nav"
          className="no-scrollbar mx-auto flex max-w-[90rem] gap-2 overflow-x-auto px-5 py-4 lg:px-10"
        >
          <button
            type="button"
            className="chip"
            onClick={() => selectCategory('')}
            aria-pressed={state.category === ''}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className="chip"
              onClick={() => selectCategory(category)}
              aria-pressed={state.category === category}
            >
              {category}
            </button>
          ))}
        </div>
      </nav>

      {/* Curated rows (hidden while a filter or search is active) */}
      <div id="curated" className={filtered ? 'hidden' : ''}>
        <section
          className="mx-auto max-w-[90rem] px-5 py-16 lg:px-10 lg:py-24"
          aria-labelledby="new-title"
        >
          <Reveal
            as="h2"
            id="new-title"
            className="font-serif text-4xl lg:text-5xl"
          >
            New arrivals
          </Reveal>
          <div id="shop-new" className="rail mt-8 lg:mt-12">
            {newest.length ? (
              newest.map((product) => (
                <div key={product.id}>
                  <ProductCard product={product} hideIfMissing />
                </div>
              ))
            ) : (
              <p className="text-ink/70">New pieces are on the way.</p>
            )}
          </div>
        </section>

        <section
          className="border-t border-ink/10 bg-sand/60"
          aria-labelledby="best-title"
        >
          <div className="mx-auto max-w-[90rem] px-5 py-16 lg:px-10 lg:py-24">
            <Reveal
              as="h2"
              id="best-title"
              className="font-serif text-4xl lg:text-5xl"
            >
              Best sellers
            </Reveal>
            <div id="shop-best" className="rail mt-8 lg:mt-12">
              {best.length ? (
                best.map((product) => (
                  <div key={product.id}>
                    <ProductCard
                      product={product}
                      variant="editorial"
                      hideIfMissing
                    />
                  </div>
                ))
              ) : (
                <p className="text-ink/70">Best sellers will appear here.</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* All products + filters */}
      <section
        id="all-products"
        className="mx-auto max-w-[90rem] px-5 py-16 lg:px-10 lg:py-24"
        aria-labelledby="all-title"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="all-title" className="font-serif text-4xl lg:text-5xl">
            All products
          </h2>
          <p
            id="result-count"
            className="text-sm text-ink/70"
            role="status"
            aria-live="polite"
          >
            {results.length} {results.length === 1 ? 'product' : 'products'}
          </p>
        </div>

        {/* Search, sort and filter toggle */}
        <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <label htmlFor="f-q" className="sr-only">
              Search products
            </label>
            <input
              id="f-q"
              type="search"
              className="input pl-11"
              placeholder="Search products"
              autoComplete="off"
              value={state.q}
              onChange={(event) => setFilter('q', event.target.value)}
            />
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60"
              aria-hidden="true"
            />
          </div>

          <div>
            <label htmlFor="f-sort" className="sr-only">
              Sort products
            </label>
            <select
              id="f-sort"
              className="select sm:min-w-[13rem]"
              value={state.sort}
              onChange={(event) => changeSort(event.target.value)}
            >
              <option value="featured">Sort: Featured</option>
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Sort: Price, low to high</option>
              <option value="price-desc">Sort: Price, high to low</option>
            </select>
          </div>

          <button
            type="button"
            id="filters-toggle"
            className="btn btn-light lg:hidden"
            aria-expanded={filtersOpen}
            aria-controls="filter-panel"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filters{' '}
            {activeCount ? `(${activeCount})` : ''}
          </button>
        </div>

        {/* Filter panel */}
        <div
          id="filter-panel"
          className={`mt-3 gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-5 ${
            filtersOpen ? 'grid' : 'hidden'
          }`.trim()}
        >
          <div>
            <label htmlFor="f-gender" className="sr-only">
              Gender
            </label>
            <select
              id="f-gender"
              className="select"
              value={state.gender}
              onChange={(event) => setFilter('gender', event.target.value)}
            >
              <option value="">Gender: All</option>
              {genders.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="f-colour" className="sr-only">
              Colour
            </label>
            <select
              id="f-colour"
              className="select"
              value={state.colour}
              onChange={(event) => setFilter('colour', event.target.value)}
            >
              <option value="">Colour: All</option>
              {colourNames.map((colour) => (
                <option key={colour} value={colour}>
                  {colour}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="f-size" className="sr-only">
              Size
            </label>
            <select
              id="f-size"
              className="select"
              value={state.size}
              onChange={(event) => setFilter('size', event.target.value)}
            >
              <option value="">Size: All</option>
              {sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="f-avail" className="sr-only">
              Availability
            </label>
            <select
              id="f-avail"
              className="select"
              value={state.avail}
              onChange={(event) => setFilter('avail', event.target.value)}
            >
              <option value="">Availability: All</option>
              <option value="in">In stock</option>
              <option value="out">Sold out</option>
            </select>
          </div>

          <button type="button" className="btn btn-light" onClick={clearFilters}>
            Clear all
          </button>

          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-5">
            <button
              type="button"
              className="chip"
              aria-pressed={state.flag === 'new'}
              onClick={() => setFilter('flag', state.flag === 'new' ? '' : 'new')}
            >
              New arrivals
            </button>
            <button
              type="button"
              className="chip"
              aria-pressed={state.flag === 'best'}
              onClick={() => setFilter('flag', state.flag === 'best' ? '' : 'best')}
            >
              Best sellers
            </button>
            {state.collection ? (
              <button
                type="button"
                className="chip"
                aria-pressed="true"
                onClick={() => setFilter('collection', '')}
              >
                Collection: {state.collection} &times;
              </button>
            ) : null}
          </div>
        </div>

        <div
          id="product-grid"
          className={`mt-10 grid grid-cols-2 items-start gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 ${
            results.length ? '' : 'hidden'
          }`.trim()}
        >
          {results.map((product, index) => (
            <Reveal key={product.id}>
              <ProductCard
                product={product}
                variant={index % 5 === 2 ? 'editorial' : 'clean'}
              />
            </Reveal>
          ))}
        </div>

        <div
          id="empty-state"
          className={results.length ? 'hidden py-20 text-center' : 'py-20 text-center'}
        >
          <p className="font-serif text-3xl">Nothing matches that yet.</p>
          <p className="mt-3 text-ink/70">
            Try removing a filter or searching for something else.
          </p>
          <button type="button" className="btn btn-dark mt-8" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      </section>

      {/* Featured collections */}
      <section
        id="collections"
        className="border-t border-ink/10 bg-sand/60"
        aria-labelledby="coll-title"
      >
        <div className="mx-auto max-w-[90rem] px-5 py-16 lg:px-10 lg:py-24">
          <Reveal
            as="h2"
            id="coll-title"
            className="font-serif text-4xl lg:text-5xl"
          >
            Featured collections
          </Reveal>
          <Reveal as="p" className="mt-4 max-w-xl text-ink/70">
            Pick a collection to see only what's in it.
          </Reveal>

          <div
            id="shop-collections"
            className="mt-10 grid gap-6 md:grid-cols-12"
          >
            {shownCollections.map((collection, index) => {
              const span =
                shownCollections.length === 1
                  ? 'md:col-span-12'
                  : index % 3 === 0
                    ? 'md:col-span-7'
                    : 'md:col-span-5'
              const count = products.filter(
                (product) => product.collection === collection.name,
              ).length
              return (
                <CollectionCard
                  key={collection.name}
                  collection={collection}
                  image={collection.image}
                  span={span}
                  count={count}
                  onSelect={selectCollection}
                />
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
