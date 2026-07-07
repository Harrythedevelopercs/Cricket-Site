"use client";

export const dynamic = "force-dynamic";

import React, { FormEvent, useRef, useState } from "react";
import { sendForm } from "emailjs-com";
import Image from "next/image";
import Link from "next/link";
import { usePageTitle } from "../lib/usePageTitle";

// Field name attributes are the EmailJS template params (template_hr5t6cq) —
// do not rename them: full_name, email, telphone, age, gender, club_id, bio.

type FormStatus = "idle" | "sending" | "success" | "error";

const CONTACT_EMAIL = "connect@clubcricketofchicago.com";

const labelCls =
  "block roboto-condensed-med uppercase tracking-[0.1em] text-[3vw] lg:text-[0.7vw] text-[color:var(--text-muted)] mb-[1.6vw] lg:mb-[0.4vw]";
const fieldCls =
  "w-full rounded-[var(--radius-sm)] border border-[var(--panel-line-strong)] bg-[var(--panel-2)] px-[3.4vw] py-[2.6vw] lg:px-[0.85vw] lg:py-[0.6vw] roboto-condensed-regular text-[4vw] lg:text-[0.95vw] text-[color:var(--text)] placeholder:text-[color:var(--text-dim)] focus:border-[var(--orange)] outline-none transition-colors";
const bodyCls =
  "roboto-condensed-regular text-[color:var(--text-muted)] text-[3.8vw] lg:text-[0.95vw] leading-relaxed";
const mailLinkCls =
  "text-[color:var(--orange)] hover:text-[color:var(--orange-bright)] hover:underline";

function Step({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-[4vw] lg:gap-[1.1vw]">
      <span
        className="ds-num text-[color:var(--orange)] text-[7vw] lg:text-[1.9vw] leading-none"
        aria-hidden="true"
      >
        {num}
      </span>
      <div>
        <h3 className="roboto-condensed-bold text-[color:var(--text)] text-[4.4vw] lg:text-[1.1vw] leading-tight">
          {title}
        </h3>
        <p className={`${bodyCls} mt-[1vw] lg:mt-[0.25vw]`}>{children}</p>
      </div>
    </li>
  );
}

export default function JoinUsPage() {
  usePageTitle("Join Us");
  const form = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [bannerOk, setBannerOk] = useState(true);

  function sendEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.current || status === "sending") return;

    // Basic client-side validation: name + email are the only requirements.
    const data = new FormData(form.current);
    const name = String(data.get("full_name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    if (!name || !email) {
      setValidationMsg("Please add your name and email so we can get back to you.");
      return;
    }
    setValidationMsg(null);
    setStatus("sending");

    sendForm(
      "service_13kiadg", // EmailJS service ID (unchanged)
      "template_hr5t6cq", // EmailJS template ID (unchanged)
      form.current,
      "It3y6Vk01CcKyFTFD" // EmailJS public key (unchanged)
    ).then(
      (result) => {
        if (result.text === "OK") {
          form.current?.reset();
          setStatus("success");
        } else {
          setStatus("error");
        }
      },
      () => {
        setStatus("error");
      }
    );
  }

  return (
    <section className="base_paddings pt-[100px] pb-[16vw] lg:pt-[136px] lg:pb-[5vw]">
      <div className="max_content center_aligned">
        {/* ---- Page header ---- */}
        <header>
          <p className="ds-eyebrow ds-eyebrow--orange">Join us</p>
          <h1 className="ds-display text-[9.5vw] lg:text-[3.4vw] mt-[2vw] lg:mt-[0.6vw]">
            Play cricket in Chicago
          </h1>
          <p className={`${bodyCls} max-w-[62ch] mt-[3vw] lg:mt-[1vw] text-[4vw] lg:text-[1.05vw]`}>
            Club Cricket of Chicago is a member-run club playing summer league
            cricket in the Midwest Cricket Conference. All skill levels are
            welcome — we field three sides across divisions, so there&apos;s a
            place to play whatever your level.
          </p>
        </header>

        {/* ---- Club photo banner (hidden gracefully if the file is missing) ---- */}
        {bannerOk && (
          <figure className="relative w-full overflow-hidden rounded-[3vw] lg:rounded-[0.8vw] border border-[var(--panel-line)] aspect-[16/9] lg:aspect-[21/8] mt-[6vw] lg:mt-[2.2vw] m-0">
            <Image
              src="/images/club/join-team.jpg"
              alt="Club Cricket of Chicago players together on match day"
              fill
              sizes="(min-width: 1024px) 1440px, 100vw"
              className="object-cover"
              unoptimized
              onError={() => setBannerOk(false)}
            />
            {/* dark scrim for caption legibility, in both themes */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"
              aria-hidden="true"
            />
            <figcaption className="absolute bottom-0 left-0 right-0 p-[4vw] lg:p-[1.4vw]">
              <p className="ds-eyebrow text-[#F4F0E8]/90">Club Cricket of Chicago</p>
            </figcaption>
          </figure>
        )}

        {/* ---- Two columns: the pitch (left) + the form (right) ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-[10vw] lg:gap-[3.5vw] items-start mt-[8vw] lg:mt-[3vw]">
          {/* LEFT — why and how */}
          <div>
            <h2 className="ds-eyebrow">How it works</h2>
            <ol className="list-none p-0 m-0 mt-[4vw] lg:mt-[1.3vw] space-y-[5.5vw] lg:space-y-[1.5vw]">
              <Step num="01" title="Tell us about yourself">
                Fill in the form — a line or two about your cricket is plenty.
              </Step>
              <Step num="02" title="We'll reach out">
                Usually within a week. If you&apos;d rather email, write to{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className={mailLinkCls}>
                  {CONTACT_EMAIL}
                </a>
                .
              </Step>
              <Step num="03" title="Come to a session">
                Meet the squad, have a bat and a bowl. We&apos;ll walk you
                through the season, kit and costs when we talk.
              </Step>
            </ol>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[4vw] lg:gap-[1.2vw] mt-[8vw] lg:mt-[2.4vw]">
              <div className="ccc-card p-[4.5vw] lg:p-[1.3vw]">
                <h2 className="ds-eyebrow">Where we play</h2>
                <p className={`${bodyCls} mt-[2vw] lg:mt-[0.5vw]`}>
                  Washington Park (5500 S King Dr, Chicago) and grounds across
                  Chicagoland.
                </p>
                <Link
                  href="/grounds"
                  className="inline-block roboto-condensed-bold uppercase tracking-wide text-[3.4vw] lg:text-[0.82vw] text-[color:var(--orange)] hover:text-[color:var(--orange-bright)] mt-[2.5vw] lg:mt-[0.7vw]"
                >
                  See our grounds <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="ccc-card p-[4.5vw] lg:p-[1.3vw]">
                <h2 className="ds-eyebrow">The season</h2>
                <p className={`${bodyCls} mt-[2vw] lg:mt-[0.5vw]`}>
                  Summer league cricket in the Midwest Cricket Conference, with
                  red-ball and T20 divisions.
                </p>
                <Link
                  href="/schedule"
                  className="inline-block roboto-condensed-bold uppercase tracking-wide text-[3.4vw] lg:text-[0.82vw] text-[color:var(--orange)] hover:text-[color:var(--orange-bright)] mt-[2.5vw] lg:mt-[0.7vw]"
                >
                  See the schedule <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT — the form */}
          <aside
            className="ccc-card p-[5.5vw] lg:p-[1.8vw] lg:sticky lg:top-[120px]"
            aria-live="polite"
          >
            {status === "success" ? (
              <div className="py-[4vw] lg:py-[1.5vw]">
                <p className="ds-display text-[6.5vw] lg:text-[1.6vw]">
                  Thanks — we&apos;ll get back to you
                </p>
                <p className={`${bodyCls} mt-[3vw] lg:mt-[0.9vw]`}>
                  Usually within a week. If you don&apos;t hear from us, email{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className={mailLinkCls}>
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="ccc-btn ccc-btn-ghost mt-[5vw] lg:mt-[1.4vw]"
                >
                  Send another
                </button>
              </div>
            ) : (
              <>
                <h2 className="ds-display text-[6.5vw] lg:text-[1.6vw]">
                  Tell us about yourself
                </h2>
                <p className={`${bodyCls} mt-[2vw] lg:mt-[0.5vw]`}>
                  A few details and we&apos;ll take it from there. Name and
                  email are all we need.
                </p>

                <form
                  ref={form}
                  name="ju_form"
                  onSubmit={sendEmail}
                  className="mt-[5vw] lg:mt-[1.4vw] space-y-[4vw] lg:space-y-[1vw]"
                >
                  <div>
                    <label htmlFor="ju-name" className={labelCls}>
                      Full name
                    </label>
                    <input
                      id="ju-name"
                      type="text"
                      name="full_name"
                      autoComplete="name"
                      required
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="ju-email" className={labelCls}>
                      Email
                    </label>
                    <input
                      id="ju-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="ju-phone" className={labelCls}>
                      Phone
                    </label>
                    <input
                      id="ju-phone"
                      type="tel"
                      name="telphone"
                      autoComplete="tel"
                      placeholder="888 888 8888"
                      className={fieldCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-[3vw] lg:gap-[0.9vw]">
                    <div>
                      <label htmlFor="ju-age" className={labelCls}>
                        Age
                      </label>
                      <input
                        id="ju-age"
                        type="number"
                        name="age"
                        min={0}
                        inputMode="numeric"
                        className={fieldCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="ju-gender" className={labelCls}>
                        Gender
                      </label>
                      <input
                        id="ju-gender"
                        type="text"
                        name="gender"
                        className={fieldCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="ju-club-id" className={labelCls}>
                      CricClubs Player ID (optional)
                    </label>
                    <input
                      id="ju-club-id"
                      type="text"
                      name="club_id"
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="ju-bio" className={labelCls}>
                      Short bio
                    </label>
                    <textarea
                      id="ju-bio"
                      name="bio"
                      rows={4}
                      placeholder="Bat, bowl or keep? Where have you played?"
                      className={`${fieldCls} resize-y`}
                    ></textarea>
                  </div>

                  {validationMsg && (
                    <p
                      role="alert"
                      className="roboto-condensed-med text-[color:var(--loss)] text-[3.6vw] lg:text-[0.9vw]"
                    >
                      {validationMsg}
                    </p>
                  )}
                  {status === "error" && (
                    <p
                      role="alert"
                      className="roboto-condensed-med text-[color:var(--loss)] text-[3.6vw] lg:text-[0.9vw]"
                    >
                      Something went wrong and your details didn&apos;t send.
                      Try again, or email{" "}
                      <a href={`mailto:${CONTACT_EMAIL}`} className={mailLinkCls}>
                        {CONTACT_EMAIL}
                      </a>
                      .
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="ccc-btn ccc-btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {status === "sending" ? "Sending…" : "Send"}
                  </button>
                </form>
              </>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
