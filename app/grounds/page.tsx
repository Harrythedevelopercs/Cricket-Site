'use client'

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { fetchGraphQL } from '../lib/graphqlClient'
import { getGroundsQuery } from '../lib/queries/groundsQuery'
import { usePageTitle } from '../lib/usePageTitle'

interface GroundImageProps {
  alt: string
  id: string
  title: string
  url: string
}

interface GroundData {
  id: string
  title: string
  homegroundStatus: boolean
  address: string
  matches: number
  fbtw: number // First Batting Team Wins
  sbtw: number // Second Batting Team Wins
  as1i: number // Avg. Score, 1st Inning
  as2i: number // Avg. Score, 2nd Inning
  groundImageDesktop: GroundImageProps[]
  groundImageMobile: GroundImageProps[]
}

function OPInfoEle({ setText, setNum }: { setText: string; setNum: number }) {
  return (
    <div className="OPIE_ele flex_grid">
      <div className="OPIE_ele_text">
        <h5 className="roboto-condensed-med p2 white_color">{setText}</h5>
      </div>
      <div className="OPIE_ele_num">
        <p className="roboto-condensed-bold h4 brand_orange">{setNum}</p>
      </div>
    </div>
  )
}

function OverlayPanel({
  groundsData,
  currentIndex,
}: {
  groundsData: GroundData[]
  currentIndex: number
}) {
  const [index, setIndex] = useState<number>(currentIndex)

  const cmsBaseUrl = process.env.NEXT_PUBLIC_CMS_URL || 'https://cms-ccc.ddev.site/'

  function HandlePrevClick() {
    if (index > 0) {
      const oldIndex = index
      const elemId = groundsData[oldIndex].id + '_ground'
      const fadeElem = document.getElementById(elemId)
      if (fadeElem) fadeElem.classList.add('transparent_bg')

      const newIndex = oldIndex - 1
      setIndex(newIndex)
      const homeGroundElement = document.getElementById('homeGroundEle')
      if (groundsData[newIndex].homegroundStatus) {
        homeGroundElement?.classList.remove('hidden_ele')
      } else {
        homeGroundElement?.classList.add('hidden_ele')
      }
    } else {
      setIndex(groundsData.length - 1)
      const lastIndex = groundsData.length - 1
      const fadeElems = document.querySelectorAll('.crossFade_imgEle')
      fadeElems.forEach((element) => {
        element.classList.remove('transparent_bg')
      })
      const homeGroundElement = document.getElementById('homeGroundEle')
      if (groundsData[lastIndex].homegroundStatus) {
        homeGroundElement?.classList.remove('hidden_ele')
      } else {
        homeGroundElement?.classList.add('hidden_ele')
      }
    }
  }

  function HandleNextClick() {
    if (index === groundsData.length - 1) {
      setIndex(0)
      const fadeElems = document.querySelectorAll('.crossFade_imgEle')
      fadeElems.forEach((element) => {
        element.classList.add('transparent_bg')
      })

      const firstElem = document.getElementById(groundsData[0].id + '_ground')
      if (firstElem) firstElem.classList.remove('transparent_bg')

      const homeGroundElement = document.getElementById('homeGroundEle')
      if (groundsData[0].homegroundStatus) {
        homeGroundElement?.classList.remove('hidden_ele')
      } else {
        homeGroundElement?.classList.add('hidden_ele')
      }
    } else {
      const newIndex = index + 1
      setIndex(newIndex)
      const elemId = groundsData[newIndex].id + '_ground'
      const fadeElem = document.getElementById(elemId)
      if (fadeElem) fadeElem.classList.remove('transparent_bg')

      const homeGroundElement = document.getElementById('homeGroundEle')
      if (groundsData[newIndex].homegroundStatus) {
        homeGroundElement?.classList.remove('hidden_ele')
      } else {
        homeGroundElement?.classList.add('hidden_ele')
      }
    }
  }

  if (groundsData.length === 0 || index < 0 || index >= groundsData.length) {
    return null
  }

  const currentGround = groundsData[index]

  return (
    <div className="OP_container">
      <div className="OP_parent">
        <div className="OP_title">
          <h2 className="oswald-bold h1 white_color">{currentGround.title}</h2>
        </div>
        <div className="OP_pag_bar flex_grid">
          <div className="OP_pag_bar_ele prev_btn" onClick={HandlePrevClick}>
            <div className="pag_bar_ele_image">
              <Image
                src="/images/slide_pag_ico.png"
                alt="Previous"
                width={36}
                height={36}
                unoptimized
              />
            </div>
            <p className="roboto-condensed-regular p6 white_color">Previous</p>
          </div>
          <div className="OP_pag_bar_ele next_btn" onClick={HandleNextClick}>
            <div className="pag_bar_ele_image">
              <Image
                src="/images/slide_pag_ico.png"
                alt="Next"
                width={36}
                height={36}
                unoptimized
              />
            </div>
            <p className="roboto-condensed-regular p6 white_color">Next</p>
          </div>
        </div>
        <div className="mob_only mobGround_viewer">
          {currentGround.groundImageMobile && currentGround.groundImageMobile[0] && (
            <Image
              src={`${cmsBaseUrl}${currentGround.groundImageMobile[0].url.replace(/^\//, '')}`}
              alt={currentGround.groundImageMobile[0].alt || 'Ground Image'}
              width={400}
              height={300}
              unoptimized
              className="w-full h-auto object-cover"
            />
          )}
        </div>
        <div className="OP_loc_container flex_grid">
          <div className="OP_loc_ico">
            <Image
              src="/images/orangeBg_locIco.svg"
              alt="Location"
              width={32}
              height={32}
              unoptimized
            />
          </div>
          <p className="roboto-condensed-regular white_color p4">{currentGround.address}</p>
        </div>
        <div className="OP_info_container">
          <OPInfoEle setText="Matches" setNum={currentGround.matches} />
          <OPInfoEle setText="First Batting Team Wins," setNum={currentGround.fbtw} />
          <OPInfoEle setText="Second Batting Team Wins," setNum={currentGround.sbtw} />
          <OPInfoEle setText="Avg. Score, 1st Inning" setNum={currentGround.as1i} />
          <OPInfoEle setText="Avg. Score, 2nd Inning" setNum={currentGround.as2i} />
        </div>
        <div className="OP_dis_text">
          <p className="white_color roboto-condensed-med p5">
            *Midwest Cricket Conference — historical ground averages
          </p>
        </div>
      </div>
    </div>
  )
}

function BGSlider({ groundsData }: { groundsData: GroundData[] }) {
  const cmsBaseUrl = process.env.NEXT_PUBLIC_CMS_URL || 'https://cms-ccc.ddev.site/'

  const getFullImageUrl = (url: string) => {
    if (url?.startsWith('http')) return url
    const cleanUrl = url?.startsWith('/') ? url.substring(1) : url
    const baseUrl = cmsBaseUrl.endsWith('/') ? cmsBaseUrl : `${cmsBaseUrl}/`
    return `${baseUrl}${cleanUrl}`
  }

  const homeGround = groundsData.find((ground) => ground.homegroundStatus)

  return (
    <>
      <div className="bg_slider">
        {groundsData.map((ground, index) => {
          const desktopImage = ground.groundImageDesktop?.[0]
          const mobileImage = ground.groundImageMobile?.[0]

          return (
            <picture key={ground.id + '__PRCINDEX' + index}>
              {mobileImage && (
                <source
                  key={ground.id + '__SRCINDEX' + index}
                  srcSet={getFullImageUrl(mobileImage.url)}
                  media="(max-width: 1024px)"
                />
              )}
              {desktopImage && (
                <Image
                  id={ground.id + '_ground'}
                  key={ground.id}
                  className="crossFade_imgEle"
                  src={getFullImageUrl(desktopImage.url)}
                  alt={desktopImage.alt || ground.title}
                  width={1600}
                  height={900}
                  unoptimized
                />
              )}
            </picture>
          )
        })}
      </div>
      {homeGround && (
        <div
          id="homeGroundEle"
          className={`homeGround_logo ${!homeGround.homegroundStatus ? 'hidden_ele' : ''}`}
        >
          <Image src="/images/logo.png" alt="Home Ground Logo" width={100} height={60} unoptimized />
          {/* Sits on the fixed translucent-white .homeGround_logo badge (globals.css,
              same in both themes), so the label stays a fixed dark ink in both. */}
          <p className="oswald-bold p1 text-[#1a0d05] uppercase">Home Ground</p>
        </div>
      )}
    </>
  )
}

export default function GroundSlider() {
  usePageTitle('Grounds')
  const [groundsData, setGroundsData] = useState<GroundData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGrounds = async () => {
      try {
        const query = getGroundsQuery()
        const data = await fetchGraphQL(query)

        if (data && data.entries) {
          // The CMS entries carry long-standing misspellings in ground titles
          // (source data we can't edit from here) — correct them for display.
          const TITLE_FIXES: [RegExp, string][] = [
            [/Washinington/gi, 'Washington'],
            [/\bLincon\b/gi, 'Lincoln'],
            [/\bVeron Hills\b/gi, 'Vernon Hills'],
          ]
          const fixTitle = (t: string) =>
            TITLE_FIXES.reduce((s, [re, to]) => s.replace(re, to), t ?? '')
          setGroundsData(
            (data.entries as GroundData[]).map((g) => ({ ...g, title: fixTitle(g.title) }))
          )
        } else {
          throw new Error('No grounds data returned from API')
        }
      } catch (err) {
        console.error('Error fetching grounds data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchGrounds()
  }, [])

  const initialIndex = groundsData.findIndex((ground) => ground.homegroundStatus)
  const currentIndex = initialIndex !== -1 ? initialIndex : 0

  if (loading) {
    return <div className="loading">Loading grounds data...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  if (groundsData.length === 0) {
    return <div className="no-data">No grounds data available.</div>
  }

  return (
    <section className="GS_container">
      <BGSlider groundsData={groundsData} />
      <OverlayPanel groundsData={groundsData} currentIndex={currentIndex} />
    </section>
  )
}
