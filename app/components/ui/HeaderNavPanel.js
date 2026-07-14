"use client"

import * as Dialog from '@radix-ui/react-dialog'
import * as Popover from '@radix-ui/react-popover'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { fetchGraphQL } from '../../lib/graphqlClient'
import { localizeUrl } from '../../lib/localizeUrl'
import { getNavigationConfig } from '../../lib/queries/navigationQuery'
import { buildNavigationItems } from './navigationModel'
import LogoContainer from './LogoContainer'
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

function destinationFor(navItem) {
  return localizeUrl(navItem.hyperlink.url)
}

function NavEle({ navItem }) {
  const url = destinationFor(navItem)
  const external = url.startsWith('http')
  const iconData = navItem.navigationIcon?.[0]

  return (
    <div className="nav_ele flex_grid">
      <div className="nav_ele_text">
        <Link href={url} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="no_underline p2">
          {navItem.title}
          {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
        </Link>
      </div>
      {iconData ? <NavEleIco iconData={iconData} /> : null}
    </div>
  )
}

function NavEleBtn({ navItem, onNavigate }) {
  const url = destinationFor(navItem)
  return (
    <div className="nav_ele">
      <Link href={url} onClick={onNavigate} className="nav_ele_btn roboto-condensed-med p2">
        {navItem.title}
      </Link>
    </div>
  )
}

function NavContainer({ navigationItems }) {
  const buttonItem = navigationItems.find((item) => item.buttonToggle)
  const links = navigationItems.filter((item) => !item.buttonToggle)
  const direct = links.filter((item) => /^(schedule|tournaments|players|records|match reports|gallery)$/i.test(item.title))
  const more = links.filter((item) => !direct.includes(item))

  return (
    <nav className="nav_container flex_grid" aria-label="Primary navigation">
      {direct.map((item) => <NavEle key={item.id} navItem={item} />)}
      {more.length ? (
        <Popover.Root>
          <Popover.Trigger asChild>
            <button type="button" className="nav_more_trigger" aria-label="Open more navigation links">More <span aria-hidden="true">⌄</span></button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content className="nav_more_content" sideOffset={12} align="end">
              <nav aria-label="More club links" className="nav_more_list">
                {more.map((item) => <NavEle key={item.id} navItem={item} />)}
              </nav>
              <Popover.Arrow className="nav_more_arrow" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      ) : null}
      {buttonItem ? <NavEleBtn navItem={buttonItem} /> : null}
    </nav>
  )
}

function MobileNavigation({ navigationItems, loading }) {
  const [open, setOpen] = useState(false)
  const buttonItem = navigationItems.find((item) => item.buttonToggle)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="mobile_nav_ele">
        <Dialog.Trigger asChild>
          <button
            type="button"
            className={`nav_burger mobile-only${open ? ' nav-open' : ''}`}
            aria-label={open ? 'Close site menu' : 'Open site menu'}
          >
            <span />
            <span />
            <span />
          </button>
        </Dialog.Trigger>
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="mobile_navigation_overlay" />
        <Dialog.Content className="mobile_navigation" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Site navigation</Dialog.Title>
          <div className="mobile_navigation_topline">
            <span className="ds-label">Explore CCC</span>
            <Dialog.Close asChild>
              <button type="button" className="mobile_navigation_close" aria-label="Close site menu">×</button>
            </Dialog.Close>
          </div>
          <nav className="mob_nav_parent" aria-label="Mobile navigation">
            {loading ? <p className="text-[color:var(--text-muted)]">Loading navigation…</p> : (
              <>
                {navigationItems.filter((item) => !item.buttonToggle).map((item) => {
                  const url = destinationFor(item)
                  const external = url.startsWith('http')
                  return (
                    <Link
                      key={item.id}
                      href={url}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noreferrer' : undefined}
                      onClick={() => setOpen(false)}
                      className="mob_nav_link roboto-condensed-regular no_underline"
                    >
                      <span>{item.title}</span>
                      <span aria-hidden="true">{external ? '↗' : '→'}</span>
                    </Link>
                  )
                })}
                {buttonItem ? <NavEleBtn navItem={buttonItem} onNavigate={() => setOpen(false)} /> : null}
              </>
            )}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default function HeaderNavPanel() {
  const headerRef = useRef(null)
  const [navigationItems, setNavigationItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchNavigation() {
      try {
        const data = await fetchGraphQL(getNavigationConfig())
        if (!data?.entries) throw new Error('No navigation data returned from API')
        setNavigationItems(buildNavigationItems(data.entries))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setNavigationItems(buildNavigationItems([]))
      } finally {
        setLoading(false)
      }
    }
    fetchNavigation()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const element = headerRef.current
      if (!element) return
      element.classList.toggle('active_header', window.scrollY > element.offsetHeight && window.innerWidth > 1024)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header ref={headerRef} className="main_header base_paddings">
        <div className="center_aligned flex_grid">
          <LogoContainer href="/" className="site_logo" imageUrl="logo.png" />
          {loading ? null : <NavContainer navigationItems={navigationItems} />}
          {error ? <span className="sr-only">The live menu could not load; local navigation is available.</span> : null}
          <ThemeToggle />
          <MobileNavigation navigationItems={navigationItems} loading={loading} />
        </div>
      </header>
    </>
  )
}
