'use client'

import LogoContainer from './LogoContainer'
import Link from 'next/link'
import Image from 'next/image'

// Social media links. Only profiles the club actually has — placeholder links
// to twitter.com/instagram.com/facebook.com homepages were removed (re-add with
// real profile URLs when available).
const SOCIAL_LINKS = [
  { href: 'https://www.youtube.com/channel/UClH02lUKHkbEsWTlvBtNCkQ', icon: 'YoutubeLogoWhite.svg', alt: 'YouTube' },
]

// Navigation links
const FOOTER_LINKS = [
  { href: '/schedule', label: 'Schedule' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/players', label: 'Players' },
  { href: '/records', label: 'Records' },
  { href: '/reports', label: 'Match Reports' },
  { href: '/about', label: 'Our Story' },
  { href: 'https://www.youtube.com/channel/UClH02lUKHkbEsWTlvBtNCkQ', label: 'CCC TV', newTab: true },
  { href: '/ccc-academy', label: 'CCC Academy' },
  { href: '/grounds', label: 'Grounds' },
  { href: '/join-us', label: 'Join Us' },
]

function SocialIcon({ href, icon, alt }) {
  return (
    <Link href={href} target="_blank" className="mx-2">
      <Image
        src={`/images/social-icons/${icon}`}
        alt={alt}
        width={32}
        height={32}
        className="hover:opacity-80 transition-opacity w-full h-auto"
      />
    </Link>
  )
}

export default function FooterPanel() {
  return (
    <footer className="bg-[var(--ink-2)] text-[color:var(--text)] pt-12 pb-4">
      <div className="base_paddings">
        <div className="flex_grid max_content center_aligned justify-between flex-wrap">
          {/* Logo Section */}
          <div className="w-1/4 desk_only footer_logo">
            <LogoContainer href="/" imageUrl="logo.png" className="w-3/4" />
          </div>
          
          {/* Address Section */}
          <div className="footer_address">
            <h4 className="oswald-med p1 brand_orange mb-4">Address</h4>
            <p className="roboto-condensed-regular p3 white_color mb-1">
              211 Valarie St, Glenview 60025,
            </p>
            <p className="roboto-condensed-regular p3 white_color">
              Illinois, United States
            </p>
            
            <h4 className="oswald-med p1 brand_orange mb-4 mt-8">Contact us</h4>
            <p className="roboto-condensed-regular p3 white_color mb-1">
              +1-517-358-2588
            </p>
            <p className="roboto-condensed-regular p3 white_color">
              connect@clubcricketofchicago.com
            </p>
          </div>
          
          {/* Navigation Links */}
          <div className="footer_nav">
            <h4 className="oswald-med p1 brand_orange mb-4">Club Cricket of Chicago</h4>
            <nav>
              <ul>
                {FOOTER_LINKS.map((link) => (
                  <li key={link.label} className="mb-2">
                    <Link
                      href={link.href}
                      target={link.newTab ? "_blank" : undefined}
                      className="roboto-condensed-regular p3 white_color no_underline hover:text-[color:var(--orange)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          
          {/* Social Media Links */}
          <div className="footer_social">
            <div className="flex flex-row lg:flex-col mb-4 justify-between h-full w-[70%] gap-[5vw] lg:gap-0 lg:w-[35%]">
              {SOCIAL_LINKS.map((social) => (
                <SocialIcon
                  key={social.alt}
                  href={social.href}
                  icon={social.icon}
                  alt={social.alt}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Copyright Section */}
        <div className="text-center mt-12 pt-4 border-t border-[var(--panel-line)]">
          <p className="roboto-condensed-light p5 grey_text">
            Copyrights CCC {new Date().getFullYear()}, All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
