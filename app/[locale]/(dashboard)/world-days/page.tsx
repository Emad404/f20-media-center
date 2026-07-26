'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { FileSpreadsheet } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import PersonCardMenu from '@/components/PersonCardMenu'
import SortByDateButton from '@/components/SortByDateButton'
import { createClient } from '@/lib/supabase/client'
import { formatArabicDate, sortSoonestFirst } from '@/lib/dateUtils'
import { useIsMobile } from '@/hooks/useIsMobile'
import { exportToExcel } from '@/lib/exportXlsx'

interface WorldDayRow {
  id: string
  title_ar: string
  title_en: string | null
  description_ar: string | null
  description_en: string | null
  day_date: string
  image_url: string | null
}

type WorldDayForm = {
  title_ar: string
  title_en: string
  description_ar: string
  description_en: string
  day_date: string
  image_url: string
}

const emptyForm: WorldDayForm = {
  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',
  day_date: '',
  image_url: '',
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

export default function WorldDaysPage() {
  const t = useTranslations('WorldDays')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const isMobile = useIsMobile()
  const supabase = createClient()

  const [days, setDays] = useState<WorldDayRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortSoonest, setSortSoonest] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDay, setEditingDay] = useState<WorldDayRow | null>(null)
  const [form, setForm] = useState<WorldDayForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const flashSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const fetchDays = async () => {
    setLoading(true)
    const { data } = await supabase.from('world_days').select('*').order('day_date', { ascending: true })
    setDays(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDays()
  }, [])

  const displayTitle = (d: WorldDayRow) => (locale === 'en' && d.title_en ? d.title_en : d.title_ar)

  const grouped = useMemo(() => {
    const orderedDays = sortSoonest ? sortSoonestFirst(days, (d) => d.day_date) : days
    const map = new Map<string, WorldDayRow[]>()
    for (const day of orderedDays) {
      const key = new Date(day.day_date).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' })
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(day)
    }
    return map
  }, [days, isRtl, sortSoonest])

  const openAddModal = () => {
    setEditingDay(null)
    setForm(emptyForm)
    setSaveError('')
    setIsModalOpen(true)
  }

  const openEditModal = (day: WorldDayRow) => {
    setEditingDay(day)
    setForm({
      title_ar: day.title_ar || '',
      title_en: day.title_en || '',
      description_ar: day.description_ar || '',
      description_en: day.description_en || '',
      day_date: day.day_date || '',
      image_url: day.image_url || '',
    })
    setSaveError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingDay(null)
    setSaveError('')
  }

  const handleSave = async () => {
    if (!form.title_ar.trim()) {
      setSaveError(t('titleArRequiredError'))
      return
    }
    if (!form.day_date) {
      setSaveError(t('dateRequiredError'))
      return
    }

    const payload = {
      title_ar: form.title_ar.trim(),
      title_en: form.title_en.trim() || null,
      description_ar: form.description_ar.trim() || null,
      description_en: form.description_en.trim() || null,
      day_date: form.day_date,
      image_url: form.image_url.trim() || null,
    }

    setSaving(true)
    setSaveError('')

    const { error } = editingDay
      ? await supabase.from('world_days').update(payload).eq('id', editingDay.id)
      : await supabase.from('world_days').insert(payload)

    setSaving(false)
    if (error) {
      setSaveError(error.message)
      return
    }
    closeModal()
    await fetchDays()
    flashSuccess(editingDay ? t('saveSuccess') : t('addSuccess'))
  }

  const handleDelete = async (day: WorldDayRow) => {
    if (!window.confirm(t('deleteConfirm', { title: displayTitle(day) }))) return
    const { error } = await supabase.from('world_days').delete().eq('id', day.id)
    if (error) {
      window.alert(error.message)
      return
    }
    await fetchDays()
    flashSuccess(t('deleteSuccess'))
  }

  const handleExport = () => {
    const rows = days.map((day) => ({
      'Title (Arabic)': day.title_ar,
      'Title (English)': day.title_en || '',
      'Description (Arabic)': day.description_ar || '',
      'Description (English)': day.description_en || '',
      'Date': day.day_date || '',
      'Image URL': day.image_url || '',
    }))
    exportToExcel(rows, 'world-days')
  }

  const addButton = (
    <button
      onClick={openAddModal}
      style={{
        background: 'var(--gold)',
        color: '#fff',
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
  )

  const exportButton = (
    <button
      onClick={handleExport}
      style={{
        background: 'var(--gold)',
        color: '#fff',
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
      <PageHeader title={t('pageTitle')} action={<>{exportButton}{addButton}</>} />

      {/* Controls */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: isMobile ? '12px 16px' : '16px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          direction: isRtl ? 'rtl' : 'ltr',
        }}
      >
        <SortByDateButton active={sortSoonest} onToggle={() => setSortSoonest((v) => !v)} label={t('sortSoonestButton')} />
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
        ) : grouped.size === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>
            {t('noResultsMessage')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {Array.from(grouped.entries()).map(([month, monthDays]) => (
              <div key={month}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--navy)',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '8px',
                    marginBottom: '12px',
                  }}
                >
                  {month}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {monthDays.map((day) => {
                    const dateObj = new Date(day.day_date)
                    const dayNum = dateObj.getDate()
                    return (
                      <div
                        key={day.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                        }}
                      >
                        {/* Date circle */}
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'var(--neutral-bg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            flexShrink: 0,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {dayNum}
                        </div>

                        {/* Title */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {displayTitle(day)}
                          </span>
                        </div>

                        {/* Full date */}
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {formatArabicDate(day.day_date)}
                        </div>

                        <PersonCardMenu
                          isRtl={isRtl}
                          optionsAria={t('optionsAria')}
                          editLabel={t('editAria')}
                          deleteLabel={t('deleteAria')}
                          onEdit={() => openEditModal(day)}
                          onDelete={() => handleDelete(day)}
                        />
                      </div>
                    )
                  })}
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
        title={editingDay ? t('editModalTitle') : t('addModalTitle')}
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
            <label style={labelStyle}>{t('dateLabel')}</label>
            <input type="date" value={form.day_date} onChange={(e) => setForm((f) => ({ ...f, day_date: e.target.value }))} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{t('imageUrlLabel')}</label>
            <input dir="ltr" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} style={inputStyle} />
          </div>

          {saveError && (
            <div style={{ fontSize: '13px', color: 'var(--danger-text)' }}>{saveError}</div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: 'var(--gold)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? t('saving') : editingDay ? t('saveButtonEdit') : t('saveButton')}
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
