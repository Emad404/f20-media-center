import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

// Only these routes have been migrated to app/[locale]/ so far.
// Every other route stays untouched by next-intl until it's migrated.
// Add a new entry here each time another page moves into app/[locale]/.
const INTL_MIGRATED_PATHS = ['/', '/login', '/contacts']

const intlMiddleware = createIntlMiddleware(routing)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, user } = await updateSession(request)

  if (!user && pathname !== '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
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
