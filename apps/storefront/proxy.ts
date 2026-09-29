import { NextResponse, type NextRequest } from "next/server"

// Bosnian is served without a prefix (/shop), English under /en (/en/shop). Both live in
// app/[locale]; unprefixed paths are rewritten to /bs/... and /bs/... redirects to the
// unprefixed canonical URL.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const english = /^\/en(\/|$)/.test(pathname)
  // Forwarded for components without route params (the not-found page).
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-locale", english ? "en" : "bs")
  if (english) return NextResponse.next({ request: { headers: requestHeaders } })
  if (/^\/bs(\/|$)/.test(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.replace(/^\/bs/, "") || "/"
    return NextResponse.redirect(url, 308)
  }
  const url = request.nextUrl.clone()
  url.pathname = `/bs${pathname === "/" ? "" : pathname}`
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
}

export const config = {
  // Skip API routes, Next internals and files with an extension (sitemap.xml, icons, images).
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
}
