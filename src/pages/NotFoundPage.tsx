import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

export default function NotFoundPage() {
  usePageMeta({
    title: 'Page not found | Anonymous Collectives',
    description: 'That page could not be found. Return to the Anonymous Collectives shop.',
  })

  return (
    <main id="main">
      <div className="mx-auto max-w-[90rem] px-5 py-24 text-center lg:px-10 lg:py-36">
        <p className="wordmark text-[18vw] leading-none sm:text-[min(14vw,9rem)]">404</p>
        <h1 className="mt-4 font-serif text-4xl lg:text-5xl">
          This page stayed a little too low.
        </h1>
        <p className="mt-4 text-ink/70">
          The link may be old, or the page may have moved.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn btn-dark">
            Back home
          </Link>
          <Link to="/shop" className="btn btn-light">
            Shop the collection
          </Link>
        </div>
      </div>
    </main>
  )
}
