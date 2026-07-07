'use client'

import { useState, useEffect } from 'react'
// Import Swiper React components:
import { Swiper, SwiperSlide } from 'swiper/react'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// Import required Swiper modules
import { Navigation, Pagination } from 'swiper/modules'
import SectionTitleEle from './SectionTitleEle'
import Image from 'next/image'


//import images
import rightImage from '../../../public/images/right-arrow.png';
import leftImage from '../../../public/images/left-arrow.png';

function SliderImageEle({ imgUrl, isActive }) {
  if (!imgUrl) {
    // No usable photo for this person — show a quiet crest panel rather than a
    // broken image (or a logo pretending to be a face).
    return (
      <div className={`slider_ele ${isActive ? 'active' : ''}`}>
        <div
          className="w-full aspect-square bg-[var(--panel)] flex items-center justify-center"
          aria-hidden="true"
        >
          <Image
            src="/images/ccc-logo3.png"
            alt=""
            width={120}
            height={120}
            className="opacity-40 object-contain"
            unoptimized
          />
        </div>
      </div>
    )
  }
  return (
    <div className={`slider_ele ${isActive ? 'active' : ''}`}>
      <Image
        src={imgUrl}
        alt="slider element"
        width={400}
        height={400}
        className="object-cover w-full h-auto"
        unoptimized
      />
    </div>
  )
}

function Slider({ onSetSlideIndex, sliderImagesRows }) {
  return (
    <Swiper
      modules={[Navigation, Pagination]}
      navigation={{
        nextEl: '.next',
        prevEl: '.back',
      }}
      initialSlide={0}
      centeredSlides={false}
      spaceBetween="18%"
      slidesPerView={1}
      breakpoints={{
        1023: { slidesPerView: 1 },
        1024: { slidesPerView: 2 },
      }}
      onSlideChange={(swiper) => {
        const realIndex = swiper.realIndex
        onSetSlideIndex(realIndex)
      }}
      className="swiper-container"
      loop={true}
    >
      {sliderImagesRows}
    </Swiper>
  )
}

// Names to hide from the management carousel (left the club / no longer listed).
const HIDDEN_MANAGEMENT = ['asfand', 'anish']

// A CMS "player image" that is actually the club crest is treated as missing —
// a logo is not a face.
const looksLikeLogo = (url) => /logo|crest|ccc[-_]?logo/i.test(url || '')

export default function MeetSquad({ data }) {
  const managementData = ((data && data.managementPlayerBlocks) || []).filter((p) => {
    const name = (p?.title || '').toLowerCase()
    return !HIDDEN_MANAGEMENT.some((h) => name.includes(h))
  })
  const [slideIndex, setSlideIndex] = useState(0)
  const [isDesktop, setIsDesktop] = useState(false)
  // Roster photos from the DB (real CricClubs headshots), keyed by lowercased full
  // name — used when the CMS entry has no real photo of the person.
  const [rosterPics, setRosterPics] = useState(null)

  useEffect(() => {
    fetch('/api/players')
      .then((r) => r.json())
      .then((d) => {
        const map = {}
        for (const e of d.entries || []) {
          const url = e?.playerImage?.[0]?.url
          if (e?.title && url) map[e.title.trim().toLowerCase()] = url
        }
        setRosterPics(map)
      })
      .catch(() => setRosterPics({}))
  }, [])

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 1024)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const cmsBaseUrl = process.env.NEXT_PUBLIC_CMS_URL || 'https://cms-ccc.ddev.site/'

  const getFullImageUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url
    const baseUrl = cmsBaseUrl.endsWith('/') ? cmsBaseUrl : `${cmsBaseUrl}/`
    return `${baseUrl}${cleanUrl}`
  }

  const getNextIndex = (currentIndex) => {
    if (!managementData || managementData.length === 0) return 0
    return (currentIndex + 1) % managementData.length
  }

  const displayIndex = isDesktop ? getNextIndex(slideIndex) : slideIndex

  // Build Slider slides. CMS photo first; if it's missing or just the club
  // logo, fall back to the person's real roster headshot (matched by name).
  const sliderImagesRows = managementData.map((player, idx) => {
    let imageUrl = ''
    if (Array.isArray(player.playerImage) && player.playerImage.length > 0) {
      imageUrl = getFullImageUrl(player.playerImage[0].url)
    } else if (
      player.playerImage &&
      !Array.isArray(player.playerImage) &&
      player.playerImage.url
    ) {
      imageUrl = getFullImageUrl(player.playerImage.url)
    }
    if (!imageUrl || looksLikeLogo(imageUrl)) {
      const rosterPic = rosterPics?.[(player.title || '').trim().toLowerCase()]
      if (rosterPic) imageUrl = rosterPic
    }
    return (
      <SwiperSlide key={idx}>
        <SliderImageEle imgUrl={imageUrl} isActive={idx === displayIndex} />
      </SwiperSlide>
    )
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.href.includes('#meet_squad')) {
      const ele = document.getElementById('meet_squad')
      if (ele) {
        ele.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [])

  function onSetSlideIndex(index) {
    if (!managementData || managementData.length === 0) return
    const safeIndex = index % managementData.length
    setSlideIndex(safeIndex)
  }

  if (managementData.length === 0) {
    return <div>No management data available</div>
  }

  const currentPlayer = managementData[displayIndex] || managementData[0]

  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return 'N/A'
    let phoneStr = phoneNumber.toString()
    if (phoneStr.includes('-') || phoneStr.includes('(')) return phoneStr
    if (!phoneStr.startsWith('1')) {
      phoneStr = '1' + phoneStr
    }
    const countryCode = '1'
    const areaCode = phoneStr.substring(1, 4)
    const prefix = phoneStr.substring(4, 7)
    const lineNumber = phoneStr.substring(7)

    if (areaCode && prefix) {
      if (lineNumber) {
        return `+${countryCode} (${areaCode}) ${prefix}-${lineNumber}`
      } else {
        return `+${countryCode} (${areaCode}) ${prefix}`
      }
    } else if (areaCode) {
      return `+${countryCode} (${areaCode}) ${phoneStr.substring(4)}`
    }
    return `+${countryCode} ${phoneStr.substring(1)}`
  }

  return (
    <section id="meet_squad" className="MS_total_container">
      <section className="MS_info_container base_paddings">
        <div className="center_aligned MS_parent">
          <SectionTitleEle>{(data && data.title) || 'Meet the Management'}</SectionTitleEle>
          <div className="MS_logo_content_parent flex_grid">
            <div
              className="bg_eagle_logo"
              style={{ backgroundImage: "url(/images/ccc-logo3.png)" }}
            ></div>

            <div className="player_content">
              <div className="player_name">
                <h5 className="oswald-bold h3 brand_orange">{currentPlayer && currentPlayer.title || ''}</h5>
              </div>
              <div className="player_creds">
                <p className="roboto-condensed-regular p3 white_color">
                  {currentPlayer && currentPlayer.designation || ''}
                </p>
              </div>
              <div className="player_bio desk_only">
                <div className="player_bio_title">
                  <h6 className="roboto-condensed-bold p2 white_color">Short Biography</h6>
                </div>
                <p className="roboto-condensed-regular p3 white_color">
                  {currentPlayer && currentPlayer.biography || ''}
                </p>
              </div>
              <div>
                <div className='flex flex-row'>
                  <Image src={leftImage} alt='left-icon' width={25} height={25} className='mt-5 back cursor-pointer' />
                  <Image src={rightImage} alt='right-icon' width={25} height={25} className='mt-5 next cursor-pointer' />

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="MS_slider_parent">
        <div className="slider_extraInfo_container flex_grid">
          <div className="slider_container">
            <Slider onSetSlideIndex={onSetSlideIndex} sliderImagesRows={sliderImagesRows} />
          </div>
          <div className="player_bio mob_only">
            <div className="player_bio_title">
              <h6 className="roboto-condensed-bold p2 white_color">Short Biography</h6>
            </div>
            <p className="roboto-condensed-regular p3 white_color">
              {currentPlayer && currentPlayer.biography || ''}
            </p>
          </div>
          <div className="player_match_creds flex flex-col">
            <div className="credsContainer flex_grid !mt-auto">
              <div className="credsContainer_grph">
                <Image
                  src="/images/email_icon.png"
                  alt="Email"
                  className="contact-icon"
                  width={24}
                  height={24}
                  unoptimized
                />
              </div>
              <p className="credsContainer_para roboto-condensed-regular p3 white_color">
                {currentPlayer && currentPlayer.playerEmail || 'N/A'}
              </p>
            </div>

            <div className="credsContainer flex_grid !mb-auto">
              <div className="credsContainer_grph">
                <Image
                  src="/images/phone_call_icon.png"
                  alt="Phone"
                  className="contact-icon"
                  width={24}
                  height={24}
                  unoptimized
                />
              </div>
              <p className="credsContainer_para roboto-condensed-regular p3 white_color">
                {formatPhoneNumber(currentPlayer && currentPlayer.phoneNumber)}
              </p>
            </div>
          </div>
        </div>
      </section>
    </section>
  )
}
