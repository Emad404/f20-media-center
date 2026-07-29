'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Search, SearchX, CalendarDays, Mail, Phone, FileSpreadsheet } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import Modal from '@/components/Modal'
import PersonCardMenu from '@/components/PersonCardMenu'
import SortByDateButton from '@/components/SortByDateButton'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/lib/context/UserProfileContext'
import { formatDateRange, sortSoonestFirst } from '@/lib/dateUtils'
import { useIsMobile } from '@/hooks/useIsMobile'
import { exportToExcel } from '@/lib/exportXlsx'

const ALL = '__all__'
const MANAGE_ROLES = ['developer', 'ceo', 'project_manager', 'PR_manager', 'media_manager']
const CITY_VALUES = ['الرياض', 'الشرقية', 'جدة'] as const
const STATUS_VALUES = ['upcoming', 'ongoing', 'tbd'] as const
const cityOrder: Record<string, number> = { 'الرياض': 0, 'الشرقية': 1, 'جدة': 2 }

interface EventRow {
  id: string
  title_ar: string
  title_en: string | null
  description_ar: string | null
  description_en: string | null
  city: string | null
  location_ar: string | null
  location_en: string | null
  start_date: string | null
  end_date: string | null
  status: string | null
  image_url: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  created_at: string
}

type EventForm = {
  title_ar: string
  title_en: string
  description_ar: string
  description_en: string
  city: string
  customCity: string
  location_ar: string
  location_en: string
  start_date: string
  end_date: string
  status: string
  image_url: string
  contact_name: string
  contact_phone: string
  contact_email: string
}

const emptyForm: EventForm = {
  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',
  city: 'الرياض',
  customCity: '',
  location_ar: '',
  location_en: '',
  start_date: '',
  end_date: '',
  status: 'upcoming',
  image_url: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
}

function cityVariant(city: string | null): 'riyadh' | 'eastern' | 'jeddah' | 'neutral' {
  if (city === 'الرياض') return 'riyadh'
  if (city === 'الشرقية') return 'eastern'
  if (city === 'جدة') return 'jeddah'
  return 'neutral'
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  color: 'var(--text-primary)',
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
}

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--text-secondary)',
  marginBottom: '6px',
  display: 'block',
}

export default function EventsPage() {
  const t = useTranslations('Events')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const isMobile = useIsMobile()
  const supabase = createClient()
  const { profile } = useUserProfile()
  const canManage = !!profile && MANAGE_ROLES.includes(profile.role)

  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState(ALL)
  const [sortSoonest, setSortSoonest] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null)
  const [form, setForm] = useState<EventForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const flashSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const fetchEvents = async () => {
    setLoading(true)
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false })
    setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const displayTitle = (e: EventRow) => (locale === 'en' && e.title_en ? e.title_en : e.title_ar)
  const displayDescription = (e: EventRow) => ((locale === 'en' && e.description_en ? e.description_en : e.description_ar) || '')
  const displayLocation = (e: EventRow) => ((locale === 'en' && e.location_en ? e.location_en : e.location_ar) || '')

  const statusLabel = (status: string | null) => {
    if (status === 'upcoming') return t('statusUpcoming')
    if (status === 'ongoing') return t('statusOngoing')
    if (status === 'tbd') return t('statusTbd')
    return status || ''
  }

  const cities = [ALL, ...CITY_VALUES]

  const filtered = useMemo(() => {
    const result = events
      .filter((e) => cityFilter === ALL || e.city === cityFilter)
      .filter((e) => {
        if (search === '') return true
        return displayTitle(e).includes(search) || displayDescription(e).includes(search)
      })

    if (sortSoonest) {
      return sortSoonestFirst(result, (e) => e.start_date)
    }

    return result.sort((a, b) => {
      const cd = (cityOrder[a.city || ''] ?? 3) - (cityOrder[b.city || ''] ?? 3)
      if (cd !== 0) return cd
      if (!a.start_date && !b.start_date) return 0
      if (!a.start_date) return 1
      if (!b.start_date) return -1
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, search, cityFilter, sortSoonest, locale])

  const openAddModal = () => {
    setEditingEvent(null)
    setForm(emptyForm)
    setSaveError('')
    setIsModalOpen(true)
  }

  const openEditModal = (ev: EventRow) => {
    setEditingEvent(ev)
    const isFixedCity = (CITY_VALUES as readonly string[]).includes(ev.city || '')
    setForm({
      title_ar: ev.title_ar || '',
      title_en: ev.title_en || '',
      description_ar: ev.description_ar || '',
      description_en: ev.description_en || '',
      city: ev.city ? (isFixedCity ? ev.city : 'custom') : 'الرياض',
      customCity: ev.city && !isFixedCity ? ev.city : '',
      location_ar: ev.location_ar || '',
      location_en: ev.location_en || '',
      start_date: ev.start_date || '',
      end_date: ev.end_date || '',
      status: ev.status || 'upcoming',
      image_url: ev.image_url || '',
      contact_name: ev.contact_name || '',
      contact_phone: ev.contact_phone || '',
      contact_email: ev.contact_email || '',
    })
    setSaveError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingEvent(null)
    setSaveError('')
  }

  const handleSave = async () => {
    if (!form.title_ar.trim()) {
      setSaveError(t('titleArRequiredError'))
      return
    }

    const resolvedCity = form.city === 'custom' ? form.customCity.trim() : form.city

    const payload = {
      title_ar: form.title_ar.trim(),
      title_en: form.title_en.trim() || null,
      description_ar: form.description_ar.trim() || null,
      description_en: form.description_en.trim() || null,
      city: resolvedCity || null,
      location_ar: form.location_ar.trim() || null,
      location_en: form.location_en.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
      image_url: form.image_url.trim() || null,
      contact_name: form.contact_name.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      contact_email: form.contact_email.trim() || null,
    }

    setSaving(true)
    setSaveError('')

    const { error } = editingEvent
      ? await supabase.from('events').update(payload).eq('id', editingEvent.id)
      : await supabase.from('events').insert(payload)

    setSaving(false)
    if (error) {
      setSaveError(error.message)
      return
    }
    closeModal()
    await fetchEvents()
    flashSuccess(editingEvent ? t('saveSuccess') : t('addSuccess'))
  }

  const handleDelete = async (ev: EventRow) => {
    if (!window.confirm(t('deleteConfirm', { title: displayTitle(ev) }))) return
    const { error } = await supabase.from('events').delete().eq('id', ev.id)
    if (error) {
      window.alert(error.message)
      return
    }
    await fetchEvents()
    flashSuccess(t('deleteSuccess'))
  }

  const handleExport = () => {
    const rows = filtered.map((e) => ({
      'Title (Arabic)': e.title_ar,
      'Title (English)': e.title_en || '',
      'Description (Arabic)': e.description_ar || '',
      'Description (English)': e.description_en || '',
      'City': e.city || '',
      'Location (Arabic)': e.location_ar || '',
      'Location (English)': e.location_en || '',
      'Start Date': e.start_date || '',
      'End Date': e.end_date || '',
      'Status': e.status || '',
      'Image URL': e.image_url || '',
      'Contact Name': e.contact_name || '',
      'Contact Phone': e.contact_phone || '',
      'Contact Email': e.contact_email || '',
    }))
    exportToExcel(rows, 'kingdom-events')
  }

  const addButton = canManage ? (
    <button
      onClick={openAddModal}
      style={{
        background: 'var(--btn-bg)',
        color: 'var(--btn-text)',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {t('addButton')}
    </button>
  ) : null

  const exportButton = (
    <button
      onClick={handleExport}
      style={{
        background: 'var(--btn-bg)',
        color: 'var(--btn-text)',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <FileSpreadsheet size={15} />
      {t('exportButton')}
    </button>
  )

  return (
    <div>
      <PageHeader title={t('pageTitle')} />

      {/* Controls */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: isMobile ? '12px 16px' : '16px 32px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: '10px',
          flexWrap: 'wrap',
          direction: isRtl ? 'rtl' : 'ltr',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', width: '100%', flex: isMobile ? undefined : '1 1 220px', maxWidth: isMobile ? undefined : '320px' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              [isRtl ? 'right' : 'left']: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={isRtl ? { ...inputStyle, paddingRight: '32px' } : { ...inputStyle, paddingLeft: '32px' }}
          />
        </div>

        {/* City label + tabs */}
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t('cityLabel')}</span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setCityFilter(city)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                background: cityFilter === city ? 'var(--btn-bg)' : 'transparent',
                borderColor: cityFilter === city ? 'var(--btn-bg)' : 'var(--border-strong)',
                color: cityFilter === city ? 'var(--btn-text)' : 'var(--text-secondary)',
                transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease',
              }}
            >
              {city === ALL ? t('allOption') : city}
            </button>
          ))}
        </div>

        {/* Sort by date */}
        <SortByDateButton active={sortSoonest} onToggle={() => setSortSoonest((v) => !v)} label={t('sortSoonestButton')} />

        {!isMobile && (
          <div style={{ marginInlineStart: 'auto', display: 'flex', gap: '10px' }}>
            {addButton}
            {exportButton}
          </div>
        )}
        {isMobile && (
          <div style={{ display: 'flex', gap: '10px' }}>
            {addButton}
            {exportButton}
          </div>
        )}
      </div>

      <div style={{ padding: isMobile ? '16px' : '28px 32px', direction: isRtl ? 'rtl' : 'ltr' }}>
        {successMessage && (
          <div style={{
            marginBottom: '16px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--success-bg)',
            color: 'var(--success-text)',
            fontSize: '13px',
          }}>
            {successMessage}
          </div>
        )}

        {loading ? (
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t('loading')}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)' }}>
            <SearchX size={36} style={{ margin: '0 auto 12px', opacity: 0.4, display: 'block' }} />
            <p style={{ fontSize: '14px' }}>{events.length === 0 ? t('emptyState') : t('noResultsMessage')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
            {filtered.map((event) => (
              <div
                key={event.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                {/* Image */}
                <div style={{
                  width: '100%',
                  height: '200px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  position: 'relative',
                  backgroundColor: '#F0F0F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={displayTitle(event)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'center',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      background: 'var(--neutral-bg)',
                    }}>
                      {t('noImageText')}
                    </div>
                  )}
                  {event.status === 'ongoing' && (
                    <span style={{
                      position: 'absolute', top: 10, left: 10,
                      background: '#16a34a', color: '#fff',
                      fontSize: '11px', fontWeight: 600,
                      padding: '3px 10px', borderRadius: '20px',
                      display: 'flex', alignItems: 'center', gap: 5
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                      {t('statusOngoing')}
                    </span>
                  )}
                  {event.status === 'tbd' && (
                    <span style={{
                      position: 'absolute', top: 10, left: 10,
                      background: 'rgba(0,0,0,0.6)', color: '#fff',
                      fontSize: '11px', fontWeight: 500,
                      padding: '3px 10px', borderRadius: '20px',
                    }}>
                      {t('statusTbd')}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {event.city && <Badge text={event.city} variant={cityVariant(event.city)} />}
                    </div>
                    {canManage && (
                      <PersonCardMenu
                        isRtl={isRtl}
                        optionsAria={t('optionsAria')}
                        editLabel={t('editAria')}
                        deleteLabel={t('deleteAria')}
                        onEdit={() => openEditModal(event)}
                        onDelete={() => handleDelete(event)}
                      />
                    )}
                  </div>

                  <h3 style={{
                    fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)',
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4,
                  }}>
                    {displayTitle(event)}
                  </h3>

                  {event.status === 'upcoming' && event.start_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: 'var(--text-muted)' }}>
                      <CalendarDays size={13} />
                      <span>{formatDateRange(event.start_date, event.end_date || event.start_date)}</span>
                    </div>
                  )}

                  {displayLocation(event) && (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{displayLocation(event)}</div>
                  )}

                  {displayDescription(event) && (
                    <p style={{
                      fontSize: '13px', color: 'var(--text-secondary)',
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5, flex: 1,
                    }}>
                      {displayDescription(event)}
                    </p>
                  )}

                  {(event.contact_email || event.contact_phone) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      {event.contact_name && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{event.contact_name}</span>
                      )}
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {event.contact_email && (
                          <a href={`mailto:${event.contact_email}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: 'var(--gold-dark)', textDecoration: 'none' }}>
                            <Mail size={12} /> {event.contact_email}
                          </a>
                        )}
                        {event.contact_phone && (
                          <a href={`tel:${event.contact_phone}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', color: 'var(--gold-dark)', textDecoration: 'none' }}>
                            <Phone size={12} /> {event.contact_phone}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEvent ? t('editModalTitle') : t('addModalTitle')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>{t('titleArLabel')}</label>
            <input dir="rtl" value={form.title_ar} onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))} style={inputStyle} required />
          </div>

          <div>
            <label style={labelStyle}>{t('titleEnLabel')}</label>
            <input dir="ltr" value={form.title_en} onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('descriptionArLabel')}</label>
            <textarea dir="rtl" value={form.description_ar} onChange={(e) => setForm((f) => ({ ...f, description_ar: e.target.value }))} style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} />
          </div>

          <div>
            <label style={labelStyle}>{t('descriptionEnLabel')}</label>
            <textarea dir="ltr" value={form.description_en} onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))} style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} />
          </div>

          <div>
            <label style={labelStyle}>{t('cityFieldLabel')}</label>
            <select value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              {CITY_VALUES.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="custom">{t('cityCustomOption')}</option>
            </select>
          </div>

          {form.city === 'custom' && (
            <div>
              <label style={labelStyle}>{t('customCityLabel')}</label>
              <input dir={isRtl ? 'rtl' : 'ltr'} value={form.customCity} onChange={(e) => setForm((f) => ({ ...f, customCity: e.target.value }))} style={inputStyle} />
            </div>
          )}

          <div>
            <label style={labelStyle}>{t('locationArLabel')}</label>
            <input dir="rtl" value={form.location_ar} onChange={(e) => setForm((f) => ({ ...f, location_ar: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('locationEnLabel')}</label>
            <input dir="ltr" value={form.location_en} onChange={(e) => setForm((f) => ({ ...f, location_en: e.target.value }))} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('startDateLabel')}</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t('endDateLabel')}</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>{t('statusFieldLabel')}</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              {STATUS_VALUES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>{t('imageUrlLabel')}</label>
            <input dir="ltr" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('contactNameLabel')}</label>
            <input dir={isRtl ? 'rtl' : 'ltr'} value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('contactPhoneLabel')}</label>
            <input dir="ltr" value={form.contact_phone} onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('contactEmailLabel')}</label>
            <input dir="ltr" type="email" value={form.contact_email} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} style={inputStyle} />
          </div>

          {saveError && (
            <div style={{ fontSize: '13px', color: 'var(--danger-text)' }}>{saveError}</div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: 'var(--btn-bg)',
                color: 'var(--btn-text)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? t('saving') : editingEvent ? t('saveButtonEdit') : t('saveButton')}
            </button>
            <button
              onClick={closeModal}
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-strong)',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {t('cancelButton')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
