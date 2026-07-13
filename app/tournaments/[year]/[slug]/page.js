"use client"

import { notFound, useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import TournamentDetailView from '../../../components/tournaments/TournamentDetailView'
import { TournamentDetailSkeleton } from '../../../components/skeletons/PageSkeletons'
import { usePageTitle } from '../../../lib/usePageTitle'

export default function TournamentPage() {
  const params = useParams()
  const router = useRouter()
  const fixtureCache = useRef(new Map())
  const [tournaments, setTournaments] = useState([])
  const [tournament, setTournament] = useState(null)
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const year = Array.isArray(params?.year) ? params.year[0] : params?.year
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug
  usePageTitle(tournament?.title || 'Tournament')

  const loadFixtures = useCallback(async (tournamentSlug) => {
    if (fixtureCache.current.has(tournamentSlug)) return fixtureCache.current.get(tournamentSlug)
    const response = await fetch(`/api/tournaments/fixtures?slug=${encodeURIComponent(tournamentSlug)}`)
    if (!response.ok) return []
    const data = await response.json()
    const entries = (data?.entries || []).filter((entry) => entry.mappedSeries?.length > 0)
    fixtureCache.current.set(tournamentSlug, entries)
    return entries
  }, [])

  useEffect(() => {
    if (!year || !slug) return
    let cancelled = false
    setLoading(true)
    setError(false)

    fetch(`/api/tournaments?year=${encodeURIComponent(year)}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Tournament request failed: ${response.status}`)
        return response.json()
      })
      .then(async (data) => {
        const yearTournaments = (data?.entries || []).filter((entry) => entry.typeHandle === 'tournamentPage' && entry.parent?.slug === year)
        const current = yearTournaments.find((entry) => entry.slug === slug)
        if (!current) throw new Error('Tournament not found')
        const nextFixtures = await loadFixtures(current.slug)
        if (cancelled) return
        setTournaments(yearTournaments)
        setTournament(current)
        setFixtures(nextFixtures)
      })
      .catch((loadError) => {
        console.error('Tournament page fetch error:', loadError)
        if (!cancelled) setError(true)
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [year, slug, loadFixtures])

  const moveTournament = (offset) => {
    if (tournaments.length < 2 || !tournament) return
    const current = tournaments.findIndex((entry) => entry.slug === tournament.slug)
    const next = tournaments[(current + offset + tournaments.length) % tournaments.length]
    router.push(`/tournaments/${year}/${next.slug}`, { scroll: false })
  }

  if (loading) return <TournamentDetailSkeleton />
  if (error || !tournament) return notFound()

  return (
    <TournamentDetailView
      tournament={tournament}
      fixtures={fixtures}
      year={year}
      canCycle={tournaments.length > 1}
      onPrevious={() => moveTournament(-1)}
      onNext={() => moveTournament(1)}
    />
  )
}
