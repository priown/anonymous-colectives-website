/**
 * Local admin gate.
 *
 * This is a convenience lock for the private Manage page on a static site.
 * It is NOT real security: anyone who can read the deployed JavaScript can
 * find these credentials. Do not store anything sensitive here.
 */
export const ADMIN_USERNAME = 'Admin'
export const ADMIN_PASSWORD = 'Admin'

const SESSION_KEY = 'ac:admin-session'
const SESSION_VALUE = 'signed-in'

export const isAdminSignedIn = (): boolean => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === SESSION_VALUE
  } catch {
    return false
  }
}

export const signInAdmin = (): void => {
  try {
    sessionStorage.setItem(SESSION_KEY, SESSION_VALUE)
  } catch {
    /* storage blocked */
  }
}

export const signOutAdmin = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* storage blocked */
  }
}

export const adminCredentialsMatch = (
  username: string,
  password: string,
): boolean =>
  username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD
