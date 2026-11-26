import { createClient } from '@supabase/supabase-js'
import type { CatalogueOverrides } from '../context/catalogue'

/**
 * Supabase backend for the shop data and admin login.
 *
 * Supabase Auth is not used. Admin passwords live as pgcrypto hashes in
 * `public.users`; the `login` and `save_storefront` Postgres functions check
 * them server-side. Only the project URL + public anon key are exposed here.
 * Never put the service-role key in this app.
 */
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

const TABLE = 'storefront'
const ROW_ID = 'main'
const SESSION_USER = 'ac:admin-user'
const SESSION_PASS = 'ac:admin-pass'

/* -------------------------------------------------------------------------- */
/* Login                                                                      */
/* -------------------------------------------------------------------------- */

const session = (): { username: string; password: string } | null => {
  try {
    const username = sessionStorage.getItem(SESSION_USER)
    const password = sessionStorage.getItem(SESSION_PASS)
    return username && password ? { username, password } : null
  } catch {
    return null
  }
}

export const signInAdmin = async (
  username: string,
  password: string,
): Promise<void> => {
  if (!supabase) {
    throw new Error(
      'Could not reach the login service. Please check the Supabase configuration and try again.',
    )
  }

  const name = username.trim()
  const { data, error } = await supabase.rpc('login', {
    p_username: name,
    p_password: password,
  })

  if (error) {
    throw new Error('Could not reach the login service. Please try again.')
  }
  if (!data) {
    throw new Error('Incorrect username or password.')
  }

  try {
    sessionStorage.setItem(SESSION_USER, name)
    sessionStorage.setItem(SESSION_PASS, password)
  } catch {
    throw new Error('Your browser blocked the login session. Allow site storage.')
  }
}

export const signOutAdmin = async (): Promise<void> => {
  try {
    sessionStorage.removeItem(SESSION_USER)
    sessionStorage.removeItem(SESSION_PASS)
  } catch {
    /* storage blocked */
  }
}

export const watchAdminAuth = (callback: (signedIn: boolean) => void): (() => void) => {
  callback(Boolean(session()))
  return () => undefined
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
/* Publishing                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Sends the full state through the `save_storefront` function. The function
 * re-checks the admin username/password in Postgres before writing.
 */
export const publishStorefront = async (
  overrides: CatalogueOverrides,
): Promise<CatalogueOverrides> => {
  if (!supabase) {
    throw new Error(
      'Could not reach the live storefront. Please check the Supabase configuration.',
    )
  }

  const credentials = session()
  if (!credentials) {
    throw new Error('Your login session has expired. Please sign in again.')
  }

  const { error } = await supabase.rpc('save_storefront', {
    p_username: credentials.username,
    p_password: credentials.password,
    p_data: overrides,
  })

  if (error) {
    const message = error.message.toLowerCase()
    if (message.includes('incorrect')) {
      throw new Error('Your login is no longer valid. Please sign in again.')
    }
    throw new Error('Could not save to the live storefront. Please try again.')
  }

  return overrides
}
