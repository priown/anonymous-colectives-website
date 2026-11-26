import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import Reveal from '../components/Reveal'

export default function AboutPage() {
  usePageMeta({
    title: 'About Us | Anonymous Collectives',
    description:
      "The story behind Anonymous Collectives: individuality, self-expression and confidence without asking for attention. Stay Low. Stand Out.",
    image: `${import.meta.env.BASE_URL}assets/banners/campaign-second.jpg`,
  })

  return (
    <main id="main">
      {/* Opening */}
      <section className="mx-auto max-w-[90rem] px-5 pb-20 pt-16 lg:px-10 lg:pb-32 lg:pt-28">
        <h1 className="wordmark enter text-[14vw] sm:text-[min(11vw,7rem)] lg:text-[min(9vw,10rem)]">
          Stay low.
          <br />
          Stand out.
        </h1>
        <p className="enter enter-2 mt-8 max-w-2xl font-serif text-2xl leading-snug lg:mt-12 lg:text-4xl">
          Four words that explain the whole label. This page explains the rest.
        </p>
      </section>

      {/* The name */}
      <section className="border-t border-ink/10" aria-labelledby="name-title">
        <div className="mx-auto grid max-w-[90rem] gap-10 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-32">
          <Reveal
            as="h2"
            id="name-title"
            className="font-serif text-4xl lg:col-span-4 lg:text-5xl"
          >
            Why "Anonymous"
          </Reveal>
          <Reveal className="max-w-2xl space-y-6 text-lg leading-relaxed text-ink/85 lg:col-span-7 lg:col-start-6">
            <p>
              We didn't pick the name to hide. We picked it because the
              best-dressed person in the room is often the one nobody can quite
              place.
            </p>
            <p>
              Anonymous means you don't need a title, a following or a logo the
              size of your chest. It means the clothes can be recognised without
              the wearer having to introduce themselves.
            </p>
            <p>
              And "Collectives", with an s, because nobody wears this alone. More
              on that further down.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Pull quote */}
      <section
        className="on-dark bg-charcoal py-24 text-ivory lg:py-36"
        aria-label="From the Anonymous tee"
      >
        <Reveal className="mx-auto max-w-5xl px-5 text-center">
          <p className="font-serif text-4xl italic leading-tight lg:text-6xl">
            No spotlight, no noise. Just power in motion.
          </p>
          <p className="mt-8 text-sm text-ivory/70">
            Printed on the back of our Anonymous tee
          </p>
        </Reveal>
      </section>

      {/* Philosophy */}
      <section
        className="mx-auto max-w-[90rem] px-5 py-20 lg:px-10 lg:py-32"
        aria-labelledby="phil-title"
      >
        <Reveal
          as="h2"
          id="phil-title"
          className="max-w-3xl font-serif text-4xl lg:text-6xl"
        >
          Confidence without the volume
        </Reveal>
        <div className="mt-14 grid gap-12 md:grid-cols-3 lg:mt-20 lg:gap-16">
          <Reveal>
            <h3 className="font-serif text-3xl">Stay low</h3>
            <p className="mt-4 text-ink/80">
              Keep your head down and your standards up. You're not performing for
              anyone. Calm is a flex, and it's one that never gets old.
            </p>
          </Reveal>
          <Reveal>
            <h3 className="font-serif text-3xl">Stand out</h3>
            <p className="mt-4 text-ink/80">
              Not by shouting. By the fit, the print, the colour nobody else
              picked, and the way you carry all of it. Being yourself turns out to
              be hard to copy.
            </p>
          </Reveal>
          <Reveal>
            <h3 className="font-serif text-3xl">Both at once</h3>
            <p className="mt-4 text-ink/80">
              That tension is the whole point. Quiet on the surface, unmistakable
              up close. A statement beyond the ordinary, made without raising your
              voice.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Streetwear and self-expression */}
      <section
        className="border-y border-ink/10 bg-sand"
        aria-labelledby="street-title"
      >
        <div className="mx-auto grid max-w-[90rem] gap-10 px-5 py-20 lg:grid-cols-12 lg:px-10 lg:py-32">
          <Reveal
            as="h2"
            id="street-title"
            className="font-serif text-4xl lg:col-span-5 lg:text-5xl"
          >
            Streetwear, minus the shouting
          </Reveal>
          <Reveal className="max-w-2xl space-y-6 text-lg leading-relaxed text-ink/85 lg:col-span-6 lg:col-start-7">
            <p>
              Streetwear started as a way for people to say who they were without
              asking permission. Somewhere along the way a lot of it got loud for
              the sake of being loud.
            </p>
            <p>
              We'd rather go the other way. Ribbed tanks with the name stitched
              small. A beanie that slouches the way it wants to. A graphic that
              lives on the back, for whoever is walking behind you.
            </p>
            <p>
              Clothes are one of the few things you get to say out loud without
              opening your mouth. We want what you say to be yours.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Community */}
      <section
        className="mx-auto max-w-[90rem] px-5 py-20 lg:px-10 lg:py-32"
        aria-labelledby="coll-title"
      >
        <div className="grid gap-10 lg:grid-cols-12">
          <Reveal
            as="h2"
            id="coll-title"
            className="font-serif text-4xl lg:col-span-5 lg:text-5xl"
          >
            The collective
          </Reveal>
          <Reveal className="max-w-2xl space-y-6 text-lg leading-relaxed text-ink/85 lg:col-span-6 lg:col-start-7">
            <p>
              A collective isn't an audience. It's the people who get it without
              needing it explained: the ones who'd rather be recognised by what
              they wear than by what they say about it.
            </p>
            <p>
              Different faces, different styles, different stories. The only thing
              they share is the refusal to blend in, and the confidence not to make
              a fuss about it.
            </p>
            <p>
              You'll see them in the{' '}
              <Link to="/#lookbook" className="link-line font-medium text-ink">
                AC Lookbook
              </Link>
              . If that sounds like you, you're already part of it.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-ink/10 bg-sand">
        <div className="mx-auto max-w-3xl px-5 py-24 text-center lg:py-36">
          <Reveal as="p" className="font-serif text-3xl leading-snug lg:text-5xl">
            Wear it quietly. Let everyone else wonder.
          </Reveal>
          <Reveal className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/shop" className="btn btn-dark">
              Shop the collection
            </Link>
            <Link to="/#lookbook" className="btn btn-light">
              See the AC Lookbook
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
