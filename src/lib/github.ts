import type { CatalogueOverrides } from '../context/catalogue'

/**
 * GitHub-backed storefront data.
 *
 * The public site reads `data/store.json` from the repository. Admin saves are
 * committed with a fine-grained GitHub token entered at login. The token is
 * kept in sessionStorage on the admin's device; it is never bundled with the
 * public site.
 */
export const GITHUB = {
  owner: import.meta.env.VITE_GITHUB_OWNER || 'priown',
  repo: import.meta.env.VITE_GITHUB_REPO || 'anonymous-collectives-website',
  branch: import.meta.env.VITE_GITHUB_BRANCH || 'main',
  dataPath: 'public/data/store.json',
  imageDir: 'public/assets/admin',
  publicDataPath: 'data/store.json',
  publicImageDir: 'assets/admin',
}

const TOKEN_KEY = 'ac:github-token'
const LOGIN_KEY = 'ac:github-login'
const API = 'https://api.github.com'

export const githubToken = (): string => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export const githubLogin = (): string => {
  try {
    return sessionStorage.getItem(LOGIN_KEY) || ''
  } catch {
    return ''
  }
}

export const saveGithubSession = (token: string, login: string): void => {
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(LOGIN_KEY, login)
  } catch {
    /* storage blocked */
  }
}

export const clearGithubSession = (): void => {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(LOGIN_KEY)
  } catch {
    /* storage blocked */
  }
}

const headers = (token?: string): HeadersInit => ({
  Accept: 'application/vnd.github+json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

const apiError = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { message?: string }
    return body.message || `${response.status} ${response.statusText}`
  } catch {
    return `${response.status} ${response.statusText}`
  }
}

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return btoa(binary)
}

const textToBase64 = (text: string): string =>
  bytesToBase64(new TextEncoder().encode(text))

const sha256 = async (bytes: Uint8Array): Promise<string> => {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const dataUrlParts = (dataUrl: string): { mime: string; base64: string } => {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl)
  if (!match) throw new Error('Unsupported image data.')
  return { mime: match[1], base64: match[2] }
}

const imageExtension = (mime: string): string => {
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('gif')) return 'gif'
  return 'jpg'
}

const fileSha = async (token: string, path: string): Promise<string | null> => {
  const response = await fetch(
    `${API}/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${path}?ref=${GITHUB.branch}`,
    { headers: headers(token) },
  )
  if (response.status === 404) return null
  if (!response.ok) throw new Error(await apiError(response))
  const data = (await response.json()) as { sha?: string }
  return data.sha || null
}

const putFile = async (
  token: string,
  path: string,
  content: string,
  message: string,
): Promise<void> => {
  const sha = await fileSha(token, path)
  const response = await fetch(
    `${API}/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        ...headers(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        content,
        branch: GITHUB.branch,
        ...(sha ? { sha } : {}),
      }),
    },
  )
  if (!response.ok) throw new Error(await apiError(response))
}

/** Confirms the token can write to this repository and returns the GitHub login. */
export const validateGithubToken = async (token: string): Promise<string> => {
  const userResponse = await fetch(`${API}/user`, { headers: headers(token) })
  if (!userResponse.ok) {
    throw new Error('That GitHub token is invalid or expired.')
  }
  const user = (await userResponse.json()) as { login?: string }

  const repoResponse = await fetch(
    `${API}/repos/${GITHUB.owner}/${GITHUB.repo}`,
    { headers: headers(token) },
  )
  if (!repoResponse.ok) {
    throw new Error(`This token cannot access ${GITHUB.owner}/${GITHUB.repo}.`)
  }
  const repo = (await repoResponse.json()) as {
    permissions?: { push?: boolean }
  }
  if (!repo.permissions?.push) {
    throw new Error(
      `This token needs Contents: Read and write access to ${GITHUB.owner}/${GITHUB.repo}.`,
    )
  }

  return user.login || 'admin'
}

/** Reads the latest published data. Returns null when the file does not exist yet. */
export const fetchRemoteOverrides = async (): Promise<Partial<CatalogueOverrides> | null> => {
  try {
    const response = await fetch(
      `${import.meta.env.BASE_URL}${GITHUB.publicDataPath}?t=${Date.now()}`,
      { cache: 'no-store' },
    )
    if (!response.ok) return null
    return (await response.json()) as Partial<CatalogueOverrides>
  } catch {
    return null
  }
}

/** Uploads a data URL to the repo and returns its public raw URL. */
export const uploadImageToGithub = async (
  token: string,
  dataUrl: string,
): Promise<string> => {
  const { mime, base64 } = dataUrlParts(dataUrl)
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
  const name = `${(await sha256(bytes)).slice(0, 32)}.${imageExtension(mime)}`
  const path = `${GITHUB.imageDir}/${name}`

  const existing = await fileSha(token, path)
  if (!existing) {
    await putFile(token, path, base64, `Add storefront image ${name}`)
  }

  return `${GITHUB.publicImageDir}/${name}`
}

const materializeImages = async (
  token: string,
  overrides: CatalogueOverrides,
): Promise<CatalogueOverrides> => {
  const images: Record<string, string[]> = {}

  await Promise.all(
    Object.entries(overrides.images).map(async ([id, list]) => {
      images[id] = await Promise.all(
        list.map((src) =>
          src.startsWith('data:') ? uploadImageToGithub(token, src) : src,
        ),
      )
    }),
  )

  return { ...overrides, images }
}

/**
 * Uploads any embedded images, then commits the catalogue data file.
 * The raw data file is read by every visitor on page load.
 */
export const publishOverrides = async (
  token: string,
  overrides: CatalogueOverrides,
): Promise<CatalogueOverrides> => {
  const materialized = await materializeImages(token, overrides)
  const json = `${JSON.stringify(materialized, null, 2)}\n`
  await putFile(
    token,
    GITHUB.dataPath,
    textToBase64(json),
    'Update storefront data',
  )
  return materialized
}
