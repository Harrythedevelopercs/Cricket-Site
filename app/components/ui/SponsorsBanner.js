"use client";

import Image from "next/image";
import React from "react";
// Visuals are theme-aware: the legacy gold `sponsors_bg.png` background image is
// retired in favor of a token surface (var(--ink)) that works in both themes.
// Sponsor content is CMS-managed — the club updates it there.

export default function SponsorsBanner({ data }) {
  // Adjust this to match your CMS base URL
  const cmsBaseUrl = process.env.NEXT_PUBLIC_CMS_URL || "https://cms-ccc.ddev.site/";

  // Helper to build a full absolute URL — CMS asset urls are host-relative
  // ("/images/...") and must be prefixed with the CMS base.
  const getFullImageUrl = (url) => {
    if (!url) return "/images/placeholder.png";
    if (url.startsWith("http")) return url;
    const cleanUrl = url.startsWith("/") ? url.substring(1) : url;
    const baseUrl = cmsBaseUrl.endsWith("/") ? cmsBaseUrl : `${cmsBaseUrl}/`;
    return `${baseUrl}${cleanUrl}`;
  };

  // Pull out the three sponsor images (each array can have 1 or more images)
  const sponsorOne = data?.sImageOne?.[0] || null;
  const sponsorTwo = data?.sImageTwo?.[0] || null;
  const sponsorThree = data?.sImageThree?.[0] || null;

  // Pull out their corresponding hyperlinks
  const sponsorOneLink = data?.SOneHyperlink?.url || null;
  const sponsorTwoLink = data?.STwoHyperlink?.url || null;
  const sponsorThreeLink = data?.SThreeHyperlink?.url || null;

  // Build an array for easier mapping
  const sponsorItems = [
    { image: sponsorOne, link: sponsorOneLink },
    { image: sponsorTwo, link: sponsorTwoLink },
    { image: sponsorThree, link: sponsorThreeLink },
  ].filter((item) => item.image); // keep only sponsors that have an image

  // No sponsors in the CMS → no band. An empty "Our Sponsors" heading reads
  // worse than no section at all.
  if (sponsorItems.length === 0) return null;

  return (
    <section className="sponsors-banner relative py-16 px-4 bg-[#F5F3ED]">
      {/* Sponsor logos are mixed formats (some have baked-in white backgrounds),
          so this is an intentional light "sponsor wall" band in both themes —
          logos read naturally on light instead of as white blocks on dark. */}
      <div className="relative z-10 container mx-auto">
        {/* Title */}
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#16202E] oswald-bold">
          {data?.title || "Our Sponsors"}
        </h2>

        {/* Sponsors grid */}
        <div
          className={`
            grid 
            ${sponsorItems.length <= 1
              ? "grid-cols-1"
              : sponsorItems.length === 2
              ? "grid-cols-1 md:grid-cols-2"
              : sponsorItems.length === 3
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-2 md:grid-cols-2 lg:grid-cols-4"
            }
            gap-8 w-full mx-auto
          `}
        >
          {sponsorItems.map(({ image, link }, index) => {
            const imageUrl = getFullImageUrl(image.url);
            const altText = image.alt || image.title || "Sponsor logo";

            return (
              <div
                key={image.id || index}
                className="flex justify-center items-center p-4"
              >
                {/* If we have a link, wrap the image in <a>. Otherwise, just render the image. */}
                {link ? (
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={imageUrl}
                      alt={altText}
                      width={300}
                      height={200}
                      className="max-h-48 w-auto object-contain"
                      unoptimized={true}
                    />
                    <noscript>
                      <img
                        src={imageUrl}
                        alt={altText}
                        className="max-h-48 w-auto object-contain"
                      />
                    </noscript>
                  </a>
                ) : (
                  <>
                    <Image
                      src={imageUrl}
                      alt={altText}
                      width={300}
                      height={200}
                      className="max-h-48 w-auto object-contain"
                      unoptimized={true}
                    />
                    <noscript>
                      <img
                        src={imageUrl}
                        alt={altText}
                        className="max-h-48 w-auto object-contain"
                      />
                    </noscript>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Real clubs are always recruiting backers — say so. */}
        <p className="text-center mt-10 roboto-condensed-regular text-[#16202E]/70 text-sm">
          Want your brand alongside the club?{" "}
          <a
            href="mailto:connect@clubcricketofchicago.com?subject=Sponsoring%20Club%20Cricket%20of%20Chicago"
            className="underline underline-offset-2 hover:text-[#16202E]"
          >
            Sponsor Club Cricket of Chicago →
          </a>
        </p>
      </div>
    </section>
  );
}
