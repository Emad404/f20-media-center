'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
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
} from 'lucide-react'

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
}

const mainNav: NavItem[] = [
  { href: '/', icon: LayoutDashboard, label: 'الرئيسية' },
]

const contentNav: NavItem[] = [
  { href: '/events', icon: CalendarDays, label: 'فعاليات المملكة' },
  { href: '/world-days', icon: Globe, label: 'الأيام العالمية' },
  { href: '/exhibitions', icon: Building2, label: 'المعارض والمؤتمرات' },
  { href: '/company-events', icon: Star, label: 'فعاليات الشركة' },
  { href: '/social', icon: Share2, label: 'السوشال ميديا' },
]

const toolsNav: NavItem[] = [
  { href: '/reports', icon: BarChart3, label: 'تقارير الأداء' },
  { href: '/predictions', icon: Trophy, label: 'توقعات الهلال' },
  { href: '/courses', icon: BookOpen, label: 'الدورات التدريبية' },
  { href: '/employees', icon: Users, label: 'الموظفين' },
  { href: '/calendar', icon: Calendar, label: 'التقويم' },
]

function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) {
  const Icon = item.icon
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
        margin: '1px 8px',
        fontSize: '14px',
        color: isActive ? 'var(--gold)' : 'var(--text-on-dark-muted)',
        background: isActive ? 'var(--sidebar-active)' : 'transparent',
        borderRight: isActive ? '2px solid var(--gold)' : '2px solid transparent',
        transition: 'background-color 0.15s ease, color 0.15s ease',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--sidebar-hover)'
          e.currentTarget.style.color = 'var(--text-on-dark)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-on-dark-muted)'
        }
      }}
    >
      <Icon size={16} />
      <span>{item.label}</span>
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const closeSidebar = () => setIsOpen(false)

  const sidebarStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: 0,
        right: 0,
        width: '260px',
        height: '100vh',
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 150,
        overflowY: 'auto',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
      }
    : {
        position: 'fixed',
        top: 0,
        right: 0,
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
            right: '12px',
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
            src="/f20-logo.png"
            alt="F20 Event"
            style={{
              height: '90px',
              width: 'auto',
              maxWidth: '180px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={isMobile ? closeSidebar : undefined} />
          ))}

          <div
            style={{
              fontSize: '10px',
              color: 'var(--text-on-dark-muted)',
              padding: '12px 20px 4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            المحتوى
          </div>
          {contentNav.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={isMobile ? closeSidebar : undefined} />
          ))}

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '8px 16px' }} />

          <div
            style={{
              fontSize: '10px',
              color: 'var(--text-on-dark-muted)',
              padding: '8px 20px 4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            الأدوات
          </div>
          {toolsNav.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={isMobile ? closeSidebar : undefined} />
          ))}
        </nav>

        {/* User info */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--navy-mid)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--gold)',
              flexShrink: 0,
            }}
          >
            م ع
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-on-dark)', fontWeight: 500 }}>المستخدم</div>
            <div style={{ fontSize: '11px', color: 'var(--text-on-dark-muted)' }}>موظف</div>
          </div>
        </div>
      </aside>
    </>
  )
}
