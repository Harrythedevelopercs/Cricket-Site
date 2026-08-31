'use client'

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react'
import { fetchGraphQL } from '../lib/graphqlClient'
import { getCCCAcademyQuery } from '../lib/queries/academyQuery'
import HeroBanner from '../components/ui/HeroBanner'
import NewSeasonCounter from '../components/ui/NewSeasonCounter'
import MeetSquad from '../components/ui/MeetSquad'
import BGParralaxBanner from '../components/ui/BGParralaxBanner'
import SponsorsBanner from '../components/ui/SponsorsBanner'
import FixturesGrid from '../components/ui/FixturesGrid'
import TournamentSection from '../components/ui/TournamentSection'
import HeroBannerSkeleton from '../components/skeletons/HeroBannerSkeleton'
import BallLoader from '../components/ui/BallLoader'
import { usePageTitle } from '../lib/usePageTitle'

const AcademyPageContent = () => {
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const query = getCCCAcademyQuery()
    fetchGraphQL(query)
      .then((data) => {
        setPageData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching data from Craft CMS:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // The CMS answered but without usable blocks — a failure, not a loading
  // state; without this the page rests as a permanent hero skeleton.
  const cmsAnswered = pageData != null
  const blocks = pageData?.entries?.[0]?.homePageBlocks

  if (error || (cmsAnswered && !blocks)) {
    return (
      <div className="base_paddings py-20 pt-32 lg:pt-40 text-[color:var(--text)]">
        <div className="max_content center_aligned">
          <div className="ccc-card mx-auto max-w-2xl px-6 py-14 text-center">
            <p className="ds-eyebrow ds-eyebrow--orange">CCC Academy</p>
            <p className="ds-display mt-3 text-4xl">The academy page didn&rsquo;t load</p>
            <p className="mt-3 text-[color:var(--text-muted)]">
              Usually a slow wake-up, not an outage — give it a moment and try again.
            </p>
            <button type="button" onClick={() => window.location.reload()} className="ccc-btn ccc-btn-primary mt-6">
              Reload
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderComponents = () => {
    if (!blocks) {
      return (
        <>
          <HeroBannerSkeleton />
          {/* Add other skeleton components here */}
        </>
      )
    }

    return blocks.map((block) => {
      switch (block.typeHandle) {
        case 'homeHeroBanner':
          return (
            <Suspense key={block.id} fallback={<BallLoader label="Loading" />}>
              <HeroBanner data={block} />
            </Suspense>
          )
        case 'fixturesGrid':
          return <FixturesGrid key={block.id} data={block} />
        case 'tournamentSection':
          return <TournamentSection key={block.id} data={block} />
        case 'timerBanner':
          return <NewSeasonCounter key={block.id} data={block} />
        case 'meetTheManagement':
          return <MeetSquad key={block.id} data={block} />
        case 'banner':
          // Real club photography (pregame warmup) instead of the CMS stock
          // helmet shot — the copy still comes from the CMS.
          return (
            <BGParralaxBanner
              key={block.id}
              data={{ ...block, localBgOverride: '/images/club/academy.jpg' }}
            />
          )
        case 'sponsorsBanner':
          return <SponsorsBanner key={block.id} data={block} />
        default:
          return null
      }
    })
  }

  return <>{loading ? <HeroBannerSkeleton /> : renderComponents()}</>
}

export default function Page() {
  usePageTitle('CCC Academy')
  return (
    <section className="w-full h-full bg-repeat-y bg-[100%]">
      <AcademyPageContent />
    </section>
  )
}
