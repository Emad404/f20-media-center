import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

// Only these routes have been migrated to app/[locale]/ so far.
// Every other route stays untouched by next-intl until it's migrated.
// Add a new entry here each time another page moves into app/[locale]/.
const INTL_MIGRATED_PATHS = ['/', '/login', '/set-password', '/set-password/start', '/contacts', '/employees', '/calendar', '/courses', '/social', '/events', '/world-days', '/exhibitions', '/company-events', '/predictions', '/profile', '/reports']

// Reachable without an existing session - /set-password must be, since the
// very first request after clicking an invite link lands here before the
// browser client has had a chance to parse the session tokens out of the
// URL and turn them into cookies. /set-password/start is the fragment-token
// landing page that precedes it (see app/[locale]/set-password/start) and
// never touches Supabase auth itself, so it's public for the same reason.
const PUBLIC_PATHS = ['/login', '/set-password', '/set-password/start']

const intlMiddleware = createIntlMiddleware(routing)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, user } = await updateSession(request)

  if (!user && !PUBLIC_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Invites are created with user_metadata.password_set: false so a fresh
    // invite session can be told apart from a normal logged-in one - without
    // this, any valid session (including one that never went through a
    // password) reads as "logged in, go to dashboard".
    const mustSetPassword = user.user_metadata?.password_set === false

    if (mustSetPassword && pathname !== '/set-password') {
      const url = request.nextUrl.clone()
      url.pathname = '/set-password'
      return NextResponse.redirect(url)
    }

    // Deliberately NOT bouncing an already-authenticated user off
    // /set-password here: the very first request after clicking an invite
    // link carries whatever session cookie already existed in that browser
    // (e.g. an admin's own session) - the invite's tokens only exist in the
    // URL fragment, which the server never sees. Redirecting here based on
    // the stale cookie would race the client-side code that's about to swap
    // in the real invite session from that fragment. The page itself
    // handles redirecting away once it knows, client-side, which session it
    // actually ended up with.
    if (!mustSetPassword && pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  if (INTL_MIGRATED_PATHS.includes(pathname)) {
    // next-intl's `localeDetection` flag gates cookie AND Accept-Language
    // detection together - there's no way to keep the cookie (needed for a
    // future locale toggle) while disabling only the browser header via
    // routing config. Until a toggle exists, strip Accept-Language so the
    // only way to get a non-default locale is an explicit NEXT_LOCALE
    // cookie; everyone else falls through to routing.defaultLocale ('ar').
    const headersWithoutAcceptLanguage = new Headers(request.headers)
    headersWithoutAcceptLanguage.delete('accept-language')
    const intlRequest = new NextRequest(request.url, { headers: headersWithoutAcceptLanguage })

    const intlResponse = intlMiddleware(intlRequest)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie)
    })
    return intlResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.jpeg).*)',
  ],
}
