import { Link } from 'react-router-dom'
import { SITE } from '../data/catalogue'
import { waLink } from '../lib/shop'
import Logo from './Logo'
import NewsletterForm from './NewsletterForm'

const EXPLORE = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Collections', to: '/shop#collections' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

export default function Footer() {
  return (
    <footer className="border-t border-ink/15 bg-sand">
      <div className="mx-auto grid max-w-[90rem] gap-12 px-5 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.1fr_1.5fr] lg:px-10">
        <div>
          <Link
            to="/"
            aria-label="Anonymous Collectives, home"
            className="inline-block"
          >
            <Logo className="h-24" />
          </Link>
          <p className="mt-5 font-serif text-2xl">{SITE.tagline}</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Explore</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {EXPLORE.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="link-line">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Talk to us</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a
                href={waLink('Hello Anonymous Collectives!')}
                target="_blank"
                rel="noopener noreferrer"
                className="link-line"
              >
                WhatsApp {SITE.whatsappDisplay}
              </a>
            </li>
            {SITE.social.tiktok.url ? (
              <li>
                <a
                  href={SITE.social.tiktok.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-line"
                >
                  TikTok
                </a>
              </li>
            ) : null}
            {SITE.social.instagram.url ? (
              <li>
                <a
                  href={SITE.social.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-line"
                >
                  Instagram
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Stay in the loop</h2>
          <p className="mt-4 text-sm text-ink/70">
            New collections and releases, straight to your inbox.
          </p>
          <NewsletterForm compact className="mt-4" />
        </div>
      </div>

      <div className="border-t border-ink/15">
        <p className="mx-auto max-w-[90rem] px-5 py-6 text-xs text-ink/70 lg:px-10">
          &copy; {new Date().getFullYear()} Anonymous Collectives. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
