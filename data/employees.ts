export interface Employee {
  id: number
  name: string
  role: string
  department: string
  email: string
  phone: string
  managerId: number | null
  level: 1 | 2 | 3
}

export const employees: Employee[] = [
  { id: 1, name: 'سلطان الحارثي', role: 'المدير التنفيذي', department: 'الإدارة العليا', email: 'sultan.harthy@f20event.com', phone: '+966 55 046 1669', managerId: null, level: 1 },
  { id: 2, name: 'فهد العمري', role: 'نائب المدير', department: 'الإدارة العليا', email: 'fahad.omari@f20event.com', phone: '+966 55 000 0002', managerId: 1, level: 2 },
  { id: 3, name: 'لينا المطيري', role: 'مديرة المشاريع', department: 'المشاريع', email: 'lina.mutairi@f20event.com', phone: '+966 55 000 0003', managerId: 1, level: 2 },
  { id: 4, name: 'خالد الشهري', role: 'مدير التسويق', department: 'التسويق', email: 'khalid.shehri@f20event.com', phone: '+966 55 000 0004', managerId: 1, level: 2 },
  { id: 5, name: 'نوف القحطاني', role: 'مديرة العمليات', department: 'العمليات', email: 'nouf.qahtani@f20event.com', phone: '+966 55 000 0005', managerId: 1, level: 2 },
  { id: 6, name: 'دانا السلمي', role: 'منسّقة فعاليات', department: 'المشاريع', email: 'dana.salmi@f20event.com', phone: '+966 55 000 0006', managerId: 3, level: 3 },
  { id: 7, name: 'ريم البقمي', role: 'منسّقة فعاليات', department: 'المشاريع', email: 'reem.baqami@f20event.com', phone: '+966 55 000 0007', managerId: 3, level: 3 },
  { id: 8, name: 'هند العتيبي', role: 'منسّقة إعلام', department: 'الإعلام', email: 'hind.otaibi@f20event.com', phone: '+966 55 000 0008', managerId: 2, level: 3 },
  { id: 9, name: 'وليد الرشيدي', role: 'مصوّر احترافي', department: 'الإعلام', email: 'waleed.rashidi@f20event.com', phone: '+966 55 000 0009', managerId: 2, level: 3 },
  { id: 10, name: 'منى الدوسري', role: 'مصمّمة جرافيك', department: 'التسويق', email: 'mona.dosari@f20event.com', phone: '+966 55 000 0010', managerId: 4, level: 3 },
  { id: 11, name: 'عمر الغامدي', role: 'منسّق لوجستي', department: 'العمليات', email: 'omar.ghamdi@f20event.com', phone: '+966 55 000 0011', managerId: 5, level: 3 },
  { id: 12, name: 'أسماء الزهراني', role: 'مساعدة إدارية', department: 'العمليات', email: 'asmaa.zahrani@f20event.com', phone: '+966 55 000 0012', managerId: 5, level: 3 },
]
