import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  CATEGORIES,
  COLLECTIONS,
  PRODUCTS as BASE_PRODUCTS,
  type Product,
} from '../data/catalogue'
import {
  CatalogueContext,
  type CatalogueContextValue,
  type CatalogueOverrides,
  type HomepageSelections,
  type PriceOverride,
  type PublishState,
} from './catalogue'
import {
  fetchRemoteOverrides,
  githubToken,
  publishOverrides,
} from '../lib/github'

const STORAGE_KEY = 'ac:catalogue'

const DEFAULT_FEATURED_COLLECTIONS = COLLECTIONS.map((collection) => collection.name)
const DEFAULT_BEST_SELLERS = BASE_PRODUCTS.filter(
  (product) => product.isBestSeller,
).map((product) => product.id)
const DEFAULT_FEATURED_CATEGORIES = CATEGORIES.slice(0, 5).map(
  (category) => category.name,
)

const DEFAULTS: CatalogueOverrides = {
  prices: {},
  images: {},
  featuredCollections: DEFAULT_FEATURED_COLLECTIONS,
  bestSellers: DEFAULT_BEST_SELLERS,
  featuredCategories: DEFAULT_FEATURED_CATEGORIES,
}

const collectionNames = new Set(COLLECTIONS.map((collection) => collection.name))
const productIds = new Set(BASE_PRODUCTS.map((product) => product.id))
const categoryNames = new Set(CATEGORIES.map((category) => category.name))

const uniqueStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string'))]
    : []

/**
 * The Stay Low Tee (ac-004) was merged into the Anonymous Tee (ac-005).
 * Move any admin uploads/prices saved under the old id so nothing is lost.
 */
const migrateOverrides = (overrides: CatalogueOverrides): CatalogueOverrides => {
  const prices = { ...overrides.prices }
  const images = { ...overrides.images }
  let changed = false

  if (prices['ac-004']) {
    if (!prices['ac-005']) prices['ac-005'] = prices['ac-004']
    delete prices['ac-004']
    changed = true
  }

  if (images['ac-004']) {
    if (!images['ac-005']) images['ac-005'] = images['ac-004']
    delete images['ac-004']
    changed = true
  }

  return changed ? { ...overrides, prices, images } : overrides
}

const normalizeOverrides = (
  raw: Partial<CatalogueOverrides> | null | undefined,
): CatalogueOverrides => {
  if (!raw || typeof raw !== 'object') return DEFAULTS

  const storedCollections = uniqueStrings(raw.featuredCollections).filter((name) =>
    collectionNames.has(name),
  )
  const storedBestSellers = uniqueStrings(raw.bestSellers).filter((id) =>
    productIds.has(id),
  )
  const storedCategories = uniqueStrings(raw.featuredCategories)
    .filter((name) => categoryNames.has(name))
    .slice(0, 5)

  const overrides: CatalogueOverrides = {
    prices: raw.prices && typeof raw.prices === 'object' ? raw.prices : {},
    images: raw.images && typeof raw.images === 'object' ? raw.images : {},
    featuredCollections:
      Array.isArray(raw.featuredCollections) && storedCollections.length
        ? storedCollections
        : DEFAULT_FEATURED_COLLECTIONS,
    bestSellers: Array.isArray(raw.bestSellers)
      ? storedBestSellers
      : DEFAULT_BEST_SELLERS,
    featuredCategories:
      Array.isArray(raw.featuredCategories) && storedCategories.length === 5
        ? storedCategories
        : DEFAULT_FEATURED_CATEGORIES,
  }

  return migrateOverrides(overrides)
}

const loadOverrides = (): CatalogueOverrides => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as
      | Partial<CatalogueOverrides>
      | null
    return normalizeOverrides(raw)
  } catch {
    return DEFAULTS
  }
}

const applyOverrides = (overrides: CatalogueOverrides): Product[] =>
  BASE_PRODUCTS.map((product) => {
    const price = overrides.prices[product.id]
    const old = price ? Number(price.old) || 0 : product.originalPrice
    const sale = price ? Number(price.sale) || 0 : Number(product.discountPrice) || 0
    const discount = sale > 0 && sale < old ? sale : null

    const images = overrides.images[product.id]

    return {
      ...product,
      originalPrice: old,
      discountPrice: discount,
      images: images && images.length ? images : product.images,
      isBestSeller: overrides.bestSellers.includes(product.id),
    }
  })

export function CatalogueProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<CatalogueOverrides>(loadOverrides)
  const [publishState, setPublishState] = useState<PublishState>(() =>
    githubToken()
      ? { status: 'idle', message: 'Connected. Changes publish automatically.' }
      : { status: 'local', message: 'Saved in this browser only. Log in with a GitHub token to publish.' },
  )
  const overridesRef = useRef(overrides)
  const publishChain = useRef<Promise<unknown>>(Promise.resolve())
  const revisionRef = useRef(0)
  const products = useMemo(() => applyOverrides(overrides), [overrides])

  useEffect(() => {
    overridesRef.current = overrides
  }, [overrides])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      const next = loadOverrides()
      overridesRef.current = next
      setOverrides(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Pull the published data from GitHub on every visit. Every browser sees it.
  useEffect(() => {
    let cancelled = false
    const revisionAtStart = revisionRef.current

    fetchRemoteOverrides()
      .then((raw) => {
        if (cancelled || !raw || revisionAtStart !== revisionRef.current) return
        const next = normalizeOverrides(raw)
        overridesRef.current = next
        setOverrides(next)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          /* storage blocked */
        }
      })
      .catch(() => {
        /* offline or GitHub unavailable: keep local defaults */
      })

    return () => {
      cancelled = true
    }
  }, [])

  const runPublish = useCallback(
    async (next: CatalogueOverrides, revision: number): Promise<boolean> => {
      const token = githubToken()
      if (!token) {
        if (revision === revisionRef.current) {
          setPublishState({
            status: 'local',
            message: 'Saved in this browser only. Log in with a GitHub token to publish.',
          })
        }
        return false
      }

      if (revision === revisionRef.current) {
        setPublishState({
          status: 'publishing',
          message: 'Publishing changes to the live site...',
        })
      }

      try {
        await publishOverrides(token, next)
        if (revision === revisionRef.current) {
          setPublishState({
            status: 'success',
            message:
              'Published to GitHub. The live site updates after its short deploy.',
          })
        }
        return true
      } catch (error) {
        if (revision === revisionRef.current) {
          setPublishState({
            status: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Could not publish changes to GitHub.',
          })
        }
        return false
      }
    },
    [],
  )

  const commit = useCallback(
    (next: CatalogueOverrides): boolean => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        overridesRef.current = next
        setOverrides(next)
      } catch {
        return false
      }

      const revision = ++revisionRef.current
      publishChain.current = publishChain.current
        .then(() => runPublish(next, revision))
        .catch(() => undefined)
      return true
    },
    [runPublish],
  )

  const savePrices = useCallback(
    (prices: Record<string, PriceOverride>) =>
      commit({ ...overridesRef.current, prices }),
    [commit],
  )

  const setProductImages = useCallback(
    (id: string, images: string[]) =>
      commit({
        ...overridesRef.current,
        images: { ...overridesRef.current.images, [id]: images },
      }),
    [commit],
  )

  const saveSelections = useCallback(
    (selections: HomepageSelections) =>
      commit({ ...overridesRef.current, ...selections }),
    [commit],
  )

  const resetPrices = useCallback(
    () => commit({ ...overridesRef.current, prices: {} }),
    [commit],
  )

  const resetProductImages = useCallback(
    (id: string) => {
      const images = { ...overridesRef.current.images }
      delete images[id]
      return commit({ ...overridesRef.current, images })
    },
    [commit],
  )

  const resetAll = useCallback(() => commit(DEFAULTS), [commit])

  const publishNow = useCallback(async (): Promise<boolean> => {
    await publishChain.current.catch(() => undefined)
    const revision = ++revisionRef.current
    return runPublish(overridesRef.current, revision)
  }, [runPublish])

  const value: CatalogueContextValue = {
    products,
    overrides,
    featuredCollections: overrides.featuredCollections,
    bestSellers: overrides.bestSellers,
    featuredCategories: overrides.featuredCategories,
    publishState,
    savePrices,
    setProductImages,
    saveSelections,
    resetPrices,
    resetProductImages,
    resetAll,
    publishNow,
  }

  return (
    <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>
  )
}
