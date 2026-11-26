import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react'
import { Link } from 'react-router-dom'
import {
  Download,
  ImagePlus,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
  Save,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import {
  CATEGORIES,
  COLLECTIONS,
  PRODUCTS as BASE_PRODUCTS,
  type Product,
} from '../data/catalogue'
import {
  useCatalogue,
  type HomepageSelections,
  type PriceOverride,
} from '../context/catalogue'
import { usePageMeta } from '../hooks/usePageMeta'
import {
  signInAdmin,
  signOutAdmin,
  watchAdminAuth,
} from '../lib/supabase'
import {
  isCloudinaryConfigured,
  uploadImageToCloudinary,
} from '../lib/cloudinary'
import { formatPrice } from '../lib/shop'
import SmartImage from '../components/SmartImage'

type PriceRow = {
  id: string
  old: string
  sale: string
}

type Notice = { text: string; kind: string }

const EMPTY_NOTICE: Notice = { text: '', kind: '' }
const MAX_IMAGE_EDGE = 1600
const STORAGE_WARNING_BYTES = 4 * 1024 * 1024

const DEFAULT_COLLECTION_SELECTION = COLLECTIONS.map((collection) => collection.name)
const DEFAULT_CATEGORY_SELECTION = CATEGORIES.slice(0, 5).map(
  (category) => category.name,
)
const DEFAULT_BEST_SELLER_SELECTION = BASE_PRODUCTS.filter(
  (product) => product.isBestSeller,
).map((product) => product.id)
const DEFAULT_TOP_RECOMMENDED_SELECTION = BASE_PRODUCTS.filter(
  (product) => product.isFeatured,
).map((product) => product.id)
const DEFAULT_FEATURED_PRODUCT_SELECTION = DEFAULT_TOP_RECOMMENDED_SELECTION
const DEFAULT_NEW_ARRIVAL_SELECTION = BASE_PRODUCTS.filter(
  (product) => product.isNewArrival,
).map((product) => product.id)

const buildRows = (products: Product[]): PriceRow[] =>
  products.map((product) => ({
    id: product.id,
    old: product.originalPrice ? String(product.originalPrice) : '',
    sale: product.discountPrice ? String(product.discountPrice) : '',
  }))

const compressImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the image.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('Could not load the image.'))
      image.onload = () => {
        const scale = Math.min(
          1,
          MAX_IMAGE_EDGE / Math.max(image.width, image.height),
        )
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext('2d')
        if (!context) {
          resolve(String(reader.result))
          return
        }
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })

function AdminPhoto({ src }: { src: string }) {
  const [missing, setMissing] = useState(false)

  return (
    <div className="img-frame relative aspect-[4/5]">
      <SmartImage src={src} alt="" loading="lazy" onMissing={() => setMissing(true)} />
      {missing ? (
        <span className="badge badge-out absolute right-2 top-2">Missing file</span>
      ) : null}
    </div>
  )
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Enter your username.')
      return
    }
    if (!password) {
      setError('Enter your password.')
      return
    }

    setBusy(true)
    try {
      await signInAdmin(username, password)
      onSuccess()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not sign in to the admin.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main id="main" className="mx-auto flex max-w-md flex-col px-5 py-20 lg:py-28">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">
        Private page
      </p>
      <h1 className="mt-3 font-serif text-5xl lg:text-6xl">Admin access</h1>
      <p className="mt-4 text-ink/70">
        Sign in with your admin username and password. No GitHub token or expiring
        access key is used.
      </p>

      <form onSubmit={submit} className="mt-10 space-y-5 border border-ink/20 p-6">
        <div>
          <label htmlFor="admin-username" className="mb-2 block text-sm font-medium">
            Username
          </label>
          <input
            id="admin-username"
            type="text"
            autoComplete="username"
            autoFocus
            className="input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="admin-password" className="mb-2 block text-sm font-medium">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <p role="alert" className="msg-err min-h-[1.25rem] text-sm">
          {error}
        </p>

        <button type="submit" className="btn btn-dark w-full" disabled={busy}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogIn className="h-4 w-4" aria-hidden="true" />
          )}
          {busy ? 'Signing in...' : 'Log in'}
        </button>
      </form>

      <p className="mt-5 text-xs leading-relaxed text-ink/60">
        Your password is checked against the admin account in the database.
        Stay signed in only on devices you trust.
      </p>
    </main>
  )
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const {
    products,
    overrides,
    featuredCollections,
    bestSellers,
    topRecommended,
    featuredProducts,
    newArrivals,
    featuredCategories,
    publishState,
    savePrices,
    setProductImages,
    saveSelections,
    resetPrices,
    resetProductImages,
    resetAll,
    publishNow,
    saveProductList,
  } = useCatalogue()



  const [rows, setRows] = useState<PriceRow[]>(() => buildRows(products))
  const [priceNotice, setPriceNotice] = useState<Notice>(EMPTY_NOTICE)
  const [copyNotice, setCopyNotice] = useState<Notice>(EMPTY_NOTICE)
  const [selectionNotice, setSelectionNotice] = useState<Notice>(EMPTY_NOTICE)
  const [selectedCollections, setSelectedCollections] = useState<string[]>(
    featuredCollections,
  )
  const [selectedBestSellers, setSelectedBestSellers] = useState<string[]>(
    bestSellers,
  )
  const [selectedTopRecommended, setSelectedTopRecommended] = useState<string[]>(
    topRecommended,
  )
  const [selectedFeaturedProducts, setSelectedFeaturedProducts] = useState<string[]>(
    featuredProducts,
  )
  const [selectedNewArrivals, setSelectedNewArrivals] = useState<string[]>(
    newArrivals,
  )
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    featuredCategories,
  )
  const [imageNotices, setImageNotices] = useState<Record<string, Notice>>({})
  const [pathValues, setPathValues] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [stockNotice, setStockNotice] = useState<Notice>(EMPTY_NOTICE)
  const [stockValues, setStockValues] = useState<Record<string, string>>({})

  const data = useMemo(
    () =>
      rows.map((row) => {
        const product = products.find((p) => p.id === row.id)
        const old = Number(row.old) || 0
        const sale = Number(row.sale) || 0
        const onSale = sale > 0 && sale < old
        const bad = sale > 0 && sale >= old
        return { row, product, old, sale, onSale, bad }
      }),
    [products, rows],
  )

  const priceOutput = useMemo(
    () =>
      `const PRICE_LIST = {\n${data
        .map(
          ({ product, old, sale, onSale }) =>
            `  "${product?.id}": { old: ${old || 0}, sale: ${
              onSale ? sale : 'null'
            } },   // ${product?.name}`,
        )
        .join('\n')}\n};`,
    [data],
  )

  const storageBytes = useMemo(
    () => new Blob([JSON.stringify(overrides)]).size,
    [overrides],
  )
  const storageKb = Math.round(storageBytes / 1024)

  const setImageNotice = (id: string, text: string, kind: string) => {
    setImageNotices((current) => ({ ...current, [id]: { text, kind } }))
  }

  const updateRow = (id: string, field: 'old' | 'sale', value: string) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    )
    setPriceNotice(EMPTY_NOTICE)
  }

  const savePriceChanges = () => {
    const invalid = data.find((entry) => !entry.old || entry.bad)
    if (invalid) {
      setPriceNotice({
        text: !invalid.old
          ? `Enter an old price for ${invalid.product?.name}.`
          : `The sale price for ${invalid.product?.name} must be lower than its old price.`,
        kind: 'msg-err',
      })
      return
    }

    const baseById = new Map(BASE_PRODUCTS.map((product) => [product.id, product]))
    const prices: Record<string, PriceOverride> = {}
    data.forEach(({ product, old, onSale, sale }) => {
      if (!product) return
      const base = baseById.get(product.id)
      const nextSale = onSale ? sale : null
      // Only store real overrides so later catalogue edits still flow through.
      if (base && old === base.originalPrice && nextSale === base.discountPrice) {
        return
      }
      prices[product.id] = { old, sale: nextSale }
    })

    if (savePrices(prices)) {
      setPriceNotice({
        text: 'Prices saved. The shop, product pages and cart now show them.',
        kind: 'msg-ok',
      })
    } else {
      setPriceNotice({
        text: 'Could not save in this browser. Storage may be full or blocked.',
        kind: 'msg-err',
      })
    }
  }

  const resetPriceChanges = () => {
    if (!window.confirm('Reset every price to the values in catalogue.ts?')) return
    if (resetPrices()) {
      setRows(buildRows(BASE_PRODUCTS))
      setPriceNotice({
        text: 'Prices reset to the catalogue defaults.',
        kind: 'msg-info',
      })
    }
  }

  const copyPriceList = async () => {
    try {
      await navigator.clipboard.writeText(priceOutput)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = priceOutput
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopyNotice({
      text: 'Copied. Paste it over PRICE_LIST in src/data/catalogue.ts to publish it.',
      kind: 'msg-ok',
    })
  }

  const toggleCollection = (name: string) => {
    setSelectionNotice(EMPTY_NOTICE)
    setSelectedCollections((current) => {
      if (current.includes(name)) {
        return current.length <= 1 ? current : current.filter((item) => item !== name)
      }
      return current.length >= 5 ? current : [...current, name]
    })
  }

  const toggleCategory = (name: string) => {
    setSelectionNotice(EMPTY_NOTICE)
    setSelectedCategories((current) => {
      if (current.includes(name)) {
        return current.filter((item) => item !== name)
      }
      return current.length >= 5 ? current : [...current, name]
    })
  }

  const toggleBestSeller = (id: string) => {
    setSelectionNotice(EMPTY_NOTICE)
    setSelectedBestSellers((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id)
      }
      return current.length >= 8 ? current : [...current, id]
    })
  }

  const toggleProductGroup = (
    id: string,
    setGroup: Dispatch<SetStateAction<string[]>>,
  ) => {
    setSelectionNotice(EMPTY_NOTICE)
    setGroup((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length >= 8
          ? current
          : [...current, id],
    )
  }

  const saveSelectionChanges = () => {
    if (!selectedCollections.length) {
      setSelectionNotice({
        text: 'Choose at least one featured collection.',
        kind: 'msg-err',
      })
      return
    }
    if (selectedCategories.length !== 5) {
      setSelectionNotice({
        text: 'Choose exactly five featured categories for the homepage row.',
        kind: 'msg-err',
      })
      return
    }
    if (!selectedBestSellers.length) {
      setSelectionNotice({
        text: 'Choose at least one best-selling product.',
        kind: 'msg-err',
      })
      return
    }

    const selections: HomepageSelections = {
      featuredCollections: selectedCollections,
      bestSellers: selectedBestSellers,
      topRecommended: selectedTopRecommended,
      featuredProducts: selectedFeaturedProducts,
      newArrivals: selectedNewArrivals,
      featuredCategories: selectedCategories,
    }

    if (saveSelections(selections)) {
      setSelectionNotice({
        text: 'Homepage selections saved. The shop and homepage now use them.',
        kind: 'msg-ok',
      })
    } else {
      setSelectionNotice({
        text: 'Could not save in this browser. Storage may be full or blocked.',
        kind: 'msg-err',
      })
    }
  }

  const saveStock = async () => {
    const next = products.map((product) => ({
      ...product,
      quantity: Math.max(
        0,
        Number(stockValues[product.id] ?? product.quantity ?? 0) || 0,
      ),
    }))
    const ok = await saveProductList(next)
    setStockNotice({
      text: ok
        ? 'Stock saved for every visitor.'
        : 'Could not save stock. Check your connection and try again.',
      kind: ok ? 'msg-ok' : 'msg-err',
    })
  }

  const resetSelectionChanges = () => {
    if (!window.confirm('Reset the featured and best-seller selections?')) return
    setSelectedCollections(DEFAULT_COLLECTION_SELECTION)
    setSelectedCategories(DEFAULT_CATEGORY_SELECTION)
    setSelectedBestSellers(DEFAULT_BEST_SELLER_SELECTION)
    setSelectedTopRecommended(DEFAULT_TOP_RECOMMENDED_SELECTION)
    setSelectedFeaturedProducts(DEFAULT_FEATURED_PRODUCT_SELECTION)
    setSelectedNewArrivals(DEFAULT_NEW_ARRIVAL_SELECTION)
    if (
      saveSelections({
        featuredCollections: DEFAULT_COLLECTION_SELECTION,
        bestSellers: DEFAULT_BEST_SELLER_SELECTION,
        topRecommended: DEFAULT_TOP_RECOMMENDED_SELECTION,
        featuredProducts: DEFAULT_FEATURED_PRODUCT_SELECTION,
        newArrivals: DEFAULT_NEW_ARRIVAL_SELECTION,
        featuredCategories: DEFAULT_CATEGORY_SELECTION,
      })
    ) {
      setSelectionNotice({
        text: 'Selections reset to the catalogue defaults.',
        kind: 'msg-info',
      })
    }
  }

  const addFiles = async (product: Product, files: FileList | null) => {
    if (!files || !files.length) return
    setBusyId(product.id)
    setImageNotice(product.id, 'Processing photos for Cloudinary...', 'msg-info')

    const accepted: string[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      try {
        accepted.push(await compressImage(file))
      } catch {
        /* skip unreadable file */
      }
    }

    if (!accepted.length) {
      setImageNotice(product.id, 'No readable image files were selected.', 'msg-err')
      setBusyId(null)
      return
    }

    if (!isCloudinaryConfigured) {
      setImageNotice(
        product.id,
        'Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to the deployment variables.',
        'msg-err',
      )
      setBusyId(null)
      return
    }

    const uploaded: string[] = []
    let failed = 0
    for (const image of accepted) {
      try {
        uploaded.push(await uploadImageToCloudinary(image))
      } catch {
        failed += 1
      }
    }

    if (!uploaded.length) {
      setImageNotice(
        product.id,
        'Cloudinary rejected the upload. Check the unsigned upload preset.',
        'msg-err',
      )
      setBusyId(null)
      return
    }

    const ok = setProductImages(product.id, [...product.images, ...uploaded])
    setImageNotice(
      product.id,
      ok
        ? `${uploaded.length} photo${
            uploaded.length === 1 ? '' : 's'
          } uploaded to Cloudinary and added${
            failed ? ` (${failed} failed)` : ''
          }. Publishing to the live site...`
        : 'Could not save these photos. Browser storage may be full.',
      ok ? 'msg-ok' : 'msg-err',
    )
    setBusyId(null)
  }

  const addImagePath = (product: Product) => {
    const value = (pathValues[product.id] || '').trim()
    if (!value) {
      setImageNotice(product.id, 'Enter an image path or URL first.', 'msg-err')
      return
    }
    if (product.images.includes(value)) {
      setImageNotice(product.id, 'That image is already in this product.', 'msg-info')
      return
    }
    const ok = setProductImages(product.id, [...product.images, value])
    if (ok) {
      setPathValues((current) => ({ ...current, [product.id]: '' }))
      setImageNotice(product.id, 'Image path added.', 'msg-ok')
    } else {
      setImageNotice(product.id, 'Could not save this change.', 'msg-err')
    }
  }

  const removeImage = (product: Product, index: number) => {
    if (product.images.length <= 1) {
      setImageNotice(
        product.id,
        'A product needs at least one image. Add another photo first.',
        'msg-err',
      )
      return
    }
    const ok = setProductImages(
      product.id,
      product.images.filter((_, imageIndex) => imageIndex !== index),
    )
    setImageNotice(
      product.id,
      ok ? 'Photo removed.' : 'Could not save this change.',
      ok ? 'msg-ok' : 'msg-err',
    )
  }

  const makeCover = (product: Product, index: number) => {
    if (index === 0) return
    const next = [
      product.images[index],
      ...product.images.filter((_, imageIndex) => imageIndex !== index),
    ]
    const ok = setProductImages(product.id, next)
    setImageNotice(
      product.id,
      ok ? 'Cover photo updated.' : 'Could not save this change.',
      ok ? 'msg-ok' : 'msg-err',
    )
  }

  const resetImages = (product: Product) => {
    if (!window.confirm(`Reset photos for ${product.name} to the catalogue defaults?`))
      return
    const ok = resetProductImages(product.id)
    setImageNotice(
      product.id,
      ok ? 'Photos reset to the catalogue defaults.' : 'Could not save this change.',
      ok ? 'msg-info' : 'msg-err',
    )
  }

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(overrides, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'anonymous-collectives-admin-changes.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const resetEverything = () => {
    if (
      !window.confirm(
        'Reset every admin change? This also resets the live website for all visitors. This cannot be undone.',
      )
    )
      return
    resetAll()
    setRows(buildRows(BASE_PRODUCTS))
    setSelectedCollections(DEFAULT_COLLECTION_SELECTION)
    setSelectedCategories(DEFAULT_CATEGORY_SELECTION)
    setSelectedBestSellers(DEFAULT_BEST_SELLER_SELECTION)
    setSelectionNotice(EMPTY_NOTICE)
    setImageNotices({})
    setPriceNotice({
      text: 'All admin changes were reset to the catalogue defaults.',
      kind: 'msg-info',
    })
  }

  const logout = () => {
    void signOutAdmin()
    onLogout()
  }

  return (
    <main id="main" className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">
            Signed in as Admin
          </p>
          <h1 className="mt-2 font-serif text-5xl lg:text-6xl">Manage the shop</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/shop" className="btn btn-light">
            View shop
          </Link>
          <button type="button" onClick={logout} className="btn btn-light">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
          </button>
        </div>
      </div>

      <p className="mt-4 max-w-3xl text-ink/70">
        Edit prices, photos and homepage selections below. Saves go to the live
        storefront database, so every visitor on every device sees them.
      </p>

      <div className="mt-6 border border-ink/15 bg-sand/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">
              Live storefront{' '}
              <span className="font-normal text-ink/60">· Supabase</span>
            </p>
            <p
              role="status"
              className={`mt-1 text-sm ${
                publishState.status === 'error'
                  ? 'msg-err'
                  : publishState.status === 'success'
                    ? 'msg-ok'
                    : publishState.status === 'publishing'
                      ? 'msg-info'
                      : 'text-ink/60'
              }`.trim()}
            >
              {publishState.message ||
                'Connected. Changes publish to every visitor automatically.'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-light"
            onClick={() => void publishNow()}
            disabled={publishState.status === 'publishing'}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {publishState.status === 'publishing'
              ? 'Publishing...'
              : 'Publish current data'}
          </button>
        </div>
      </div>

      {/* PRICES */}
      <section className="mt-16" aria-labelledby="prices-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="prices-title" className="font-serif text-4xl">
            1. Prices
          </h2>
          <span className="text-xs text-ink/60">
            {data.length} products
          </span>
        </div>
        <p className="mt-3 max-w-2xl text-ink/70">
          The <strong>old price</strong> is shown crossed out. The{' '}
          <strong>sale price</strong> is what the customer pays. Leave the sale price
          empty when a product is not on sale.
        </p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[38rem] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/20">
                <th className="py-3 pr-3 font-semibold">Product</th>
                <th className="py-3 pr-3 font-semibold">Old price (₦)</th>
                <th className="py-3 pr-3 font-semibold">Sale price (₦)</th>
                <th className="py-3 font-semibold">Customer sees</th>
              </tr>
            </thead>
            <tbody>
              {data.map(({ row, product, old, sale, onSale, bad }) => (
                <tr key={row.id} className="border-b border-ink/10">
                  <td className="py-3 pr-3">
                    <span className="font-medium">{product?.name}</span>
                    <br />
                    <span className="text-xs text-ink/60">{row.id}</span>
                  </td>
                  <td className="py-3 pr-3">
                    <label className="sr-only" htmlFor={`old-${row.id}`}>
                      Old price for {product?.name}
                    </label>
                    <input
                      id={`old-${row.id}`}
                      type="number"
                      min={0}
                      step={100}
                      inputMode="numeric"
                      className="input w-36"
                      value={row.old}
                      onChange={(event) =>
                        updateRow(row.id, 'old', event.target.value)
                      }
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <label className="sr-only" htmlFor={`sale-${row.id}`}>
                      Sale price for {product?.name}
                    </label>
                    <input
                      id={`sale-${row.id}`}
                      type="number"
                      min={0}
                      step={100}
                      inputMode="numeric"
                      className="input w-36"
                      value={row.sale}
                      placeholder="no sale"
                      onChange={(event) =>
                        updateRow(row.id, 'sale', event.target.value)
                      }
                    />
                  </td>
                  <td className="py-3 text-sm">
                    {!old ? (
                      <span className="msg-err">Enter the old price</span>
                    ) : bad ? (
                      <span className="msg-err">
                        Sale price must be lower than the old price
                      </span>
                    ) : onSale ? (
                      <>
                        <span className="text-ink/50 line-through">
                          {formatPrice(old)}
                        </span>{' '}
                        <strong>{formatPrice(sale)}</strong>{' '}
                        <span className="text-ink/60">
                          (-{Math.round((1 - sale / old) * 100)}%)
                        </span>
                      </>
                    ) : (
                      <strong>{formatPrice(old)}</strong>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-dark" onClick={savePriceChanges}>
            <Save className="h-4 w-4" aria-hidden="true" /> Save prices
          </button>
          <button type="button" className="btn btn-light" onClick={resetPriceChanges}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Reset prices
          </button>
          <button type="button" className="btn btn-light" onClick={copyPriceList}>
            Copy price list
          </button>
          <span role="status" className={`text-sm ${priceNotice.kind}`.trim()}>
            {priceNotice.text}
          </span>
        </div>

        <details className="mt-8 text-sm">
          <summary className="cursor-pointer font-medium">
            Code for src/data/catalogue.ts
          </summary>
          <p className="mt-3 max-w-2xl text-ink/70">
            Copy this over <code>PRICE_LIST</code> in{' '}
            <code>src/data/catalogue.ts</code> if you want the prices baked into the
            site for every visitor. Copied text includes unsaved edits currently in
            the table.
          </p>
          <textarea
            rows={12}
            readOnly
            className="input mt-3 font-mono text-xs"
            value={priceOutput}
          />
          <p role="status" className={`mt-2 text-sm ${copyNotice.kind}`.trim()}>
            {copyNotice.text}
          </p>
        </details>
      </section>

      {/* STOCK */}
      <section className="mt-16" aria-labelledby="stock-title">
        <h2 id="stock-title" className="font-serif text-4xl">
          Stock
        </h2>
        <p className="mt-3 max-w-2xl text-ink/70">
          Quantity is stored in the products table. Set a product to 0 when it is
          out of stock.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <label
              key={product.id}
              className="flex items-center justify-between gap-3 border border-ink/15 p-3 text-sm"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{product.name}</span>
                <span className="block text-xs text-ink/60">{product.id}</span>
              </span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className="input w-24"
                value={stockValues[product.id] ?? String(product.quantity ?? 0)}
                onChange={(event) =>
                  setStockValues((current) => ({
                    ...current,
                    [product.id]: event.target.value,
                  }))
                }
                aria-label={`Stock quantity for ${product.name}`}
              />
            </label>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => void saveStock()}
          >
            <Save className="h-4 w-4" aria-hidden="true" /> Save stock
          </button>
          <span role="status" className={`text-sm ${stockNotice.kind}`.trim()}>
            {stockNotice.text}
          </span>
        </div>
      </section>

      {/* HOMEPAGE SELECTIONS */}
      <section className="mt-20" aria-labelledby="selections-title">
        <h2 id="selections-title" className="font-serif text-4xl">
          2. Homepage selections
        </h2>
        <p className="mt-3 max-w-3xl text-ink/70">
          Choose the five categories under the hero, the collections shown on the
          shop&apos;s featured row, and the products that appear as best sellers.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="border border-ink/15 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-serif text-2xl">Featured categories</h3>
              <span className="text-xs text-ink/60">
                {selectedCategories.length}/5 selected
              </span>
            </div>
            <p className="mt-1 text-xs text-ink/60">
              These are the five cards in the new row directly below the homepage
              hero.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {CATEGORIES.map((category) => {
                const checked = selectedCategories.includes(category.name)
                const disabled = !checked && selectedCategories.length >= 5
                return (
                  <label
                    key={category.name}
                    className={`flex items-center gap-3 border p-3 text-sm ${
                      checked ? 'border-ink bg-ink/5' : 'border-ink/15'
                    } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`.trim()}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleCategory(category.name)}
                      className="h-4 w-4 accent-[#A83232]"
                    />
                    <span>{category.name}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="border border-ink/15 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-serif text-2xl">Featured collections</h3>
              <span className="text-xs text-ink/60">
                {selectedCollections.length} selected
              </span>
            </div>
            <p className="mt-1 text-xs text-ink/60">
              Shown in the shop&apos;s featured collections row. Choose 3–5 (all
              available collections are listed).
            </p>
            <div className="mt-4 space-y-2">
              {COLLECTIONS.map((collection) => {
                const checked = selectedCollections.includes(collection.name)
                return (
                  <label
                    key={collection.name}
                    className={`flex cursor-pointer items-start gap-3 border p-3 text-sm ${
                      checked ? 'border-ink bg-ink/5' : 'border-ink/15'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCollection(collection.name)}
                      className="mt-0.5 h-4 w-4 accent-[#A83232]"
                    />
                    <span>
                      <span className="block font-medium">{collection.name}</span>
                      <span className="mt-0.5 block text-xs text-ink/60">
                        {collection.description}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 border border-ink/15 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-serif text-2xl">Best-selling products</h3>
            <span className="text-xs text-ink/60">
              {selectedBestSellers.length}/8 selected
            </span>
          </div>
          <p className="mt-1 text-xs text-ink/60">
            These get the Best Seller badge and feed the shop row. The first four
            selected appear in the homepage Best Selling row; select four for a
            full row.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const checked = selectedBestSellers.includes(product.id)
              const disabled = !checked && selectedBestSellers.length >= 8
              return (
                <label
                  key={product.id}
                  className={`flex items-center gap-3 border p-3 text-sm ${
                    checked ? 'border-ink bg-ink/5' : 'border-ink/15'
                  } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`.trim()}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleBestSeller(product.id)}
                    className="h-4 w-4 accent-[#A83232]"
                  />
                  <span>
                    <span className="block font-medium">{product.name}</span>
                    <span className="block text-xs text-ink/60">{product.id}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="mt-6 border border-ink/15 p-5">
          <h3 className="font-serif text-2xl">Product labels</h3>
          <p className="mt-1 text-xs text-ink/60">
            Assign products to additional merchandising groups. Each group can
            contain up to eight products and a product may belong to multiple groups.
          </p>
          <div className="mt-4 grid gap-5 lg:grid-cols-3">
            {[
              {
                title: 'Top recommended',
                values: selectedTopRecommended,
                setter: setSelectedTopRecommended,
              },
              {
                title: 'Featured products',
                values: selectedFeaturedProducts,
                setter: setSelectedFeaturedProducts,
              },
              {
                title: 'New arrivals',
                values: selectedNewArrivals,
                setter: setSelectedNewArrivals,
              },
            ].map((group) => (
              <div key={group.title}>
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.12em]">
                    {group.title}
                  </h4>
                  <span className="text-xs text-ink/60">
                    {group.values.length}/8
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {products.map((product) => {
                    const checked = group.values.includes(product.id)
                    const disabled = !checked && group.values.length >= 8
                    return (
                      <label
                        key={`${group.title}-${product.id}`}
                        className={`flex items-center gap-2 border p-2 text-sm ${
                          checked ? 'border-ink bg-ink/5' : 'border-ink/15'
                        } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`.trim()}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleProductGroup(product.id, group.setter)}
                          className="h-4 w-4 accent-[#A83232]"
                        />
                        <span className="truncate">{product.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn btn-dark"
            onClick={saveSelectionChanges}
          >
            <Save className="h-4 w-4" aria-hidden="true" /> Save selections
          </button>
          <button
            type="button"
            className="btn btn-light"
            onClick={resetSelectionChanges}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Reset selections
          </button>
          <span role="status" className={`text-sm ${selectionNotice.kind}`.trim()}>
            {selectionNotice.text}
          </span>
        </div>
      </section>

      {/* IMAGES */}
      <section className="mt-20" aria-labelledby="images-title">
        <h2 id="images-title" className="font-serif text-4xl">
          3. Product photos
        </h2>
        <p className="mt-3 max-w-3xl text-ink/70">
          Add photos from your device or point to a file already in{' '}
          <code>public/assets</code>. The first photo is the product card image; use{' '}
          <strong>Cover</strong> to change it.
        </p>
        <p className="mt-3 max-w-3xl border-l-2 border-choc pl-4 text-sm text-ink/70">
          Device uploads go to Supabase Storage and appear for every visitor. You
          can also point to an existing file in <code>public/assets</code>.
        </p>

        <div className="mt-8 space-y-6">
          {products.map((product) => {
            const notice = imageNotices[product.id] || EMPTY_NOTICE
            const customImages = Boolean(overrides.images[product.id])
            return (
              <div key={product.id} className="border border-ink/15 p-5 lg:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-2xl">
                      {product.name}{' '}
                      <span className="text-sm text-ink/60">{product.id}</span>
                    </h3>
                    <p className="mt-1 text-xs text-ink/60">
                      {product.images.length} photo
                      {product.images.length === 1 ? '' : 's'}
                      {customImages ? ' · edited in admin' : ' · catalogue defaults'}
                    </p>
                  </div>
                  {customImages ? (
                    <button
                      type="button"
                      onClick={() => resetImages(product)}
                      className="link-line text-xs text-ink/70"
                    >
                      Reset this product's photos
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {product.images.map((src, index) => (
                    <div key={`${product.id}-${index}-${src.slice(0, 32)}`}>
                      <div className="relative">
                        <AdminPhoto src={src} />
                        {index === 0 ? (
                          <span className="badge badge-best absolute left-2 top-2">
                            Cover
                          </span>
                        ) : null}
                        {src.startsWith('data:') ? (
                          <span className="badge badge-new absolute bottom-2 left-2">
                            Local
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => makeCover(product, index)}
                          disabled={index === 0}
                          className={`inline-flex items-center gap-1 ${
                            index === 0 ? 'text-ink/30' : 'link-line text-ink/70'
                          }`}
                        >
                          <Star className="h-3 w-3" aria-hidden="true" /> Cover
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(product, index)}
                          className="inline-flex items-center gap-1 text-ink/60 hover:text-choc"
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <label
                    htmlFor={`upload-${product.id}`}
                    className="btn btn-light cursor-pointer"
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    {busyId === product.id ? 'Adding...' : 'Add photos'}
                  </label>
                  <input
                    id={`upload-${product.id}`}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={busyId === product.id}
                    onChange={(event) => {
                      void addFiles(product, event.target.files)
                      event.target.value = ''
                    }}
                  />

                  <div className="flex gap-2">
                    <label htmlFor={`path-${product.id}`} className="sr-only">
                      Image path or URL for {product.name}
                    </label>
                    <input
                      id={`path-${product.id}`}
                      type="text"
                      className="input flex-1"
                      placeholder="assets/products/... or https://..."
                      value={pathValues[product.id] || ''}
                      onChange={(event) =>
                        setPathValues((current) => ({
                          ...current,
                          [product.id]: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addImagePath(product)
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-light px-4"
                      onClick={() => addImagePath(product)}
                    >
                      <ImagePlus className="h-4 w-4" aria-hidden="true" /> Add path
                    </button>
                  </div>
                </div>

                <p
                  role="status"
                  className={`mt-3 min-h-[1.25rem] text-sm ${
                    notice.kind
                  }`.trim()}
                >
                  {notice.text}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* STORAGE */}
      <section className="mt-20" aria-labelledby="storage-title">
        <h2 id="storage-title" className="font-serif text-4xl">
          4. Storage &amp; backup
        </h2>
        <p className="mt-3 max-w-2xl text-ink/70">
          Admin changes are saved to Supabase as the live storefront data, with a
          local copy for fast loading (about <strong>{storageKb} KB</strong>{' '}
          currently). Every browser reads the Supabase copy, so changes appear
          everywhere. The local copy alone is not enough to update other visitors.
        </p>
        {storageBytes > STORAGE_WARNING_BYTES ? (
          <p className="msg-err mt-3 max-w-2xl text-sm">
            Storage is getting full. Prefer image paths over device uploads.
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-light" onClick={downloadBackup}>
            <Download className="h-4 w-4" aria-hidden="true" /> Download changes
          </button>
          <button type="button" className="btn btn-light" onClick={resetEverything}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Reset all changes
          </button>
        </div>
      </section>
    </main>
  )
}

export default function ManagePage() {
  const { productsReady } = useCatalogue()
  const [signedIn, setSignedIn] = useState(false)
  const [authReady, setAuthReady] = useState(false)

  usePageMeta({
    title: 'Admin | Anonymous Collectives',
    description: 'Private admin page for Anonymous Collectives.',
  })

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  useEffect(() => {
    let alive = true
    const unsubscribe = watchAdminAuth((signed) => {
      if (!alive) return
      setSignedIn(signed)
      setAuthReady(true)
    })
    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  if (!authReady) {
    return (
      <main id="main" className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="font-serif text-3xl">Checking admin session...</p>
      </main>
    )
  }

  if (signedIn && !productsReady) {
    return (
      <main id="main" className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="font-serif text-3xl">Loading products...</p>
      </main>
    )
  }

  return signedIn ? (
    <AdminDashboard onLogout={() => setSignedIn(false)} />
  ) : (
    <LoginScreen onSuccess={() => setSignedIn(true)} />
  )
}
