'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import LogoContainer from './LogoContainer'
import CommonButton from './CommonButton'
import Image from 'next/image'

export default function BGParralaxBanner({ data }) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 400], [0, -100])

  const cmsBaseUrl = process.env.NEXT_PUBLIC_CMS_URL || 'https://cms-ccc.ddev.site/'
  const getFullImageUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url
    const baseUrl = cmsBaseUrl.endsWith('/') ? cmsBaseUrl : `${cmsBaseUrl}/`
    return `${baseUrl}${cleanUrl}`
  }

  const logoUrl =
    data &&
    data.logo &&
    data.logo[0] &&
    data.logo[0].url
      ? getFullImageUrl(data.logo[0].url)
      : '/images/logo.png'

  let backgroundImage = '/images/placeholder_banner_bg.jpg'
  if (data && data.localBgOverride) {
    // Page-supplied local photo takes precedence over the CMS image (used to put
    // real club photography behind CMS-authored banner copy).
    backgroundImage = data.localBgOverride
  } else if (data && data.backgroundImage && data.backgroundImage[0] && data.backgroundImage[0].url) {
    backgroundImage = getFullImageUrl(data.backgroundImage[0].url)
  } else if (data && data.bgImage && data.bgImage[0] && data.bgImage[0].url) {
    backgroundImage = getFullImageUrl(data.bgImage[0].url)
  } else if (data && data.bannerImage && data.bannerImage[0] && data.bannerImage[0].url) {
    backgroundImage = getFullImageUrl(data.bannerImage[0].url)
  } else if (data && data.image && data.image[0] && data.image[0].url) {
    backgroundImage = getFullImageUrl(data.image[0].url)
  }

  return (
    <section
      className="parallax-section joinUs_bgParrallax"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <motion.div className="content NMC_container" style={{ y }}>
        <div className="NMC_title mb-[1%]">
          <h4 className="white_color oswald-regular h2">
            {data && data.title ? data.title : 'Join the Team'}
          </h4>
        </div>

        {data && data.logo && data.logo[0] && data.logo[0].url ? (
          <div
            className={`mb-[1%] mx-auto ${
              data && data.bodyCopy ? 'w-[13%]' : 'w-[55%] lg:w-[21%] my-[1%]'
            }`}
          >
            <Image
              src={logoUrl}
              alt={data.logo[0].alt || 'Logo'}
              width={240}
              height={120}
              className="w-full h-auto object-contain"
              priority
              unoptimized
            />
          </div>
        ) : (
          <LogoContainer
            href=""
            imageUrl="logo.png"
            className={`parrallax_logo site_logo logo_center mb-8 ${
              data && data.bodyCopy ? 'w-[10%]' : 'w-[16%]'
            }`}
          />
        )}

        {data && data.bodyCopy && (
          <div className="mb-8 max-w-2xl text-center mx-auto">
            <p className="white_color roboto-condensed-regular p2 text-center">
              {data.bodyCopy}
            </p>
          </div>
        )}

        <CommonButton
          setRoutePath={(data && data.ctaHyperlink && data.ctaHyperlink.url) || '/join-us'}
          className="mb-auto"
        >
          {data && data.cta ? data.cta : 'Join Now'}
        </CommonButton>
      </motion.div>
    </section>
  )
}
