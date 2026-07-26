'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Search } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import PersonCard from '@/components/PersonCard'
import PersonCardMenu from '@/components/PersonCardMenu'
import { createClient } from '@/lib/supabase/client'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useUserProfile } from '@/lib/context/UserProfileContext'

const ALLOWED_ROLES = ['developer', 'ceo', 'project_manager', 'media_manager']

interface Contact {
  id: string
  added_by: string | null
  full_name_ar: string
  full_name_en: string | null
  job_title_ar: string | null
  job_title_en: string | null
  company_ar: string | null
  company_en: string | null
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
}

type ContactForm = {
  full_name_ar: string
  full_name_en: string
  job_title_ar: string
  job_title_en: string
  company_ar: string
  company_en: string
  phone: string
  email: string
  notes: string
}

const emptyForm: ContactForm = {
  full_name_ar: '',
  full_name_en: '',
  job_title_ar: '',
  job_title_en: '',
  company_ar: '',
  company_en: '',
  phone: '',
  email: '',
  notes: '',
}

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

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [form, setForm] = useState<ContactForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const isRtl = locale === 'ar'

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
    if (search === '') return contacts
    return contacts.filter(
      (c) =>
        (c.full_name_ar || '').includes(search) ||
        (c.company_ar || '').includes(search) ||
        (c.job_title_ar || '').includes(search)
    )
  }, [contacts, search])

  const openAddModal = () => {
    setEditingContact(null)
    setForm(emptyForm)
    setSaveError('')
    setIsModalOpen(true)
  }

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact)
    setForm({
      full_name_ar: contact.full_name_ar || '',
      full_name_en: contact.full_name_en || '',
      job_title_ar: contact.job_title_ar || '',
      job_title_en: contact.job_title_en || '',
      company_ar: contact.company_ar || '',
      company_en: contact.company_en || '',
      phone: contact.phone || '',
      email: contact.email || '',
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
      setSaveError(t('fullNameRequiredError'))
      return
    }

    setSaving(true)
    setSaveError('')

    const payload = {
      full_name_ar: form.full_name_ar,
      full_name_en: form.full_name_en || null,
      job_title_ar: form.job_title_ar || null,
      job_title_en: form.job_title_en || null,
      company_ar: form.company_ar || null,
      company_en: form.company_en || null,
      phone: form.phone || null,
      email: form.email || null,
      notes: form.notes || null,
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
        {/* Search */}
        <div style={{ marginBottom: '20px', position: 'relative', width: isMobile ? '100%' : '280px' }}>
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

        {loading ? (
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t('loading')}</div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            {t('emptyState')}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {filteredContacts.map((contact) => {
              const displayName = locale === 'en' && contact.full_name_en ? contact.full_name_en : contact.full_name_ar
              const displayJobTitle = locale === 'en' && contact.job_title_en ? contact.job_title_en : contact.job_title_ar
              const displayCompany = locale === 'en' && contact.company_en ? contact.company_en : contact.company_ar
              return (
                <PersonCard
                  key={contact.id}
                  name={displayName}
                  jobTitle={displayJobTitle}
                  subtitle={displayCompany}
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
                  extra={contact.notes ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {contact.notes}
                    </div>
                  ) : undefined}
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
          <div>
            <label style={labelStyle}>{t('fullNameArLabel')}</label>
            <input
              dir="rtl"
              value={form.full_name_ar}
              onChange={(e) => setForm((f) => ({ ...f, full_name_ar: e.target.value }))}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>{t('fullNameEnLabel')}</label>
            <input
              dir="ltr"
              value={form.full_name_en}
              onChange={(e) => setForm((f) => ({ ...f, full_name_en: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('jobTitleArLabel')}</label>
            <input
              dir="rtl"
              value={form.job_title_ar}
              onChange={(e) => setForm((f) => ({ ...f, job_title_ar: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('jobTitleEnLabel')}</label>
            <input
              dir="ltr"
              value={form.job_title_en}
              onChange={(e) => setForm((f) => ({ ...f, job_title_en: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('companyArLabel')}</label>
            <input
              dir="rtl"
              value={form.company_ar}
              onChange={(e) => setForm((f) => ({ ...f, company_ar: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('companyEnLabel')}</label>
            <input
              dir="ltr"
              value={form.company_en}
              onChange={(e) => setForm((f) => ({ ...f, company_en: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('phoneLabel')}</label>
            <input
              dir="ltr"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('emailLabel')}</label>
            <input
              dir="ltr"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('notesLabel')}</label>
            <textarea
              dir="rtl"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
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
