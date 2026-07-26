'use client'

import { useLocale, useTranslations } from 'next-intl'
import { routing } from '@/i18n/routing'

const LOCALE_LABELS: Record<string, string> = {
  ar: 'ع',
  en: 'EN',
}

const LOCALE_NAMES: Record<string, string> = {
  ar: 'العربية',
  en: 'English',
}

function setLocaleCookie(nextLocale: string) {
  document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`
}

export default function LanguageToggle() {
  const locale = useLocale()
  const t = useTranslations('LanguageToggle')

  const switchLocale = (nextLocale: string) => {
    if (nextLocale === locale) return
    setLocaleCookie(nextLocale)
    // A soft `router.refresh()` re-renders Server Components but merges the
    // result into the existing document rather than re-issuing it - it does
    // not reliably re-apply attributes (like `dir`) that app/layout.tsx
    // computes on the root <html> element. Only a real full-document
    // navigation re-executes the request (through proxy.ts -> next-intl ->
    // getLocale()) from scratch, so the new locale's `dir` actually lands.
    window.location.reload()
  }

  return (
    <div
      role="group"
      aria-label={t('groupLabel')}
      style={{
        display: 'flex',
        gap: '2px',
        background: 'var(--bg-input)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '3px',
      }}
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchLocale(loc)}
          aria-pressed={locale === loc}
          title={LOCALE_NAMES[loc] ?? loc}
          style={{
            border: 'none',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            background: locale === loc ? 'var(--btn-bg)' : 'transparent',
            color: locale === loc ? 'var(--btn-text)' : 'var(--text-secondary)',
            transition: 'background-color 0.15s ease',
          }}
        >
          {LOCALE_LABELS[loc] ?? loc}
        </button>
      ))}
    </div>
  )
}
