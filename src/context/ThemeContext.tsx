import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './theme'

const storedTheme = (): Theme => {
  const current = document.documentElement.getAttribute('data-theme')
  return current === 'light' ? 'light' : 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(storedTheme)

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.style.colorScheme = theme
    try {
      localStorage.setItem('ac:theme', theme)
    } catch {
      /* storage blocked */
    }
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#111111' : '#F5F3EF')
  }, [theme])

  const toggleTheme = useCallback(() => {
    const root = document.documentElement
    root.classList.add('theme-switching')
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
    window.setTimeout(() => root.classList.remove('theme-switching'), 600)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
