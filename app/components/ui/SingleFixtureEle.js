'use client'

import Image from 'next/image'
import MatchDate from './MatchDate'
import MatchLocation from './MatchLocation'

const CHICAGO_TZ = 'America/Chicago'

export default function SingleFixtureEle({ fixture, isActive = false, cmsBaseUrl = 'http://cms.ccc.clubcricketofchicago.com/' }) {
  // Show the match date and (when it has a real start time) the time in Central Time
  // (Chicago — CST/CDT). Date-only fixtures show just the date, with no timezone shift.
  const formatMatchDate = (dateString) => {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    const dateOnly = d.getUTCHours() === 0 && d.getUTCMinutes() === 0
    const datePart = d.toLocaleDateString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      timeZone: dateOnly ? 'UTC' : CHICAGO_TZ,
    })
    if (dateOnly) return datePart
    const timePart = d.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
      timeZone: CHICAGO_TZ, timeZoneName: 'short',
    })
    return `${datePart} · ${timePart}`
  }

  const getFullImageUrl = (url) => {
    if (!url) return '/images/default-team-logo.png'
    if (url.startsWith('http')) return url

    const cleanUrl = url.startsWith('/') ? url.slice(1) : url
    const baseUrl = cmsBaseUrl.endsWith('/') ? cmsBaseUrl : `${cmsBaseUrl}/`
    return `${baseUrl}${cleanUrl}`
  }

  return (
    <div
      className="ccc-card rounded-lg overflow-hidden relative transition-transform duration-500 ease-in-out text-[color:var(--text)]"
      style={{
        transform: isActive ? 'translateY(-12.5%)' : 'none'
      }}
    >
      <div className="px-[4%] py-[4%] flex flex-col relative">
        <MatchDate className="mx-auto">
          {formatMatchDate(fixture.date)}
        </MatchDate>
        <div className="text-center mt-[1%]">
          <p className="roboto-condensed-regular p3">{fixture.title}</p>
        </div>
        <div className="flex items-center justify-around my-4">
          <div className="w-[32%] max-w-[92px] flex items-center justify-center">
            <Image
              src={getFullImageUrl(fixture.t1Logo?.[0]?.url)}
              alt={fixture.t1Logo?.[0]?.alt || fixture.t1Name}
              width={64}
              height={64}
              className="max-w-full max-h-full w-full h-auto rounded-full"
              unoptimized={true}
            />
          </div>
          <div className="mx-2">
            <p className="roboto-condensed-bold p1">VS</p>
          </div>
          <div className="w-[32%] max-w-[92px] flex items-center justify-center">
            <Image
              src={getFullImageUrl(fixture.t2Logo?.[0]?.url)}
              alt={fixture.t2Logo?.[0]?.alt || fixture.t2Name}
              width={64}
              height={64}
              className="max-w-full max-h-full w-full h-auto rounded-full"
              unoptimized={true}
            />
          </div>
        </div>
        <MatchLocation className="mx-auto">
          {fixture.groundsName}
        </MatchLocation>
      </div>
    </div>
  )
}
