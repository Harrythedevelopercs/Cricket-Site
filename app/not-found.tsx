import Link from 'next/link'
import ChicagoSkyline from './components/ui/ChicagoSkyline'
import ChicagoStar from './components/ui/ChicagoStar'

// Club-voiced 404 — same dusk + skyline language as the hero.
export default function NotFound() {
  return (
    <section className="ccc-hero min-h-[92vh] flex flex-col">
      <div className="ccc-hero-glow" />
      <div className="ccc-hero-inner base_paddings max_content center_aligned w-full flex-1 flex items-center">
        <div className="pt-[120px] pb-[46vw] lg:pt-[150px] lg:pb-[24vw]">
          <p className="ds-eyebrow flex items-center gap-[2vw] lg:gap-[0.5vw]">
            <ChicagoStar size="0.85em" /> 404 · Not out, just not here
          </p>
          <h1 className="ds-display mt-[4vw] lg:mt-[1.1vw] text-[13vw] lg:text-[4.6vw]">
            Nothing at this end<span className="accent">.</span>
          </h1>
          <p className="text-muted p3 mt-[4vw] lg:mt-[1.2vw] max-w-[48ch]">
            The page you&apos;re after has moved on, or never took guard. Head back to the
            pavilion, or straight to the fixtures.
          </p>
          <div className="flex flex-wrap gap-[3vw] lg:gap-[1vw] mt-[6vw] lg:mt-[1.8vw]">
            <Link href="/" className="ccc-btn ccc-btn-primary">
              Back to the pavilion <span className="ccc-btn-arrow">→</span>
            </Link>
            <Link href="/schedule" className="ccc-btn ccc-btn-ghost">
              View fixtures
            </Link>
          </div>
        </div>
      </div>
      <ChicagoSkyline />
    </section>
  )
}
