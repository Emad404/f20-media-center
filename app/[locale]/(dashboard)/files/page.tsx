'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Search, Upload, Download, File as FileIcon, FileText, FileImage, FileType as FileTypeIcon } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import Avatar from '@/components/Avatar'
import PersonCardMenu from '@/components/PersonCardMenu'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/lib/context/UserProfileContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import { formatDateTime } from '@/lib/dateUtils'

const BUCKET = 'Dashboard'
const MAX_FILE_SIZE = 20 * 1024 * 1024
const MANAGE_ROLES = ['developer', 'ceo', 'project_manager']
const FILE_TYPES = ['pdf', 'image', 'word', 'other'] as const
const ALL = '__all__'

interface FileRow {
  id: string
  file_url: string
  file_name_ar: string
  file_name_en: string | null
  file_type: string | null
  file_size: number | null
  notes: string | null
  added_by: string
  created_at: string
}

interface ProfileLite {
  id: string
  full_name_ar: string
  full_name_en: string | null
}

type FileForm = {
  file_name_ar: string
  file_name_en: string
  notes: string
}

const emptyForm: FileForm = { file_name_ar: '', file_name_en: '', notes: '' }

function getExtension(name: string): string {
  const match = name.match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1].toLowerCase() : ''
}

function categorizeFile(file: globalThis.File): 'pdf' | 'image' | 'word' | 'other' {
  const mime = file.type || ''
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (mime.startsWith('image/')) return 'image'
  if (mime.includes('word') || ext === 'doc' || ext === 'docx') return 'word'
  return 'other'
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let i = 0
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function fileTypeIconFor(type: string | null) {
  if (type === 'pdf') return FileText
  if (type === 'image') return FileImage
  if (type === 'word') return FileTypeIcon
  return FileIcon
}

function fileTypeColor(type: string | null): string {
  if (type === 'pdf') return 'var(--danger-text)'
  if (type === 'image') return 'var(--riyadh-text)'
  if (type === 'word') return 'var(--info-text)'
  return 'var(--neutral-text)'
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

export default function FilesPage() {
  const t = useTranslations('Files')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const isMobile = useIsMobile()
  const supabase = createClient()
  const { profile } = useUserProfile()

  const [files, setFiles] = useState<FileRow[]>([])
  const [profiles, setProfiles] = useState<ProfileLite[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>(ALL)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFile, setEditingFile] = useState<FileRow | null>(null)
  const [form, setForm] = useState<FileForm>(emptyForm)
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const flashSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const fetchAll = async () => {
    setLoading(true)
    const [filesRes, profilesRes] = await Promise.all([
      supabase.from('files').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,full_name_ar,full_name_en'),
    ])
    setFiles(filesRes.data || [])
    setProfiles(profilesRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const profilesById = useMemo(() => {
    const map = new Map<string, ProfileLite>()
    for (const p of profiles) map.set(p.id, p)
    return map
  }, [profiles])

  const uploaderName = (id: string) => {
    const p = profilesById.get(id)
    if (!p) return ''
    return locale === 'en' && p.full_name_en ? p.full_name_en : p.full_name_ar
  }

  const displayFileName = (f: FileRow) => (locale === 'en' && f.file_name_en ? f.file_name_en : f.file_name_ar)

  const typeLabel = (type: string | null) => {
    if (type === 'pdf') return t('typePdf')
    if (type === 'image') return t('typeImage')
    if (type === 'word') return t('typeWord')
    return t('typeOther')
  }

  const filteredFiles = useMemo(() => {
    const q = search.trim()
    return files
      .filter((f) => typeFilter === ALL || f.file_type === typeFilter)
      .filter((f) => {
        if (!q) return true
        const inAr = (f.file_name_ar || '').includes(q)
        const inEn = (f.file_name_en || '').toLowerCase().includes(q.toLowerCase())
        return inAr || inEn
      })
  }, [files, search, typeFilter])

  const openAddModal = () => {
    setEditingFile(null)
    setForm(emptyForm)
    setSelectedFile(null)
    setSaveError('')
    setIsModalOpen(true)
  }

  const openEditModal = (f: FileRow) => {
    setEditingFile(f)
    setForm({ file_name_ar: f.file_name_ar || '', file_name_en: f.file_name_en || '', notes: f.notes || '' })
    setSelectedFile(null)
    setSaveError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingFile(null)
    setSelectedFile(null)
    setSaveError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setSaveError('')
    if (!file) {
      setSelectedFile(null)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setSaveError(t('fileTooLargeError'))
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setSelectedFile(file)
    if (!form.file_name_ar.trim()) {
      setForm((f) => ({ ...f, file_name_ar: file.name }))
    }
  }

  const handleSave = async () => {
    if (!editingFile && !selectedFile) {
      setSaveError(t('fileRequiredError'))
      return
    }
    if (!form.file_name_ar.trim()) {
      setSaveError(t('fileNameRequiredError'))
      return
    }
    if (!profile) return

    setSaving(true)
    setSaveError('')

    if (editingFile) {
      const { error } = await supabase
        .from('files')
        .update({
          file_name_ar: form.file_name_ar.trim(),
          file_name_en: form.file_name_en.trim() || null,
          notes: form.notes.trim() || null,
        })
        .eq('id', editingFile.id)
      setSaving(false)
      if (error) {
        setSaveError(error.message)
        return
      }
      closeModal()
      await fetchAll()
      flashSuccess(t('saveSuccess'))
      return
    }

    const file = selectedFile!
    // Storage keys must be ASCII/URL-safe — the display name (which may be
    // Arabic or contain spaces/special characters) is kept separately in
    // file_name_ar/file_name_en and never used as the storage key itself.
    const ext = getExtension(file.name)
    const path = `${profile.id}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
    if (uploadError) {
      setSaving(false)
      setSaveError(uploadError.message)
      return
    }

    const { error: insertError } = await supabase.from('files').insert({
      file_url: path,
      file_name_ar: form.file_name_ar.trim(),
      file_name_en: form.file_name_en.trim() || null,
      file_type: categorizeFile(file),
      file_size: file.size,
      notes: form.notes.trim() || null,
      added_by: profile.id,
    })

    setSaving(false)
    if (insertError) {
      await supabase.storage.from(BUCKET).remove([path])
      setSaveError(insertError.message)
      return
    }

    closeModal()
    await fetchAll()
    flashSuccess(t('addSuccess'))
  }

  const handleDelete = async (f: FileRow) => {
    if (!window.confirm(t('deleteConfirm', { name: displayFileName(f) }))) return
    await supabase.storage.from(BUCKET).remove([f.file_url])
    const { error } = await supabase.from('files').delete().eq('id', f.id)
    if (error) {
      window.alert(error.message)
      return
    }
    await fetchAll()
    flashSuccess(t('deleteSuccess'))
  }

  const handleOpen = async (f: FileRow) => {
    setOpeningId(f.id)
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(f.file_url, 60)
    setOpeningId(null)
    if (error || !data) {
      window.alert(t('downloadError'))
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  const handleDownload = async (f: FileRow) => {
    setDownloadingId(f.id)
    const { data, error } = await supabase.storage.from(BUCKET).download(f.file_url)
    setDownloadingId(null)
    if (error || !data) {
      window.alert(t('downloadError'))
      return
    }
    const ext = getExtension(f.file_url)
    const base = displayFileName(f)
    const downloadName = ext && !base.toLowerCase().endsWith(`.${ext}`) ? `${base}.${ext}` : base
    const blobUrl = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = downloadName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(blobUrl)
  }

  const canManageFile = (f: FileRow) => !!profile && (f.added_by === profile.id || MANAGE_ROLES.includes(profile.role))

  return (
    <div>
      <PageHeader title={t('pageTitle')} />

      {/* Add File bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: isMobile ? '12px 16px' : '16px 32px',
          display: 'flex',
          justifyContent: 'flex-end',
          direction: isRtl ? 'rtl' : 'ltr',
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

        {/* Search + type filter */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginBottom: '20px', alignItems: isMobile ? 'stretch' : 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: isMobile ? '100%' : '280px' }}>
            <Search
              size={14}
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
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={isRtl ? { ...inputStyle, paddingRight: '30px' } : { ...inputStyle, paddingLeft: '30px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[ALL, ...FILE_TYPES].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: typeFilter === type ? 'none' : '1px solid var(--border)',
                  background: typeFilter === type ? 'var(--btn-bg)' : 'var(--bg-card)',
                  color: typeFilter === type ? 'var(--btn-text)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {type === ALL ? t('allTypesOption') : typeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t('loading')}</div>
        ) : filteredFiles.length === 0 ? (
          <div style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            {files.length === 0 ? t('emptyState') : t('noResultsMessage')}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredFiles.map((f) => {
              const Icon = fileTypeIconFor(f.file_type)
              const color = fileTypeColor(f.file_type)
              const canManage = canManageFile(f)
              return (
                <div
                  key={f.id}
                  onClick={() => handleOpen(f)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    cursor: 'pointer',
                    opacity: openingId === f.id ? 0.6 : 1,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} style={{ color }} />
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {displayFileName(f)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDownload(f)}
                        disabled={downloadingId === f.id}
                        aria-label={t('downloadAria')}
                        style={{
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          cursor: downloadingId === f.id ? 'not-allowed' : 'pointer',
                          color: 'var(--text-secondary)',
                          opacity: downloadingId === f.id ? 0.6 : 1,
                        }}
                      >
                        <Download size={16} />
                      </button>
                      {canManage && (
                        <PersonCardMenu
                          isRtl={isRtl}
                          optionsAria={t('optionsAria')}
                          editLabel={t('editAria')}
                          deleteLabel={t('deleteAria')}
                          onEdit={() => openEditModal(f)}
                          onDelete={() => handleDelete(f)}
                        />
                      )}
                    </div>
                  </div>

                  {f.file_size != null && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {formatFileSize(f.file_size)}
                    </div>
                  )}

                  {f.notes && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {f.notes}
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <Avatar name={uploaderName(f.added_by) || '?'} size="sm" />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploaderName(f.added_by)}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>{formatDateTime(f.created_at, locale)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add / Edit File Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingFile ? t('editModalTitle') : t('addModalTitle')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', direction: isRtl ? 'rtl' : 'ltr' }}>
          {saveError && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' }}>
              {saveError}
            </div>
          )}

          {!editingFile && (
            <div>
              <label style={labelStyle}>{t('fileLabel')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Upload size={14} />
                  {t('chooseFileButton')}
                </button>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedFile ? selectedFile.name : t('noFileChosen')}
                </span>
              </div>
              <input ref={fileInputRef} type="file" onChange={handleFileSelect} style={{ display: 'none' }} />
            </div>
          )}

          <div>
            <label style={labelStyle}>{t('fileNameArLabel')}</label>
            <input dir="rtl" style={inputStyle} value={form.file_name_ar} onChange={(e) => setForm((f) => ({ ...f, file_name_ar: e.target.value }))} required />
          </div>

          <div>
            <label style={labelStyle}>{t('fileNameEnLabel')}</label>
            <input dir="ltr" style={inputStyle} value={form.file_name_en} onChange={(e) => setForm((f) => ({ ...f, file_name_en: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>{t('notesLabel')}</label>
            <textarea dir="rtl" style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{ background: 'var(--btn-bg)', color: 'var(--btn-text)', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? t('saving') : editingFile ? t('saveButtonEdit') : t('submitButton')}
            </button>
            <button
              type="button"
              onClick={closeModal}
              style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', cursor: 'pointer' }}
            >
              {t('cancelButton')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
