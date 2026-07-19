'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Mail, Phone, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import Modal from '@/components/Modal'
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

const CARD_COLORS = ['var(--gold)', '#4F46E5', 'var(--navy-mid)', '#0891B2', '#7C3AED', 'var(--border-strong)']

function cardColor(index: number): string {
  return CARD_COLORS[index % CARD_COLORS.length]
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

  const [hoveredId, setHoveredId] = useState<string | null>(null)

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
      setSaveError('الاسم الكامل (عربي) مطلوب')
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
    if (!window.confirm(`هل تريد حذف "${contact.full_name_ar}"؟`)) return
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
      <PageHeader
        title="جهات الاتصال"
        action={
          canManage ? (
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
                transition: 'background-color 0.15s ease',
              }}
            >
              + إضافة جهة اتصال
            </button>
          ) : undefined
        }
      />

      <div style={{ padding: isMobile ? '16px' : '28px 32px' }}>
        {/* Search */}
        <div style={{ marginBottom: '20px', position: 'relative', width: isMobile ? '100%' : '280px' }}>
          <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            placeholder="بحث بالاسم أو الشركة أو المسمى..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingRight: '30px' }}
          />
        </div>

        {loading ? (
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>جارٍ التحميل...</div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            لا توجد جهات اتصال بعد
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
            {filteredContacts.map((contact, index) => (
              <div
                key={contact.id}
                onMouseEnter={() => setHoveredId(contact.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  position: 'relative',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {/* Top color strip */}
                <div style={{ height: '6px', background: cardColor(index) }} />

                {canManage && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '14px',
                      left: '12px',
                      display: 'flex',
                      gap: '4px',
                      opacity: hoveredId === contact.id ? 1 : 0.35,
                      transition: 'opacity 0.15s ease',
                    }}
                  >
                    <button
                      onClick={() => openEditModal(contact)}
                      aria-label="تعديل"
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '5px',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(contact)}
                      aria-label="حذف"
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '5px',
                        cursor: 'pointer',
                        color: 'var(--danger-text)',
                        display: 'flex',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}

                {/* Photo + info */}
                <div style={{ padding: '20px 20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <img
                    src="/employee_placeholder.png"
                    alt={contact.full_name_ar}
                    style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)', marginBottom: 12 }}
                  />
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {contact.full_name_ar}
                  </div>
                  {contact.job_title_ar && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {contact.job_title_ar}
                    </div>
                  )}
                  {contact.company_ar && (
                    <div style={{ marginTop: 8 }}>
                      <Badge text={contact.company_ar} variant="neutral" />
                    </div>
                  )}
                </div>

                {/* Contact info */}
                <div style={{ borderTop: '1px solid var(--border)', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} style={{ fontSize: '12px', color: 'var(--gold-dark)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                      <Mail size={12} /> {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={12} /> {contact.phone}
                    </span>
                  )}
                  {contact.notes && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', paddingRight: 18 }}>
                      {contact.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingContact ? 'تعديل جهة الاتصال' : 'إضافة جهة اتصال جديدة'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>الاسم الكامل (عربي)</label>
            <input
              dir="rtl"
              value={form.full_name_ar}
              onChange={(e) => setForm((f) => ({ ...f, full_name_ar: e.target.value }))}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Full Name (English)</label>
            <input
              dir="ltr"
              value={form.full_name_en}
              onChange={(e) => setForm((f) => ({ ...f, full_name_en: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>المسمى الوظيفي (عربي)</label>
            <input
              dir="rtl"
              value={form.job_title_ar}
              onChange={(e) => setForm((f) => ({ ...f, job_title_ar: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Job Title (English)</label>
            <input
              dir="ltr"
              value={form.job_title_en}
              onChange={(e) => setForm((f) => ({ ...f, job_title_en: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>الشركة (عربي)</label>
            <input
              dir="rtl"
              value={form.company_ar}
              onChange={(e) => setForm((f) => ({ ...f, company_ar: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Company (English)</label>
            <input
              dir="ltr"
              value={form.company_en}
              onChange={(e) => setForm((f) => ({ ...f, company_en: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>رقم الهاتف</label>
            <input
              dir="ltr"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>البريد الإلكتروني</label>
            <input
              dir="ltr"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>ملاحظات</label>
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
              {saving ? 'جارٍ الحفظ...' : 'حفظ'}
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
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
