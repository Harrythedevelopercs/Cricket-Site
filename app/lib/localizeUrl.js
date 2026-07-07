// CMS links are sometimes entered as absolute production URLs
// (https://clubcricketofchicago.com/join-us). Navigating those does a full
// page load to the live site — wrong host on previews, new-tab treatment in
// the nav, and a jarring reload in prod. Rewrite own-domain URLs to relative
// paths so they navigate in-app on whatever host is serving the site.
const OWN_HOST = /(^|\.)clubcricketofchicago\.com$/i;

export function localizeUrl(url) {
  if (!url || typeof url !== "string") return url;
  try {
    const u = new URL(url, "https://clubcricketofchicago.com");
    if (OWN_HOST.test(u.hostname)) return u.pathname + u.search + u.hash;
  } catch {
    /* leave malformed URLs untouched */
  }
  return url;
}
