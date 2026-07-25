export interface SocialAccount {
  id: number
  name_ar: string
  name_en: string
  handle: string
  url: string
  type: 'twitter' | 'instagram' | 'tiktok' | 'snapchat' | 'whatsapp' | 'email' | 'website'
  description: string
}

export const socialAccounts: SocialAccount[] = [
  { id: 1, name_ar: 'X (تويتر)', name_en: 'X (Twitter)', handle: '@f20_event', url: 'https://x.com/f20_event', type: 'twitter', description: 'تابعونا للاطلاع على آخر أخبار F20 والفعاليات القادمة' },
  { id: 2, name_ar: 'إنستغرام', name_en: 'Instagram', handle: '@f20_event', url: 'https://www.instagram.com/f20_event', type: 'instagram', description: 'صور وقصص حصرية من كواليس فعالياتنا' },
  { id: 3, name_ar: 'تيك توك', name_en: 'TikTok', handle: '@f20_event', url: 'https://www.tiktok.com/@f20_event', type: 'tiktok', description: 'محتوى مرئي قصير وأبرز لحظات فعالياتنا' },
  { id: 4, name_ar: 'سناب شات', name_en: 'Snapchat', handle: '@f20_event', url: 'https://www.snapchat.com/@f20_event', type: 'snapchat', description: 'تغطيات حية وقصص من خلف الكواليس' },
  { id: 5, name_ar: 'واتساب', name_en: 'WhatsApp', handle: '+966 550 461 669', url: 'https://api.whatsapp.com/send/?phone=966550461669', type: 'whatsapp', description: 'تواصل معنا مباشرة لاستفساراتكم وطلباتكم' },
  { id: 6, name_ar: 'البريد الإلكتروني', name_en: 'Email', handle: 'info@f20event.com', url: 'mailto:info@f20event.com', type: 'email', description: 'راسلونا لأي استفسار أو طلب خدمة' },
  { id: 7, name_ar: 'الموقع الرسمي', name_en: 'Official Website', handle: 'f20event.com', url: 'https://f20event.com', type: 'website', description: 'تصفح موقعنا الرسمي واستعرض خدماتنا' },
]
