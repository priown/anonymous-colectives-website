import { useEffect } from 'react'

type PageMeta = {
  title: string
  description: string
  image?: string
}

const setMeta = (selector: string, value: string) => {
  const element = document.querySelector(selector)
  if (element) element.setAttribute('content', value)
}

/** Keeps the document title and social/description meta tags in sync per page. */
export function usePageMeta({ title, description, image }: PageMeta) {
  useEffect(() => {
    document.title = title
    setMeta('meta[name="description"]', description)
    setMeta('meta[property="og:title"]', title)
    setMeta('meta[property="og:description"]', description)
    if (image) setMeta('meta[property="og:image"]', image)
  }, [title, description, image])
}
