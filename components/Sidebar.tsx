'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useIsMobile } from '@/hooks/useIsMobile'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/lib/context/UserProfileContext'
import {
  LayoutDashboard,
  CalendarDays,
  Globe,
  Building2,
  Star,
  Share2,
  BarChart3,
  Trophy,
  BookOpen,
  Users,
  Calendar,
  LogOut,
  User,
  BookUser,
  ClipboardList,
  FileText,
  Folder,
} from 'lucide-react'

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
}

const CONTACTS_ALLOWED_ROLES = ['developer', 'ceo', 'project_manager', 'media_manager']

function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) {
  const Icon = item.icon
  const isRtl = useLocale() === 'ar'
  const activeBorder = isActive ? '2px solid var(--text-on-dark)' : '2px solid transparent'
  return (
    <Link
      href={item.href}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        borderRadius: '8px',
        margin: '0 8px',
        fontSize: '14px',
        color: 'var(--text-on-dark)',
        background: isActive ? 'var(--sidebar-active)' : 'transparent',
        borderRight: isRtl ? activeBorder : undefined,
        borderLeft: isRtl ? undefined : activeBorder,
        transition: 'background-color 0.15s ease, color 0.15s ease',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--sidebar-hover)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      <Icon size={16} />
      <span>{item.label}</span>
    </Link>
  )
}

export default function Sidebar() {
  const t = useTranslations('Sidebar')
  const isRtl = useLocale() === 'ar'
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)

  const mainNav: NavItem[] = [
    { href: '/', icon: LayoutDashboard, label: t('home') },
  ]

  const contentNav: NavItem[] = [
    { href: '/events', icon: CalendarDays, label: t('events') },
    { href: '/exhibitions', icon: Building2, label: t('exhibitions') },
    { href: '/world-days', icon: Globe, label: t('worldDays') },
    { href: '/company-events', icon: Star, label: t('companyEvents') },
  ]

  const toolsNav: NavItem[] = [
    { href: '/reports', icon: BarChart3, label: t('reports') },
    { href: '/weekly-reports', icon: ClipboardList, label: t('weeklyReports') },
    { href: '/employee-requests', icon: FileText, label: t('employeeRequests') },
    { href: '/predictions', icon: Trophy, label: t('predictions') },
    { href: '/courses', icon: BookOpen, label: t('courses') },
    { href: '/employees', icon: Users, label: t('employees') },
    { href: '/calendar', icon: Calendar, label: t('calendar') },
    { href: '/files', icon: Folder, label: t('files') },
  ]

  const supabase = createClient()
  const router = useRouter()
  const { profile: userProfile } = useUserProfile()
  const locale = useLocale()
  const displayName = locale === 'en' && userProfile?.full_name_en ? userProfile.full_name_en : userProfile?.full_name_ar
  const displayJobTitle = locale === 'en' && userProfile?.job_title_en ? userProfile.job_title_en : userProfile?.job_title_ar
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const closeSidebar = () => setIsOpen(false)

  const sidebarStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: 0,
        ...(isRtl ? { right: 0 } : { left: 0 }),
        width: '260px',
        height: '100vh',
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 150,
        overflowY: 'auto',
        transform: isOpen ? 'translateX(0)' : isRtl ? 'translateX(100%)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }
    : {
        position: 'fixed',
        top: 0,
        ...(isRtl ? { right: 0 } : { left: 0 }),
        width: '220px',
        height: '100vh',
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflowY: 'auto',
      }

  return (
    <>
      {/* Hamburger button — mobile only */}
      {isMobile && (
        <button
          onClick={() => setIsOpen((o) => !o)}
          style={{
            position: 'fixed',
            top: '12px',
            ...(isRtl ? { right: '12px' } : { left: '12px' }),
            width: '44px',
            height: '44px',
            background: 'var(--navy)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            zIndex: 200,
            cursor: 'pointer',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="القائمة"
        >
          ☰
        </button>
      )}

      {/* Overlay — mobile only when open */}
      {isMobile && isOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 140,
          }}
        />
      )}

      <aside style={sidebarStyle}>
        {/* Logo */}
        <div style={{
          padding: '24px 16px 20px',
          borderBottom: '1px solid rgba(198,155,46,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src="/f20-logo-full.jpeg"
            alt="F-Twenty Event Management"
            style={{
              width: '150px',
              height: 'auto',
              maxWidth: '100%',
              objectFit: 'contain',
              display: 'block',
              borderRadius: '10px',
            }}
          />
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={isMobile ? closeSidebar : undefined} />
          ))}

          {contentNav.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={isMobile ? closeSidebar : undefined} />
          ))}

          {toolsNav.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={isMobile ? closeSidebar : undefined} />
          ))}
          {!!userProfile && CONTACTS_ALLOWED_ROLES.includes(userProfile.role) && (
            <NavLink
              key="/contacts"
              item={{ href: '/contacts', icon: BookUser, label: t('contacts') }}
              isActive={isActive('/contacts')}
              onClick={isMobile ? closeSidebar : undefined}
            />
          )}
          <NavLink
            key="/social"
            item={{ href: '/social', icon: Share2, label: t('social') }}
            isActive={isActive('/social')}
            onClick={isMobile ? closeSidebar : undefined}
          />
        </nav>

        {/* User info */}
        <div
          ref={dropdownRef}
          style={{
            position: 'relative',
            padding: '16px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              bottom: '70px',
              right: '12px',
              left: '12px',
              background: 'var(--sidebar-bg)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              overflow: 'hidden',
              zIndex: 200,
              boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: '13px', color: 'var(--text-on-dark)', fontWeight: 600 }}>
                  {displayName || 'المستخدم'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-on-dark)', marginTop: '2px' }}>
                  {displayJobTitle || 'موظف'}
                </div>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); router.push('/profile') }}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-on-dark)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--sidebar-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <User size={14} />
                <span>{t('profile')}</span>
              </button>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: '#FF6B6B',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,107,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={14} />
                <span>{t('logout')}</span>
              </button>
            </div>
          )}

          <div
            onClick={() => setDropdownOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '6px 4px',
              borderRadius: '8px',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--sidebar-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <img
              src={userProfile?.profile_image_url || '/employee_placeholder.png'}
              alt={displayName || 'المستخدم'}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', color: 'var(--text-on-dark)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName || 'المستخدم'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-on-dark)' }}>
                {displayJobTitle || 'موظف'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
