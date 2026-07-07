"use client";

// CCC TV — the club's own YouTube channel, embedded. The uploads playlist
// (channel id UC… → playlist UU…) always shows the latest videos with no API key.

const CHANNEL_URL = "https://www.youtube.com/channel/UClH02lUKHkbEsWTlvBtNCkQ";
const UPLOADS_EMBED = "https://www.youtube.com/embed/videoseries?list=UUlH02lUKHkbEsWTlvBtNCkQ";

export default function ClubTV() {
  return (
    <section className="base_paddings py-[9vw] lg:py-[3vw] relative z-[6]">
      <div className="max_content center_aligned mx-auto">
        <div className="flex items-end justify-between mb-[5vw] lg:mb-[1.6vw]">
          <div>
            <div className="flex items-center gap-[3vw] lg:gap-[0.8vw]">
              <span className="inline-block w-[1.2vw] lg:w-[5px] h-[7vw] lg:h-[1.9vw] bg-[var(--orange)] rounded-[2px]" />
              <h2 className="oswald-bold text-[color:var(--text)] uppercase text-[6.5vw] lg:text-[2vw] leading-none tracking-wide">
                CCC TV
              </h2>
            </div>
            <p className="roboto-condensed-regular text-[color:var(--text-muted)] mt-[2vw] lg:mt-[0.5vw] pl-[4.2vw] lg:pl-[1.5vw] text-[3.2vw] lg:text-[0.9vw]">
              Match days, on the club&apos;s own channel
            </p>
          </div>
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="roboto-condensed-bold text-[color:var(--orange)] uppercase tracking-wider text-[3vw] lg:text-[0.85vw] no_underline hover:underline shrink-0"
          >
            All videos →
          </a>
        </div>

        <div className="relative w-full overflow-hidden rounded-[2vw] lg:rounded-[0.7vw] border border-[var(--panel-line)] bg-[var(--panel)] aspect-video">
          <iframe
            src={UPLOADS_EMBED}
            title="CCC TV — latest videos from Club Cricket of Chicago"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </div>
    </section>
  );
}
