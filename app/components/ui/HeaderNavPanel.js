"use client"

import LogoContainer from './LogoContainer'
import Link from 'next/link'
import { useRef, useEffect, useState } from 'react'

import { fetchGraphQL } from '../../lib/graphqlClient'
import { getNavigationConfig } from '../../lib/queries/navigationQuery'
import { localizeUrl } from '../../lib/localizeUrl'
import Image from 'next/image'
import ThemeToggle from './ThemeToggle'

function NavEleIco({ iconData }) {
  const cmsBaseUrl = process.env.NEXT_PUBLIC_CMS_URL || 'https://cms-ccc.ddev.site/'

  const getFullImageUrl = (url) => {
    if (url?.startsWith('http') || url?.startsWith('/images')) return url
    const cleanUrl = url?.startsWith('/') ? url.substring(1) : url
    const baseUrl = cmsBaseUrl.endsWith('/') ? cmsBaseUrl : `${cmsBaseUrl}/`
    return `${baseUrl}${cleanUrl}`
  }

  return (
    <Image
      src={getFullImageUrl(iconData.url)}
      alt={iconData.alt || iconData.title || ''}
      className="nav_eleIco"
      width={40}
      height={40}
      unoptimized
    />
  )
}

function NavEle({ navItem, setNewTab }) {
  const hasIcon = navItem.navigationIcon && navItem.navigationIcon.length > 0
  const imageEle = hasIcon ? <NavEleIco iconData={navItem.navigationIcon[0]} /> : <></>
  // Own-domain absolute URLs from the CMS become relative, so only genuinely
  // external links (YouTube, webmail…) open a new tab.
  const url = localizeUrl(navItem.hyperlink.url)
  const target = setNewTab || url.startsWith('http') ? '_blank' : undefined

  return (
    <div className="nav_ele flex_grid">
      <div className="nav_ele_text">
        <Link href={url} target={target} className="no_underline p2">
          {navItem.title}
        </Link>
      </div>
      {imageEle}
    </div>
  )
}

function NavEleBtn({ navItem }) {
  return (
    <div className="nav_ele">
      <Link href={localizeUrl(navItem.hyperlink.url)}>
        <button className="nav_ele_btn">
          <p className="roboto-condensed-med p2">{navItem.title}</p>
        </button>
      </Link>
    </div>
  )
}

function NavContainer({ navigationItems }) {
  return (
    <div className="nav_container flex_grid">
      {navigationItems.map((item) => {
        if (item.buttonToggle) {
          return <NavEleBtn key={item.id} navItem={item} />
        } else {
          return <NavEle key={item.id} navItem={item} />
        }
      })}
    </div>
  )
}

function MobileNav() {
  const HandleHamClick = () => {
    const ele = document.getElementById('mobNav_hamIcon')
    const mobEle = document.getElementById('mobileNav_ref')

    if (ele && mobEle) {
      if (ele.classList.contains('nav-open')) {
        ele.classList.remove('nav-open')
        mobEle.classList.remove('active_nav')
      } else {
        ele.classList.add('nav-open')
        mobEle.classList.add('active_nav')
      }
    }
  }

  return (
    <div className="mobile_nav_ele">
      <div id="mobNav_hamIcon" className="nav_burger mobile-only" onClick={HandleHamClick}>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  )
}

// Pages that live in this app but aren't in the CMS navigation yet. Merged in
// client-side (before the button item) so they appear without a CMS release.
const LOCAL_NAV_ITEMS = [
  { id: 'local-records', title: 'Records', buttonToggle: false, hyperlink: { url: '/records' }, navigationIcon: [] },
  { id: 'local-story', title: 'Our Story', buttonToggle: false, hyperlink: { url: '/about' }, navigationIcon: [] },
]

export default function HeaderNavPanel() {
  const headerRef = useRef(null)
  const [bgColor, setBgColor] = useState('unset')
  const [navigationItems, setNavigationItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const query = getNavigationConfig()
        const data = await fetchGraphQL(query)

        if (data && data.entries) {
          const items = [...data.entries]
          // LOG IN comes mid-list from the CMS; the club wants it as the last tab.
          const loginIdx = items.findIndex(
            (i) => !i.buttonToggle && /log\s*-?\s*in/i.test(i.title || '')
          )
          const login = loginIdx >= 0 ? items.splice(loginIdx, 1)[0] : null
          const firstBtn = items.findIndex((i) => i.buttonToggle)
          const at = firstBtn === -1 ? items.length : firstBtn
          items.splice(at, 0, ...LOCAL_NAV_ITEMS, ...(login ? [login] : []))
          setNavigationItems(items)
        } else {
          throw new Error('No navigation data returned from API')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchNavigation()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const elmnt = headerRef.current

      if (elmnt && window.scrollY > elmnt.offsetHeight && window.innerWidth > 1024) {
        elmnt.classList.add('active_header')
      } else if (elmnt) {
        setBgColor('unset')
        elmnt.classList.remove('active_header')
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getFullUrl = (url) => {
    const local = localizeUrl(url)
    if (local?.startsWith('http')) return local
    if (local?.startsWith('/')) return local
    return `/${local}`
  }

  const buttonItem = navigationItems.find((item) => item.buttonToggle)

  return (
    <>
      <header ref={headerRef} className="main_header base_paddings" style={{ backgroundColor: bgColor }}>
        <div className="center_aligned flex_grid">
          <LogoContainer href="/" className="site_logo" imageUrl="logo.png" />
          {loading ? (
            <></>
          ) : error ? (
            <div>Error loading navigation: {error}</div>
          ) : (
            <NavContainer navigationItems={navigationItems} />
          )}
          <ThemeToggle />
          <MobileNav />
        </div>
      </header>

      <div id="mobileNav_ref" className="mobile_navigation">
        <div className="mob_nav_parent">
          {loading ? (
            <></>
          ) : error ? (
            <></>
          ) : (
            <>
              {navigationItems
                .filter((item) => !item.buttonToggle)
                .map((item) => (
                  <div key={item.id} className="mob_nav_ele">
                    <Link
                      href={getFullUrl(item.hyperlink.url)}
                      target={getFullUrl(item.hyperlink.url).startsWith('http') ? '_blank' : undefined}
                      className="roboto-condensed-regular no_underline p2 white_color"
                    >
                      {item.title}
                    </Link>
                  </div>
                ))}
              {buttonItem && (
                <div className="mob_nav_ele_btn">
                  <button className="nav_ele_btn roboto-condensed-med p2">
                    <Link href={getFullUrl(buttonItem.hyperlink.url)} className="roboto-condensed-regular no_underline p2">
                      {buttonItem.title}
                    </Link>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
