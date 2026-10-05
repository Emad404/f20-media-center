'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronDown, ChevronUp, Globe, MapPin, Search } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import PersonCard from '@/components/PersonCard'
import PersonCardMenu from '@/components/PersonCardMenu'
import { createClient } from '@/lib/supabase/client'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useUserProfile } from '@/lib/context/UserProfileContext'

const ALLOWED_ROLES = ['developer', 'ceo', 'project_manager', 'media_manager']

type ContactType = 'person' | 'company'

const LINK_FIELDS = ['website_url', 'linkedin_url', 'x_url', 'tiktok_url', 'instagram_url'] as const

interface Contact {
  id: string
  added_by: string | null
  contact_type: ContactType
  full_name_ar: string
  full_name_en: string | null
  job_title_ar: string | null
  job_title_en: string | null
  company_ar: string | null
  company_en: string | null
  phone: string | null
  email: string | null
  city_ar: string | null
  city_en: string | null
  website_url: string | null
  linkedin_url: string | null
  x_url: string | null
  tiktok_url: string | null
  instagram_url: string | null
  strong_points: string | null
  weak_points: string | null
  offerings: string | null
  notes: string | null
  created_at: string
}

type ContactForm = {
  contact_type: ContactType
  full_name_ar: string
  full_name_en: string
  job_title_ar: string
  job_title_en: string
  company_ar: string
  company_en: string
  phone: string
  email: string
  city_ar: string
  city_en: string
  website_url: string
  linkedin_url: string
  x_url: string
  tiktok_url: string
  instagram_url: string
  strong_points: string
  weak_points: string
  offerings: string
  notes: string
}

const emptyForm: ContactForm = {
  contact_type: 'person',
  full_name_ar: '',
  full_name_en: '',
  job_title_ar: '',
  job_title_en: '',
  company_ar: '',
  company_en: '',
  phone: '',
  email: '',
  city_ar: '',
  city_en: '',
  website_url: '',
  linkedin_url: '',
  x_url: '',
  tiktok_url: '',
  instagram_url: '',
  strong_points: '',
  weak_points: '',
  offerings: '',
  notes: '',
}

const optional = (v: string) => v.trim() || null

const normalizeUrl = (v: string) => {
  const trimmed = v.trim()
  if (!trimmed) return null
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

const isSafeUrl = (v: string | null): v is string => !!v && /^https?:\/\//i.test(v)

export default function ContactsPage() {
  const t = useTranslations('Contacts')
  const locale = useLocale()
  const isMobile = useIsMobile()
  const supabase = createClient()
  const { profile } = useUserProfile()
  const canManage = !!profile && ALLOWED_ROLES.includes(profile.role)

  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ContactType | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [form, setForm] = useState<ContactForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const isRtl = locale === 'ar'
  const isCompany = form.contact_type === 'company'

  const fetchContacts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
    setContacts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return contacts.filter((c) => {
      if (typeFilter && c.contact_type !== typeFilter) return false
      if (q === '') return true
      return [
        c.full_name_ar,
        c.full_name_en,
        c.company_ar,
        c.company_en,
        c.job_title_ar,
        c.job_title_en,
        c.city_ar,
        c.city_en,
        c.offerings,
      ].some((v) => (v || '').toLowerCase().includes(q))
    })
  }, [contacts, search, typeFilter])

  const openAddModal = () => {
    setEditingContact(null)
    setForm({ ...emptyForm, contact_type: typeFilter ?? 'person' })
    setSaveError('')
    setIsModalOpen(true)
  }

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact)
    setForm({
      contact_type: contact.contact_type === 'company' ? 'company' : 'person',
      full_name_ar: contact.full_name_ar || '',
      full_name_en: contact.full_name_en || '',
      job_title_ar: contact.job_title_ar || '',
      job_title_en: contact.job_title_en || '',
      company_ar: contact.company_ar || '',
      company_en: contact.company_en || '',
      phone: contact.phone || '',
      email: contact.email || '',
      city_ar: contact.city_ar || '',
      city_en: contact.city_en || '',
      website_url: contact.website_url || '',
      linkedin_url: contact.linkedin_url || '',
      x_url: contact.x_url || '',
      tiktok_url: contact.tiktok_url || '',
      instagram_url: contact.instagram_url || '',
      strong_points: contact.strong_points || '',
      weak_points: contact.weak_points || '',
      offerings: contact.offerings || '',
      notes: contact.notes || '',
    })
    setSaveError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingContact(null)
    setSaveError('')
  }

  const handleSave = async () => {
    if (!form.full_name_ar.trim()) {
      setSaveError(isCompany ? t('companyNameRequiredError') : t('fullNameRequiredError'))
      return
    }

    setSaving(true)
    setSaveError('')

    const payload = {
      contact_type: form.contact_type,
      full_name_ar: form.full_name_ar.trim(),
      full_name_en: optional(form.full_name_en),
      job_title_ar: isCompany ? null : optional(form.job_title_ar),
      job_title_en: isCompany ? null : optional(form.job_title_en),
      company_ar: isCompany ? null : optional(form.company_ar),
      company_en: isCompany ? null : optional(form.company_en),
      phone: optional(form.phone),
      email: optional(form.email),
      city_ar: optional(form.city_ar),
      city_en: optional(form.city_en),
      website_url: normalizeUrl(form.website_url),
      linkedin_url: normalizeUrl(form.linkedin_url),
      x_url: normalizeUrl(form.x_url),
      tiktok_url: normalizeUrl(form.tiktok_url),
      instagram_url: normalizeUrl(form.instagram_url),
      strong_points: optional(form.strong_points),
      weak_points: optional(form.weak_points),
      offerings: optional(form.offerings),
      notes: optional(form.notes),
    }

    const { error } = editingContact
      ? await supabase.from('contacts').update(payload).eq('id', editingContact.id)
      : await supabase.from('contacts').insert({ ...payload, added_by: profile?.id })

    setSaving(false)

    if (error) {
      setSaveError(error.message)
      return
    }

    closeModal()
    await fetchContacts()
  }

  const handleDelete = async (contact: Contact) => {
    if (!window.confirm(t('deleteConfirm', { name: contact.full_name_ar }))) return
    const { error } = await supabase.from('contacts').delete().eq('id', contact.id)
    if (error) {
      window.alert(error.message)
      return
    }
    await fetchContacts()
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '6px',
    marginTop: '6px',
  }

  const toggleButtonStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--btn-bg)' : 'transparent',
    color: active ? 'var(--btn-text)' : 'var(--text-secondary)',
    border: active ? '1px solid var(--btn-bg)' : '1px solid var(--border-strong)',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  })

  const setField = (key: keyof ContactForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const linkLabels: Record<(typeof LINK_FIELDS)[number], string> = {
    website_url: t('websiteLabel'),
    linkedin_url: t('linkedinLabel'),
    x_url: t('xLabel'),
    tiktok_url: t('tiktokLabel'),
    instagram_url: t('instagramLabel'),
  }

  const renderTextInput = (key: keyof ContactForm, label: string, dir: 'rtl' | 'ltr', type?: string) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input dir={dir} type={type} value={form[key]} onChange={setField(key)} style={inputStyle} />
    </div>
  )

  const renderTextArea = (key: keyof ContactForm, label: string) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <textarea
        dir="rtl"
        value={form[key]}
        onChange={setField(key)}
        rows={3}
        style={{ ...inputStyle, resize: 'vertical' }}
      />
    </div>
  )

  return (
    <div>
      <PageHeader title={t('pageTitle')} />

      {canManage && (
        <div
          style={{
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            padding: isMobile ? '12px 16px' : '16px 32px',
            display: 'flex',
            justifyContent: 'flex-end',
            direction: locale === 'ar' ? 'rtl' : 'ltr',
          }}
        >
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
              transition: 'background-color 0.15s ease',
            }}
          >
            {t('addButton')}
          </button>
        </div>
      )}

      <div style={{ padding: isMobile ? '16px' : '28px 32px', direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
        {/* Search + type filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', width: isMobile ? '100%' : '280px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                [locale === 'ar' ? 'right' : 'left']: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={locale === 'ar' ? { ...inputStyle, paddingRight: '30px' } : { ...inputStyle, paddingLeft: '30px' }}
            />
          </div>
          {(['person', 'company'] as const).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={typeFilter === type}
              onClick={() => setTypeFilter((cur) => (cur === type ? null : type))}
              style={toggleButtonStyle(typeFilter === type)}
            >
              {type === 'person' ? t('filterPeople') : t('filterCompanies')}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t('loading')}</div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            {t('emptyState')}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {filteredContacts.map((contact) => {
              const rowIsCompany = contact.contact_type === 'company'
              const displayName = locale === 'en' && contact.full_name_en ? contact.full_name_en : contact.full_name_ar
              const displayJobTitle = locale === 'en' && contact.job_title_en ? contact.job_title_en : contact.job_title_ar
              const displayCompany = locale === 'en' && contact.company_en ? contact.company_en : contact.company_ar
              const displayCity = locale === 'en' ? contact.city_en || contact.city_ar : contact.city_ar || contact.city_en
              const safeLinks = LINK_FIELDS.filter((k) => isSafeUrl(contact[k]))
              const detailItems = [
                { label: t('strongPointsLabel'), value: contact.strong_points },
                { label: t('weakPointsLabel'), value: contact.weak_points },
                { label: t('offeringsLabel'), value: contact.offerings },
              ].filter((d) => d.value)
              const expanded = expandedIds.has(contact.id)
              return (
                <PersonCard
                  key={contact.id}
                  name={displayName}
                  jobTitle={rowIsCompany ? null : displayJobTitle}
                  subtitle={rowIsCompany ? null : displayCompany}
                  email={contact.email}
                  phone={contact.phone}
                  isRtl={isRtl}
                  menu={canManage ? (
                    <PersonCardMenu
                      isRtl={isRtl}
                      optionsAria={t('optionsAria')}
                      editLabel={t('editAria')}
                      deleteLabel={t('deleteAria')}
                      onEdit={() => openEditModal(contact)}
                      onDelete={() => handleDelete(contact)}
                    />
                  ) : undefined}
                  extra={
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            background: 'var(--neutral-bg)',
                            borderRadius: '999px',
                            padding: '2px 10px',
                          }}
                        >
                          {rowIsCompany ? t('typeCompany') : t('typePerson')}
                        </span>
                        {displayCity && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={12} style={{ flexShrink: 0 }} /> {displayCity}
                          </span>
                        )}
                      </div>

                      {safeLinks.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                          {safeLinks.map((k) => (
                            <a
                              key={k}
                              href={contact[k] as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                            >
                              {k === 'website_url' && <Globe size={12} style={{ color: 'var(--gold)', flexShrink: 0 }} />}
                              {linkLabels[k]}
                            </a>
                          ))}
                        </div>
                      )}

                      {detailItems.length > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={() => toggleExpanded(contact.id)}
                            aria-expanded={expanded}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: 0,
                              fontSize: '12px',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontFamily: 'inherit',
                            }}
                          >
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {expanded ? t('hideDetails') : t('showDetails')}
                          </button>
                          {expanded && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                              {detailItems.map((d) => (
                                <div key={d.label}>
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{d.label}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>{d.value}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {contact.notes && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          {contact.notes}
                        </div>
                      )}
                    </>
                  }
                />
              )
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingContact ? t('editModalTitle') : t('addModalTitle')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['person', 'company'] as const).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={form.contact_type === type}
                onClick={() => setForm((f) => ({ ...f, contact_type: type }))}
                style={{ ...toggleButtonStyle(form.contact_type === type), flex: 1 }}
              >
                {type === 'person' ? t('typePerson') : t('typeCompany')}
              </button>
            ))}
          </div>

          <div style={sectionTitleStyle}>{t('sectionBasics')}</div>
          <div>
            <label style={labelStyle}>{isCompany ? t('companyNameArLabel') : t('fullNameArLabel')}</label>
            <input
              dir="rtl"
              value={form.full_name_ar}
              onChange={setField('full_name_ar')}
              style={inputStyle}
              required
            />
          </div>
          {renderTextInput('full_name_en', isCompany ? t('companyNameEnLabel') : t('fullNameEnLabel'), 'ltr')}
          {!isCompany && (
            <>
              {renderTextInput('job_title_ar', t('jobTitleArLabel'), 'rtl')}
              {renderTextInput('job_title_en', t('jobTitleEnLabel'), 'ltr')}
              {renderTextInput('company_ar', t('companyArLabel'), 'rtl')}
              {renderTextInput('company_en', t('companyEnLabel'), 'ltr')}
            </>
          )}

          <div style={sectionTitleStyle}>{t('sectionContact')}</div>
          {renderTextInput('phone', t('phoneLabel'), 'ltr')}
          {renderTextInput('email', t('emailLabel'), 'ltr', 'email')}
          {renderTextInput('city_ar', t('cityArLabel'), 'rtl')}
          {renderTextInput('city_en', t('cityEnLabel'), 'ltr')}

          <div style={sectionTitleStyle}>{t('sectionOnline')}</div>
          {LINK_FIELDS.map((k) => (
            <div key={k}>{renderTextInput(k, linkLabels[k], 'ltr')}</div>
          ))}

          <div style={sectionTitleStyle}>{t('sectionAssessment')}</div>
          {renderTextArea('strong_points', t('strongPointsLabel'))}
          {renderTextArea('weak_points', t('weakPointsLabel'))}
          {renderTextArea('offerings', t('offeringsLabel'))}

          <div style={sectionTitleStyle}>{t('sectionNotes')}</div>
          {renderTextArea('notes', t('notesLabel'))}

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
              {saving ? t('saving') : t('saveButton')}
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
