import { useState, type FormEvent } from 'react'
import { SITE } from '../data/catalogue'

type NewsletterFormProps = {
  compact?: boolean
  className?: string
}

type Status = { text: string; kind: '' | 'msg-ok' | 'msg-err' | 'msg-info' }

const EMPTY: Status = { text: '', kind: '' }

export default function NewsletterForm({
  compact = false,
  className = '',
}: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const inputId = compact ? 'footer-email' : 'nl-email'

  const show = (text: string, kind: Status['kind']) => setStatus({ text, kind })

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = email.trim()
    setInvalid(false)

    if (!value) {
      setInvalid(true)
      return show('Enter your email address.', 'msg-err')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setInvalid(true)
      return show("That email doesn't look right. Check it and try again.", 'msg-err')
    }
    if (!SITE.newsletter.endpoint) {
      return show(
        "Sign-ups aren't switched on yet, so your email has not been saved. Follow us on TikTok for updates in the meantime.",
        'msg-info',
      )
    }

    setBusy(true)
    show('Subscribing...', 'msg-info')
    try {
      const response = await fetch(SITE.newsletter.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: value }),
      })
      if (!response.ok) throw new Error('Bad response')
      setEmail('')
      show("You're on the list. We'll be in touch when something new drops.", 'msg-ok')
    } catch {
      show(
        'Something went wrong and your email was not saved. Please try again in a moment.',
        'msg-err',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className={className} noValidate>
      <div className={compact ? 'flex gap-2' : 'flex flex-col gap-3 sm:flex-row'}>
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <input
          id={inputId}
          type="email"
          name="email"
          autoComplete="email"
          placeholder={compact ? 'Your email' : 'Your email address'}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={`input flex-1 bg-cream ${invalid ? 'field-error' : ''}`.trim()}
          aria-invalid={invalid}
        />
        <button
          type="submit"
          className={`btn btn-dark ${compact ? 'px-5' : ''}`.trim()}
          disabled={busy}
        >
          {compact ? 'Join' : 'Subscribe'}
        </button>
      </div>
      <p role="status" className={`mt-3 text-sm ${status.kind}`.trim()}>
        {status.text}
      </p>
    </form>
  )
}
