export interface Course {
  id: number
  title: string
  description: string
  provider: string
  link: string
  category: string
  duration: string
  addedBy: string
  dateAdded: string
  isRequired: boolean
}

export const courses: Course[] = [
  { id: 1, title: 'أساسيات أدوات Microsoft 365', description: 'دورة شاملة في استخدام Word وExcel وPowerPoint وTeams للعمل الاحترافي اليومي', provider: 'Microsoft Learn', link: 'https://learn.microsoft.com', category: 'تقنية', duration: '8 ساعات', addedBy: 'المدير التنفيذي', dateAdded: '2026-05-01', isRequired: true },
  { id: 2, title: 'مهارات التصوير الاحترافي للفعاليات', description: 'تعلم أساسيات وأسرار التصوير الاحترافي في الفعاليات والمناسبات الكبيرة', provider: 'Udemy', link: 'https://udemy.com', category: 'إبداع', duration: '12 ساعة', addedBy: 'المدير التنفيذي', dateAdded: '2026-05-05', isRequired: false },
  { id: 3, title: 'إدارة الفعاليات الاحترافية', description: 'دورة متكاملة في التخطيط وإدارة الفعاليات من الألف إلى الياء وفق معايير دولية', provider: 'Coursera', link: 'https://coursera.org', category: 'إدارة', duration: '20 ساعة', addedBy: 'المدير التنفيذي', dateAdded: '2026-04-20', isRequired: true },
  { id: 4, title: 'التسويق الرقمي عبر السوشال ميديا', description: 'استراتيجيات التسويق الرقمي على منصات إنستغرام وتيك توك وتويتر وسناب شات', provider: 'HubSpot Academy', link: 'https://academy.hubspot.com', category: 'تسويق', duration: '6 ساعات', addedBy: 'المدير التنفيذي', dateAdded: '2026-04-15', isRequired: false },
  { id: 5, title: 'مهارات التواصل والعرض التقديمي', description: 'تحسين مهارات التواصل اللفظي وتقديم العروض بثقة واحترافية أمام الجمهور', provider: 'LinkedIn Learning', link: 'https://linkedin.com/learning', category: 'مهارات', duration: '5 ساعات', addedBy: 'المدير التنفيذي', dateAdded: '2026-03-28', isRequired: false },
  { id: 6, title: 'تصميم الجرافيك باستخدام Canva', description: 'إتقان تصميم البوستات والمواد البصرية والإعلانية الاحترافية باستخدام Canva', provider: 'Canva Design School', link: 'https://designschool.canva.com', category: 'تصميم', duration: '4 ساعات', addedBy: 'المدير التنفيذي', dateAdded: '2026-03-10', isRequired: false },
  { id: 7, title: 'إدارة الوقت والإنتاجية', description: 'تقنيات وأدوات إدارة الوقت وتحسين الإنتاجية الشخصية والمهنية في بيئة العمل', provider: 'FutureLearn', link: 'https://futurelearn.com', category: 'مهارات', duration: '3 ساعات', addedBy: 'المدير التنفيذي', dateAdded: '2026-02-20', isRequired: false },
]
