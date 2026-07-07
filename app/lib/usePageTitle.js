"use client";

// Per-page browser titles. Pages here are client components (no metadata export),
// so the title is set on mount — enough for tabs, history and bookmarks.
import { useEffect } from "react";

const SITE = "Club Cricket of Chicago";

export function usePageTitle(title) {
  useEffect(() => {
    if (!title) return;
    const prev = document.title;
    document.title = `${title} — ${SITE}`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
