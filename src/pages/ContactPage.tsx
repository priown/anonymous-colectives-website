import { useState, type FormEvent } from 'react'
import { MessageCircle, Plus } from 'lucide-react'
import { SITE } from '../data/catalogue'
import { usePageMeta } from '../hooks/usePageMeta'
import { waLink } from '../lib/shop'
import Reveal from '../components/Reveal'

const FAQ = [
  {
    question: 'How do I place an order?',
    answer:
      'Open a product, choose your colour and size, then press Add to cart (or Order via WhatsApp for that single item). In your cart, press Checkout on WhatsApp: your whole order opens as a message in WhatsApp, ready to send to us. We reply to confirm the details.',
  },
  {
    question: 'Do I pay on the website?',
    answer:
      "No. There's no online payment on this site. Payment and delivery are arranged with our team on WhatsApp once you've sent your order.",
  },
  {
    question: 'How do I find my size?',
    answer:
      "Available sizes are listed on each product page. If you're between sizes or unsure about the fit, message us on WhatsApp and we'll help you pick.",
  },
  {
    question: 'An item is sold out. Will it come back?',
    answer:
      'Ask us on WhatsApp. Every sold-out product page has a link that opens a message about restocks.',
  },
  {
    question: 'Do you deliver outside Nigeria?',
    answer:
      "Nigeria is our main market, with the United Kingdom and the United States next. Message us on WhatsApp with your location and we'll tell you what's possible.",
  },
]

const TOPICS = [
  'An order',
  'Sizing',
  'Stock and restocks',
  'Collaboration',
  'Something else',
]

type Status = { text: string; kind: string }

export default function ContactPage() {
  const [name, setName] = useState('')
  const [topic, setTopic] = useState(TOPICS[0])
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>({ text: '', kind: '' })
  const [messageError, setMessageError] = useState(false)
  const instagram = SITE.social.instagram

  usePageMeta({
    title: 'Contact | Anonymous Collectives',
    description:
      'Contact Anonymous Collectives on WhatsApp or TikTok. Questions about orders, sizing or collaborations are welcome.',
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessageError(false)

    const trimmed = message.trim()
    if (!trimmed) {
      setMessageError(true)
      setStatus({
        text: 'Write your message first, then send it.',
        kind: 'msg-err',
      })
      return
    }

    const lines = [
      'Hello Anonymous Collectives!',
      '',
      name.trim() ? `My name is ${name.trim()}.` : '',
      `Topic: ${topic}`,
      '',
      trimmed,
    ].filter((line, index, all) => line !== '' || (all[index - 1] !== '' && index !== 0))

    setStatus({
      text: 'Opening WhatsApp. Press send there to deliver your message.',
      kind: 'msg-info',
    })

    const url = waLink(lines.join('\n'))
    const opened = window.open(url, '_blank', 'noopener')
    if (!opened) window.location.assign(url)
  }

  return (
    <main id="main">
      <section className="mx-auto max-w-[90rem] px-5 pb-12 pt-14 lg:px-10 lg:pb-20 lg:pt-24">
        <h1 className="wordmark enter text-[16vw] sm:text-[min(12vw,7rem)] lg:text-[min(9vw,9rem)]">
          Contact
        </h1>
        <p className="enter enter-2 mt-6 max-w-xl font-serif text-2xl leading-snug lg:text-3xl">
          Orders, sizing, restocks or just a hello. The fastest way to reach us is
          WhatsApp.
        </p>
      </section>

      {/* Contact options */}
      <section
        className="mx-auto max-w-[90rem] px-5 pb-20 lg:px-10 lg:pb-28"
        aria-label="Ways to reach us"
      >
        <div
          id="contact-cards"
          className={`grid gap-4 ${instagram.url ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}
        >
          <Reveal className="flex flex-col border border-ink/30 p-6 lg:p-8">
            <h2 className="font-serif text-3xl">WhatsApp Business</h2>
            <p className="mt-2 text-ink/70">{SITE.whatsappDisplay}</p>
            <a
              href={waLink('Hello Anonymous Collectives!')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-dark mt-8 w-full md:mt-auto"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Chat on WhatsApp
            </a>
          </Reveal>

          <Reveal className="flex flex-col border border-ink/30 p-6 lg:p-8">
            <h2 className="font-serif text-3xl">TikTok</h2>
            <p className="mt-2 text-ink/70">{SITE.social.tiktok.handle}</p>
            <a
              href={SITE.social.tiktok.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-light mt-8 w-full md:mt-auto"
            >
              Follow on TikTok
            </a>
          </Reveal>

          {instagram.url ? (
            <Reveal className="flex flex-col border border-ink/30 p-6 lg:p-8">
              <h2 className="font-serif text-3xl">Instagram</h2>
              <p className="mt-2 text-ink/70">{instagram.handle}</p>
              <a
                href={instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-light mt-8 w-full md:mt-auto"
              >
                Follow on Instagram
              </a>
            </Reveal>
          ) : null}
        </div>
      </section>

      {/* General enquiries */}
      <section className="border-t border-ink/10 bg-sand/60" aria-labelledby="enq-title">
        <div className="mx-auto grid max-w-[90rem] gap-10 px-5 py-20 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-28">
          <Reveal className="lg:col-span-5">
            <h2 id="enq-title" className="font-serif text-4xl lg:text-5xl">
              General enquiries
            </h2>
            <p className="mt-4 max-w-md text-ink/70">
              Write your question here and we'll open it as a WhatsApp message,
              ready to send. Nothing is stored on this site.
            </p>
          </Reveal>

          <Reveal className="lg:col-span-6 lg:col-start-7">
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="enq-name" className="mb-2 block text-sm font-medium">
                  Your name
                </label>
                <input
                  id="enq-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className="input bg-cream"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div>
                <label htmlFor="enq-topic" className="mb-2 block text-sm font-medium">
                  What's this about?
                </label>
                <select
                  id="enq-topic"
                  name="topic"
                  className="select bg-cream"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                >
                  {TOPICS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="enq-message" className="mb-2 block text-sm font-medium">
                  Your message
                </label>
                <textarea
                  id="enq-message"
                  name="message"
                  rows={5}
                  className={`input bg-cream ${messageError ? 'field-error' : ''}`.trim()}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </div>

              <p
                id="enq-status"
                role="status"
                className={`min-h-[1.25rem] text-sm ${status.kind}`.trim()}
              >
                {status.text}
              </p>

              <button type="submit" className="btn btn-dark w-full sm:w-auto">
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> Send on WhatsApp
              </button>
            </form>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section
        className="mx-auto max-w-4xl px-5 py-20 lg:py-28"
        aria-labelledby="faq-title"
      >
        <Reveal
          as="h2"
          id="faq-title"
          className="font-serif text-4xl lg:text-5xl"
        >
          Frequently asked questions
        </Reveal>

        <Reveal className="mt-10 border-t border-ink/15">
          {FAQ.map((item) => (
            <details key={item.question} className="faq border-b border-ink/15 py-5">
              <summary className="flex items-center justify-between gap-4 font-serif text-2xl">
                <span>{item.question}</span>
                <Plus className="faq-icon h-5 w-5 shrink-0" aria-hidden="true" />
              </summary>
              <p className="mt-3 max-w-2xl text-ink/80">{item.answer}</p>
            </details>
          ))}
        </Reveal>
      </section>
    </main>
  )
}
