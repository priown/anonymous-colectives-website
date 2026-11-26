import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2,
  LogIn,
  LogOut,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  CATEGORIES,
  COLLECTIONS,
  PRODUCTS as BASE_PRODUCTS,
  type Product,
} from '../data/catalogue'
import { useCatalogue, type HomepageSelections } from '../context/catalogue'
import { usePageMeta } from '../hooks/usePageMeta'
import { signInAdmin, signOutAdmin, watchAdminAuth } from '../lib/supabase'
import {
  isCloudinaryConfigured,
  uploadImageToCloudinary,
} from '../lib/cloudinary'
import { formatPrice } from '../lib/shop'
import SmartImage from '../components/SmartImage'

type NoticeKind = '' | 'msg-ok' | 'msg-err' | 'msg-info'
type Notice = { text: string; kind: NoticeKind }
type EditorMode = 'create' | 'edit'

const EMPTY_NOTICE: Notice = { text: '', kind: '' }
const MAX_IMAGE_EDGE = 1600
const PAGE_SIZE = 25
const GENDERS = ['Women', 'Men', 'Unisex']

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

const today = () => new Date().toISOString().slice(0, 10)

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

const nextProductId = (products: Product[]) => {
  const used = new Set(products.map((product) => product.id))
  const highest = products.reduce((max, product) => {
    const match = /^ac-(\d+)$/.exec(product.id)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)

  let index = highest + 1
  let id = `ac-${String(index).padStart(3, '0')}`
  while (used.has(id)) {
    index += 1
    id = `ac-${String(index).padStart(3, '0')}`
  }
  return id
}

const blankProduct = (id: string): Product => ({
  id,
  name: '',
  category: CATEGORIES[0]?.name ?? '',
  gender: 'Unisex',
  description: '',
  story: '',
  images: [],
  colours: [],
  sizes: [],
  available: true,
  availabilityNote: '',
  isNewArrival: true,
  isBestSeller: false,
  isFeatured: false,
  isTopRecommended: false,
  collection: COLLECTIONS[0]?.name ?? '',
  dateAdded: today(),
  originalPrice: 0,
  discountPrice: null,
  quantity: 0,
  sortOrder: 0,
})

function ProductThumb({ src, name }: { src?: string; name: string }) {
  if (!src) {
    return (
      <div
        className="img-frame grid h-16 w-12 shrink-0 place-items-center text-[0.55rem] uppercase tracking-[0.1em] text-ink/40"
        aria-hidden="true"
      >
        No photo
      </div>
    )
  }

  return (
    <div className="img-frame h-16 w-12 shrink-0">
      <SmartImage
        src={src}
        alt={`${name} thumbnail`}
        width={48}
        height={64}
        loading="lazy"
      />
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
        err instanceof Error ? err.message : 'Could not sign in. Please try again.',
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
      <h1 className="mt-3 font-serif text-5xl text-balance lg:text-6xl">
        Admin access
      </h1>
      <p className="mt-4 text-ink/70">
        Sign in with your admin username and password.
      </p>

      <form onSubmit={submit} className="mt-10 space-y-5 border border-ink/20 p-6">
        <div>
          <label htmlFor="admin-username" className="mb-2 block text-sm font-medium">
            Username
          </label>
          <input
            id="admin-username"
            name="username"
            type="text"
            autoComplete="username"
            spellCheck={false}
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
            name="password"
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
          {busy ? 'Signing in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-5 text-xs leading-relaxed text-ink/60">
        Keep your password private and sign out when using a shared device.
      </p>
    </main>
  )
}

type ProductEditorProps = {
  product: Product
  mode: EditorMode
  onClose: () => void
  onSave: (product: Product) => Promise<boolean>
}

function ProductEditor({ product, mode, onClose, onSave }: ProductEditorProps) {
  const [draft, setDraft] = useState<Product>(() => ({
    ...product,
    images: [...product.images],
    colours: product.colours.map((colour) => ({ ...colour })),
    sizes: [...product.sizes],
  }))
  const [price, setPrice] = useState(
    product.originalPrice ? String(product.originalPrice) : '',
  )
  const [sale, setSale] = useState(
    product.discountPrice ? String(product.discountPrice) : '',
  )
  const [stock, setStock] = useState(String(product.quantity ?? 0))
  const [sizes, setSizes] = useState(product.sizes.join(', '))
  const [notice, setNotice] = useState<Notice>(EMPTY_NOTICE)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const alreadyLocked = document.body.classList.contains('no-scroll')
    document.body.classList.add('no-scroll')

    if (!panelRef.current?.contains(document.activeElement)) {
      panelRef.current?.focus()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0)

      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (!alreadyLocked) document.body.classList.remove('no-scroll')
    }
  }, [onClose])

  const setField = <K extends keyof Product>(key: K, value: Product[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setNotice({ text: 'Uploading photos…', kind: 'msg-info' })

    if (!isCloudinaryConfigured) {
      setNotice({
        text: 'Photo upload is not available right now. Please try again later.',
        kind: 'msg-err',
      })
      setUploading(false)
      return
    }

    const uploaded: string[] = []
    let failed = 0
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        failed += 1
        continue
      }
      try {
        const dataUrl = await compressImage(file)
        uploaded.push(await uploadImageToCloudinary(dataUrl))
      } catch {
        failed += 1
      }
    }

    if (uploaded.length) {
      setDraft((current) => ({
        ...current,
        images: [...current.images, ...uploaded],
      }))
      setNotice({
        text: `${uploaded.length} photo${
          uploaded.length === 1 ? '' : 's'
        } added${failed ? ` · ${failed} could not be uploaded` : ''}.`,
        kind: failed ? 'msg-info' : 'msg-ok',
      })
    } else {
      setNotice({
        text: 'No photos could be uploaded. Try a different file.',
        kind: 'msg-err',
      })
    }
    setUploading(false)
  }

  const removeImage = (index: number) => {
    if (draft.images.length <= 1) {
      setNotice({
        text: 'A product needs at least one photo. Add another first.',
        kind: 'msg-err',
      })
      return
    }
    setDraft((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index),
    }))
    setNotice(EMPTY_NOTICE)
  }

  const makeCover = (index: number) => {
    if (index === 0) return
    setDraft((current) => ({
      ...current,
      images: [
        current.images[index],
        ...current.images.filter((_, imageIndex) => imageIndex !== index),
      ],
    }))
    setNotice({ text: 'Cover photo updated.', kind: 'msg-ok' })
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextPrice = Number(price)
    const nextSale = sale.trim() ? Number(sale) : null
    const nextStock = Number(stock)

    if (!draft.name.trim()) {
      setNotice({ text: 'Enter a product name.', kind: 'msg-err' })
      return
    }
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      setNotice({ text: 'Enter a regular price greater than zero.', kind: 'msg-err' })
      return
    }
    if (nextSale !== null && (!Number.isFinite(nextSale) || nextSale <= 0)) {
      setNotice({ text: 'Enter a valid sale price, or leave it empty.', kind: 'msg-err' })
      return
    }
    if (nextSale !== null && nextSale >= nextPrice) {
      setNotice({
        text: 'The sale price must be lower than the regular price.',
        kind: 'msg-err',
      })
      return
    }
    if (!Number.isFinite(nextStock) || nextStock < 0) {
      setNotice({ text: 'Enter a stock quantity of zero or more.', kind: 'msg-err' })
      return
    }
    if (!draft.images.length) {
      setNotice({
        text: 'Add at least one photo before saving this product.',
        kind: 'msg-err',
      })
      return
    }

    const prepared: Product = {
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      story: (draft.story ?? '').trim(),
      availabilityNote: (draft.availabilityNote ?? '').trim(),
      sizes: sizes
        .split(',')
        .map((size) => size.trim())
        .filter(Boolean),
      originalPrice: Math.round(nextPrice),
      discountPrice: nextSale === null ? null : Math.round(nextSale),
      quantity: Math.max(0, Math.round(nextStock)),
    }

    setSaving(true)
    const ok = await onSave(prepared)
    setSaving(false)
    if (!ok) {
      setNotice({
        text: 'Could not save this product. Check your connection and try again.',
        kind: 'msg-err',
      })
    }
  }

  return (
    <div className="admin-panel-overlay">
      <div
        ref={panelRef}
        tabIndex={-1}
        className="admin-panel focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-editor-title"
      >
        <form onSubmit={submit} className="flex min-h-full flex-col">
          <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/10 bg-cream/95 px-5 py-4 backdrop-blur lg:px-8">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">
                {mode === 'create' ? 'New product' : 'Edit product'}
              </p>
              <h2
                id="product-editor-title"
                className="mt-1 truncate font-serif text-3xl"
              >
                {mode === 'create' ? 'Add a product' : draft.name || 'Product details'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center border border-ink/20 transition-colors hover:bg-ink hover:text-cream"
              aria-label="Close editor"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 space-y-9 px-5 py-6 lg:px-8">
            <section aria-labelledby="editor-details-title">
              <h3
                id="editor-details-title"
                className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60"
              >
                Details
              </h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium">
                    Product name
                  </span>
                  <input
                    name="name"
                    autoComplete="off"
                    className="input"
                    value={draft.name}
                    onChange={(event) => setField('name', event.target.value)}
                    placeholder="e.g. Anonymous Tee"
                    autoFocus={mode === 'create'}
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-medium">Category</span>
                  <input
                    name="category"
                    list="product-category-options"
                    autoComplete="off"
                    className="input"
                    value={draft.category}
                    onChange={(event) => setField('category', event.target.value)}
                    placeholder="Choose or type a category"
                  />
                  <datalist id="product-category-options">
                    {CATEGORIES.map((category) => (
                      <option key={category.name} value={category.name} />
                    ))}
                  </datalist>
                  <span className="mt-1 block text-xs text-ink/50">
                    Pick a category or type a new one.
                  </span>
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-medium">Gender</span>
                  <select
                    name="gender"
                    className="select"
                    value={draft.gender}
                    onChange={(event) => setField('gender', event.target.value)}
                  >
                    {GENDERS.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium">
                    Collection
                  </span>
                  <select
                    name="collection"
                    className="select"
                    value={draft.collection}
                    onChange={(event) => setField('collection', event.target.value)}
                  >
                    {COLLECTIONS.map((collection) => (
                      <option key={collection.name} value={collection.name}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium">Sizes</span>
                  <input
                    name="sizes"
                    autoComplete="off"
                    className="input"
                    value={sizes}
                    onChange={(event) => setSizes(event.target.value)}
                    placeholder="e.g. S, M, L, XL"
                  />
                  <span className="mt-1 block text-xs text-ink/50">
                    Separate sizes with commas. Leave empty if there are no size
                    options.
                  </span>
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium">
                    Description
                  </span>
                  <textarea
                    name="description"
                    className="input min-h-24 resize-y"
                    rows={3}
                    value={draft.description}
                    onChange={(event) =>
                      setField('description', event.target.value)
                    }
                    placeholder="What makes this piece different?"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium">
                    Story <span className="font-normal text-ink/50">(optional)</span>
                  </span>
                  <textarea
                    name="story"
                    className="input min-h-20 resize-y"
                    rows={2}
                    value={draft.story ?? ''}
                    onChange={(event) => setField('story', event.target.value)}
                    placeholder="A short note shown on the product page."
                  />
                </label>
              </div>
            </section>

            <section aria-labelledby="editor-price-title">
              <h3
                id="editor-price-title"
                className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60"
              >
                Price &amp; stock
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <label>
                  <span className="mb-1.5 block text-sm font-medium">
                    Regular price (₦)
                  </span>
                  <input
                    name="regularPrice"
                    autoComplete="off"
                    type="number"
                    min={0}
                    step={100}
                    inputMode="numeric"
                    className="input tabular-nums"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-medium">
                    Sale price (₦)
                  </span>
                  <input
                    name="salePrice"
                    autoComplete="off"
                    type="number"
                    min={0}
                    step={100}
                    inputMode="numeric"
                    className="input tabular-nums"
                    value={sale}
                    onChange={(event) => setSale(event.target.value)}
                    placeholder="No sale"
                  />
                </label>
                <label className="col-span-2 sm:col-span-1">
                  <span className="mb-1.5 block text-sm font-medium">Stock</span>
                  <input
                    name="stock"
                    autoComplete="off"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="input tabular-nums"
                    value={stock}
                    onChange={(event) => setStock(event.target.value)}
                  />
                </label>
              </div>
            </section>

            <section aria-labelledby="editor-availability-title">
              <h3
                id="editor-availability-title"
                className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60"
              >
                Availability
              </h3>
              <div className="mt-3 space-y-3">
                <label className="flex items-start gap-3 border border-ink/15 p-3">
                  <input
                    name="available"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-[#A83232]"
                    checked={draft.available}
                    onChange={(event) =>
                      setField('available', event.target.checked)
                    }
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      Available to buy
                    </span>
                    <span className="block text-xs text-ink/60">
                      Customers can add this product to their cart.
                    </span>
                  </span>
                </label>
                {!draft.available ? (
                  <label>
                    <span className="mb-1.5 block text-sm font-medium">
                      Restock note
                    </span>
                    <input
                      name="availabilityNote"
                      autoComplete="off"
                      className="input"
                      value={draft.availabilityNote ?? ''}
                      onChange={(event) =>
                        setField('availabilityNote', event.target.value)
                      }
                      placeholder="e.g. Message us about the next restock."
                    />
                  </label>
                ) : null}
              </div>
            </section>

            <section aria-labelledby="editor-photos-title">
              <div className="flex items-baseline justify-between gap-3">
                <h3
                  id="editor-photos-title"
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60"
                >
                  Photos
                </h3>
                <span className="text-xs text-ink/60">
                  {draft.images.length} photo{draft.images.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink/60">
                The first photo is the cover. Use Cover to change it.
              </p>

              {draft.images.length ? (
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {draft.images.map((src, index) => (
                    <figure
                      key={`${src.slice(0, 40)}-${index}`}
                      className="min-w-0"
                    >
                      <div className="relative">
                        <div className="img-frame aspect-[4/5]">
                          <SmartImage
                            src={src}
                            alt={`${draft.name || 'Product'} photo ${index + 1}`}
                            width={160}
                            height={200}
                            loading="lazy"
                          />
                        </div>
                        {index === 0 ? (
                          <span className="badge badge-best absolute left-1.5 top-1.5">
                            Cover
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-1 text-xs">
                        <button
                          type="button"
                          onClick={() => makeCover(index)}
                          disabled={index === 0}
                          className={`inline-flex items-center gap-1 ${
                            index === 0
                              ? 'text-ink/30'
                              : 'text-ink/70 hover:text-ink'
                          }`}
                          aria-label={`Make photo ${index + 1} the cover`}
                        >
                          <Star className="h-3 w-3" aria-hidden="true" /> Cover
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="inline-flex items-center gap-1 text-ink/60 transition-colors hover:text-choc"
                          aria-label={`Remove photo ${index + 1}`}
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" /> Remove
                        </button>
                      </div>
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="mt-3 border border-dashed border-ink/25 p-6 text-center text-sm text-ink/60">
                  No photos yet. Upload at least one so customers can see the
                  product.
                </p>
              )}

              <div className="mt-4">
                <label
                  htmlFor={`upload-${draft.id}`}
                  className="btn btn-light cursor-pointer"
                >
                  {uploading ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Upload className="h-4 w-4" aria-hidden="true" />
                  )}
                  {uploading ? 'Uploading…' : 'Upload photos'}
                </label>
                <input
                  id={`upload-${draft.id}`}
                  name="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => {
                    void addFiles(event.target.files)
                    event.target.value = ''
                  }}
                />
              </div>
            </section>

          </div>

          <footer className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t border-ink/10 bg-cream/95 px-5 py-4 backdrop-blur lg:px-8">
            <p
              role="status"
              aria-live="polite"
              className={`min-h-[1.25rem] w-full text-sm ${notice.kind}`.trim()}
            >
              {notice.text}
            </p>
            <button
              type="submit"
              className="btn btn-dark"
              disabled={saving || uploading}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {saving
                ? 'Saving…'
                : mode === 'create'
                  ? 'Add product'
                  : 'Save changes'}
            </button>
            <button
              type="button"
              className="btn btn-light"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const {
    products,
    featuredCollections,
    bestSellers,
    topRecommended,
    featuredProducts,
    newArrivals,
    featuredCategories,
    saveSelections,
    saveProductList,
    deleteProductById,
  } = useCatalogue()

  const [view, setView] = useState<'products' | 'homepage'>('products')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editor, setEditor] = useState<{
    mode: EditorMode
    product: Product
  } | null>(null)
  const [productNotice, setProductNotice] = useState<Notice>(EMPTY_NOTICE)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const closeEditor = useCallback(() => setEditor(null), [])

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

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return products
    return products.filter((product) =>
      [product.name, product.category, product.collection, product.gender].some(
        (value) => value.toLowerCase().includes(query),
      ),
    )
  }, [products, search])

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const visibleProducts = filteredProducts.slice(pageStart, pageStart + PAGE_SIZE)

  const onSaleCount = products.filter(
    (product) =>
      product.discountPrice !== null &&
      product.discountPrice > 0 &&
      product.discountPrice < product.originalPrice,
  ).length
  const outOfStockCount = products.filter(
    (product) => !product.available || product.quantity === 0,
  ).length

  const saveProduct = async (next: Product): Promise<boolean> => {
    const exists = products.some((product) => product.id === next.id)
    const sortOrder = exists
      ? (next.sortOrder ?? 0)
      : Math.max(0, ...products.map((product) => product.sortOrder ?? 0)) + 1
    const prepared: Product = { ...next, sortOrder }
    const list = exists
      ? products.map((product) => (product.id === next.id ? prepared : product))
      : [...products, prepared]

    setProductNotice(EMPTY_NOTICE)
    const ok = await saveProductList(list)
    if (ok) {
      if (!exists) {
        setSearch('')
        setPage(Math.max(1, Math.ceil((products.length + 1) / PAGE_SIZE)))
      }
      setProductNotice({
        text: exists
          ? `“${prepared.name}” was updated.`
          : `“${prepared.name}” was added.`,
        kind: 'msg-ok',
      })
      setEditor(null)
    }
    return ok
  }

  const removeProduct = async (product: Product) => {
    if (
      !window.confirm(`Delete “${product.name}”? This cannot be undone.`)
    ) {
      return
    }

    setDeletingId(product.id)
    setProductNotice(EMPTY_NOTICE)
    const ok = await deleteProductById(product.id)
    setDeletingId(null)
    setProductNotice(
      ok
        ? { text: `“${product.name}” was deleted.`, kind: 'msg-ok' }
        : {
            text: 'Could not delete that product. Check your connection and try again.',
            kind: 'msg-err',
          },
    )
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
        text: 'Choose exactly five featured categories.',
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
        text: 'Homepage selections updated.',
        kind: 'msg-ok',
      })
    } else {
      setSelectionNotice({
        text: 'Could not save your selections. Please try again.',
        kind: 'msg-err',
      })
    }
  }

  const resetSelectionChanges = () => {
    if (!window.confirm('Reset the homepage selections to the defaults?')) return
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
        text: 'Homepage selections reset to the defaults.',
        kind: 'msg-info',
      })
    }
  }

  const logout = () => {
    void signOutAdmin()
    onLogout()
  }

  return (
    <main id="main" className="mx-auto max-w-7xl px-5 py-14 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">
            Admin
          </p>
          <h1 className="mt-2 font-serif text-5xl text-balance lg:text-6xl">
            Manage the shop
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Add products, update prices and stock, and choose what appears on the
            homepage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => {
              setView('products')
              setEditor({
                mode: 'create',
                product: blankProduct(nextProductId(products)),
              })
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add product
          </button>
          <Link to="/shop" className="btn btn-light">
            View shop
          </Link>
          <button type="button" onClick={logout} className="btn btn-light">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="border border-ink/15 bg-sand/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/55">
            Products
          </p>
          <p className="mt-1 font-serif text-3xl tabular-nums">{products.length}</p>
        </div>
        <div className="border border-ink/15 bg-sand/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/55">
            On sale
          </p>
          <p className="mt-1 font-serif text-3xl tabular-nums">{onSaleCount}</p>
        </div>
        <div className="border border-ink/15 bg-sand/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/55">
            Out of stock
          </p>
          <p className="mt-1 font-serif text-3xl tabular-nums">{outOfStockCount}</p>
        </div>
      </div>

      <div
        className="mt-10 flex gap-1 border-b border-ink/15"
        role="group"
        aria-label="Admin sections"
      >
        <button
          type="button"
          onClick={() => setView('products')}
          aria-pressed={view === 'products'}
          className={`border-b-2 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
            view === 'products'
              ? 'border-ink text-ink'
              : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          Products
        </button>
        <button
          type="button"
          onClick={() => setView('homepage')}
          aria-pressed={view === 'homepage'}
          className={`border-b-2 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
            view === 'homepage'
              ? 'border-ink text-ink'
              : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          Homepage
        </button>
      </div>

      {view === 'products' ? (
        <section className="mt-8" aria-labelledby="products-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="products-title" className="font-serif text-3xl">
                Products
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                {products.length} product{products.length === 1 ? '' : 's'} in the
                shop.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
                aria-hidden="true"
              />
              <label htmlFor="product-search" className="sr-only">
                Search products
              </label>
              <input
                id="product-search"
                name="search"
                type="search"
                autoComplete="off"
                spellCheck={false}
                className="input pl-10"
                placeholder="Search products…"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>

          <p
            role="status"
            aria-live="polite"
            className={`mt-4 min-h-[1.25rem] text-sm ${productNotice.kind}`.trim()}
          >
            {productNotice.text}
          </p>

          <div className="mt-4 border border-ink/15">
            <div className="hidden grid-cols-[3.5rem_minmax(0,1fr)_9rem_5rem_8rem] gap-4 border-b border-ink/15 bg-sand/50 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink/50 md:grid">
              <span>Photo</span>
              <span>Product</span>
              <span>Price</span>
              <span>Stock</span>
              <span className="text-right">Actions</span>
            </div>

            {visibleProducts.length ? (
              <ul className="divide-y divide-ink/10">
                {visibleProducts.map((product) => {
                  const onSale =
                    product.discountPrice !== null &&
                    product.discountPrice > 0 &&
                    product.discountPrice < product.originalPrice
                  const stockLabel =
                    product.quantity === undefined
                      ? '—'
                      : `${product.quantity} left`
                  return (
                    <li
                      key={product.id}
                      className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-4 px-4 py-2.5 md:grid-cols-[3.5rem_minmax(0,1fr)_9rem_5rem_8rem]"
                    >
                      <ProductThumb src={product.images[0]} name={product.name} />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="truncate text-xs text-ink/55">
                          {product.category} · {product.collection}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink/60 md:hidden">
                          <span className="tabular-nums">
                            {onSale
                              ? formatPrice(product.discountPrice ?? 0)
                              : formatPrice(product.originalPrice)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{product.available ? stockLabel : 'Sold out'}</span>
                          {onSale ? (
                            <span className="badge badge-sale">Sale</span>
                          ) : null}
                          {product.isNewArrival ? (
                            <span className="text-choc">New</span>
                          ) : null}
                        </p>
                      </div>

                      <div className="hidden text-sm tabular-nums md:block">
                        {onSale ? (
                          <>
                            <span className="text-ink/45 line-through">
                              {formatPrice(product.originalPrice)}
                            </span>{' '}
                            <span className="font-medium">
                              {formatPrice(product.discountPrice ?? 0)}
                            </span>
                          </>
                        ) : (
                          <span>{formatPrice(product.originalPrice)}</span>
                        )}
                      </div>

                      <div className="hidden text-sm md:block">
                        {!product.available ? (
                          <span className="msg-err">Sold out</span>
                        ) : (
                          <span className="tabular-nums text-ink/70">
                            {stockLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditor({ mode: 'edit', product })}
                          className="grid h-9 w-9 place-items-center border border-ink/15 text-ink/70 transition-colors hover:border-ink hover:bg-ink hover:text-cream"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeProduct(product)}
                          disabled={deletingId === product.id}
                          className="grid h-9 w-9 place-items-center border border-ink/15 text-ink/60 transition-colors hover:border-choc hover:bg-choc hover:text-white disabled:opacity-50"
                          aria-label={`Delete ${product.name}`}
                        >
                          {deletingId === product.id ? (
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="px-6 py-14 text-center">
                <Package
                  className="mx-auto h-8 w-8 text-ink/30"
                  aria-hidden="true"
                />
                <p className="mt-3 font-serif text-2xl">No products found</p>
                <p className="mt-1 text-sm text-ink/60">
                  {search
                    ? 'Try a different search.'
                    : 'Add your first product to get started.'}
                </p>
              </div>
            )}

            {pageCount > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 px-4 py-3">
                <span className="text-xs text-ink/60">
                  Showing {pageStart + 1}–
                  {Math.min(pageStart + PAGE_SIZE, filteredProducts.length)} of{' '}
                  {filteredProducts.length}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="border border-ink/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-ink hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPage(Math.min(pageCount, currentPage + 1))
                    }
                    disabled={currentPage === pageCount}
                    className="border border-ink/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-ink hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="mt-8" aria-labelledby="homepage-title">
          <div>
            <h2 id="homepage-title" className="font-serif text-3xl">
              Homepage
            </h2>
            <p className="mt-1 text-sm text-ink/60">
              Choose what appears in each storefront section.
            </p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="border border-ink/15 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-serif text-2xl">Featured categories</h3>
                <span className="text-xs text-ink/60">
                  {selectedCategories.length}/5 selected
                </span>
              </div>
              <p className="mt-1 text-xs text-ink/60">
                The five cards directly below the homepage hero.
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
                      } ${
                        disabled
                          ? 'cursor-not-allowed opacity-40'
                          : 'cursor-pointer'
                      }`.trim()}
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
                Shown in the shop&apos;s featured collections row.
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
                        <span className="block font-medium">
                          {collection.name}
                        </span>
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

          <div className="mt-5 border border-ink/15 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-serif text-2xl">Best-selling products</h3>
              <span className="text-xs text-ink/60">
                {selectedBestSellers.length}/8 selected
              </span>
            </div>
            <p className="mt-1 text-xs text-ink/60">
              These get the Best Seller badge. The first four appear on the
              homepage.
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
                    } ${
                      disabled
                        ? 'cursor-not-allowed opacity-40'
                        : 'cursor-pointer'
                    }`.trim()}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleBestSeller(product.id)}
                      className="h-4 w-4 accent-[#A83232]"
                    />
                    <span className="truncate">{product.name}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="mt-5 border border-ink/15 p-5">
            <h3 className="font-serif text-2xl">Product labels</h3>
            <p className="mt-1 text-xs text-ink/60">
              Assign products to additional merchandising groups. Each group can
              contain up to eight products.
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
                    <h4 className="text-xs font-semibold uppercase tracking-[0.12em]">
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
                          } ${
                            disabled
                              ? 'cursor-not-allowed opacity-40'
                              : 'cursor-pointer'
                          }`.trim()}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() =>
                              toggleProductGroup(product.id, group.setter)
                            }
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
            <span
              role="status"
              aria-live="polite"
              className={`text-sm ${selectionNotice.kind}`.trim()}
            >
              {selectionNotice.text}
            </span>
          </div>
        </section>
      )}

      {editor ? (
        <ProductEditor
          key={`${editor.mode}-${editor.product.id}`}
          product={editor.product}
          mode={editor.mode}
          onClose={closeEditor}
          onSave={saveProduct}
        />
      ) : null}
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
        <p className="font-serif text-3xl">Checking admin session…</p>
      </main>
    )
  }

  if (signedIn && !productsReady) {
    return (
      <main id="main" className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="font-serif text-3xl">Loading products…</p>
      </main>
    )
  }

  return signedIn ? (
    <AdminDashboard onLogout={() => setSignedIn(false)} />
  ) : (
    <LoginScreen onSuccess={() => setSignedIn(true)} />
  )
}
