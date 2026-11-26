import { createClient } from '@supabase/supabase-js'
import type { CatalogueOverrides } from '../context/catalogue'

/**
 * Supabase is the permanent backend for the shop data and admin login.
 *
 * - Public visitors read the single `storefront` row (no login).
 * - Admin writes are protected by Supabase Auth + row-level security.
 * - Images live in the public `storefront` storage bucket.
 *
 * Only the project URL and the public anon key belong in the browser. Never
 * put the service-role key in this app.
 */
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export const ADMIN_USERNAME = (
  import.meta.env.VITE_ADMIN_USERNAME || 'Admin'
).trim()
export const ADMIN_EMAIL = (
  import.meta.env.VITE_ADMIN_EMAIL || 'admin@anonymous-collectives.local'
).trim()

const TABLE = 'storefront'
const BUCKET = 'storefront'
const ROW_ID = 'main'

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export const signInAdmin = async (
  username: string,
  password: string,
): Promise<void> => {
  if (!supabase) {
    throw new Error(
      'Could not reach the login service. Please check the Supabase configuration and try again.',
    )
  }
  if (username.trim() !== ADMIN_USERNAME) {
    throw new Error('Incorrect username or password.')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password,
  })
  if (error) {
    throw new Error(friendlyAuthError(error.message))
  }

  await syncAdminProfile(username)
}

/** Turn Supabase auth error codes into clear prompts for the login screen. */
const friendlyAuthError = (message: string): string => {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return 'Incorrect username or password.'
  }
  if (lower.includes('email not confirmed')) {
    return 'This admin account has not been confirmed yet. Confirm it in Supabase Auth.'
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many sign-in attempts. Wait a moment and try again.'
  }
  return 'Could not sign in. Check your username and password and try again.'
}

/** Create or refresh the admin's profile row in the public `users` table. */
const syncAdminProfile = async (username: string): Promise<void> => {
  if (!supabase) return
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) return
  await supabase.from('users').upsert(
    {
      id,
      username,
      role: 'admin',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
}

export const signOutAdmin = async (): Promise<void> => {
  if (!supabase) return
  await supabase.auth.signOut()
}

export const watchAdminAuth = (callback: (signedIn: boolean) => void): (() => void) => {
  if (!supabase) {
    callback(false)
    return () => undefined
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(Boolean(session))
  })

  // Make sure the initial state is reported even on older supabase-js builds.
  void supabase.auth
    .getSession()
    .then(({ data: sessionData }) => callback(Boolean(sessionData.session)))
    .catch(() => callback(false))

  return () => data.subscription.unsubscribe()
}

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

const applyStatic = async (): Promise<Partial<CatalogueOverrides> | null> => {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}data/store.json?t=${Date.now()}`,
      { cache: 'no-store' },
    )
    if (!response.ok) return null
    return (await response.json()) as Partial<CatalogueOverrides>
  } catch {
    return null
  }
}

/** Reads the live Supabase state; falls back to the bundled seed file. */
export const fetchStorefrontOverrides = async (): Promise<Partial<CatalogueOverrides> | null> => {
  if (!supabase) return applyStatic()

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('data')
      .eq('id', ROW_ID)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (data?.data) return data.data as Partial<CatalogueOverrides>
  } catch {
    /* fall through to the static seed */
  }

  return applyStatic()
}

export const watchStorefront = (callback: () => void): (() => void) => {
  if (!supabase) return () => undefined

  const channel = supabase
    .channel('storefront-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE, filter: `id=eq.${ROW_ID}` },
      () => callback(),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

/* -------------------------------------------------------------------------- */
/* Images                                                                     */
/* -------------------------------------------------------------------------- */

const parseDataUrl = (dataUrl: string): { mime: string; base64: string } => {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl)
  if (!match) throw new Error('Unsupported image format.')
  return { mime: match[1], base64: match[2] }
}

const bytesFromBase64 = (base64: string): Uint8Array =>
  Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))

const sha256 = async (bytes: Uint8Array): Promise<string> => {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const extensionFor = (mime: string): string => {
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('gif')) return 'gif'
  return 'jpg'
}

export const uploadImage = async (dataUrl: string): Promise<string> => {
  if (!supabase) throw new Error('The admin backend is not configured yet.')

  const { mime, base64 } = parseDataUrl(dataUrl)
  const bytes = bytesFromBase64(base64)
  const name = `${(await sha256(bytes)).slice(0, 32)}.${extensionFor(mime)}`
  const path = `admin/${name}`
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Blob([buffer], { type: mime }), {
      contentType: mime,
      upsert: true,
    })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

const materializeImages = async (
  overrides: CatalogueOverrides,
): Promise<CatalogueOverrides> => {
  const images: Record<string, string[]> = {}

  await Promise.all(
    Object.entries(overrides.images).map(async ([id, list]) => {
      images[id] = await Promise.all(
        list.map((src) =>
          src.startsWith('data:') ? uploadImage(src) : src,
        ),
      )
    }),
  )

  return { ...overrides, images }
}

export const publishStorefront = async (
  overrides: CatalogueOverrides,
): Promise<CatalogueOverrides> => {
  if (!supabase) throw new Error('The admin backend is not configured yet.')

  const materialized = await materializeImages(overrides)
  const { error } = await supabase.from(TABLE).upsert(
    {
      id: ROW_ID,
      data: materialized,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) throw new Error(error.message)

  return materialized
}
