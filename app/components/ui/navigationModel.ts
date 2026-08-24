export interface NavigationItem {
  id: string;
  title: string;
  buttonToggle?: boolean;
  hyperlink: { url: string };
  navigationIcon?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export const LOCAL_NAV_ITEMS: NavigationItem[] = [
  { id: "local-records", title: "Records", buttonToggle: false, hyperlink: { url: "/records" }, navigationIcon: [] },
  { id: "local-reports", title: "Match Reports", buttonToggle: false, hyperlink: { url: "/reports" }, navigationIcon: [] },
  { id: "local-gallery", title: "Gallery", buttonToggle: false, hyperlink: { url: "/gallery" }, navigationIcon: [] },
  { id: "local-story", title: "Our Story", buttonToggle: false, hyperlink: { url: "/about" }, navigationIcon: [] },
];

const normalizedUrl = (url = "") => url.trim().replace(/\/+$/, "") || "/";

export function buildNavigationItems<T extends NavigationItem>(source: readonly T[]): NavigationItem[] {
  const items = source.map((item) => ({ ...item, hyperlink: { ...item.hyperlink } }));
  const buttons = items.filter((item) => item.buttonToggle);
  const links = items.filter((item) => !item.buttonToggle);
  const loginIndex = links.findIndex((item) => /log\s*-?\s*in|webmail/i.test(item.title || ""));
  const login = loginIndex >= 0 ? links.splice(loginIndex, 1)[0] : null;

  const usedUrls = new Set(links.map((item) => normalizedUrl(item.hyperlink?.url)));
  const usedTitles = new Set(links.map((item) => item.title.trim().toLocaleLowerCase()));
  const localItems = LOCAL_NAV_ITEMS.filter((item) => {
    const url = normalizedUrl(item.hyperlink.url);
    const title = item.title.toLocaleLowerCase();
    if (usedUrls.has(url) || usedTitles.has(title)) return false;
    usedUrls.add(url);
    usedTitles.add(title);
    return true;
  });

  // The CMS nav's staff login/webmail entry is an internal tool, not a page a
  // visitor should see — it's pulled from the header entirely (the splice
  // above) and lives in the footer instead (FooterPanel's "Staff Webmail").
  void login;
  return [...links, ...localItems, ...buttons];
}
