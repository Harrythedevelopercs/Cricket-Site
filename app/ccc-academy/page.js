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

  if (error) {
    return <div className="error-message">Error loading content: {error}</div>
  }

  const renderComponents = () => {
    if (
      !pageData ||
      !pageData.entries ||
      !pageData.entries[0] ||
      !pageData.entries[0].homePageBlocks
    ) {
      return (
        <>
          <HeroBannerSkeleton />
          {/* Add other skeleton components here */}
        </>
      )
    }

    return pageData.entries[0].homePageBlocks.map((block) => {
      switch (block.typeHandle) {
        case 'homeHeroBanner':
          return (
            <Suspense key={block.id} fallback={<div className="loading-hero">Loading hero...</div>}>
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
