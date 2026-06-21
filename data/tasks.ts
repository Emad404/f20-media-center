export type TaskType = 'meeting' | 'event' | 'deadline' | 'task'

export interface Task {
  id: number
  title: string
  description: string
  assignedTo: string
  assignedEmail: string
  date: string
  time: string
  type: TaskType
  location?: string
}

export const tasks: Task[] = [
  { id: 1, title: 'اجتماع التخطيط الأسبوعي', description: 'مراجعة مهام الأسبوع وتوزيع المسؤوليات على الفريق', assignedTo: 'الفريق بأكمله', assignedEmail: 'team@f20event.com', date: '2026-07-06', time: '10:00-09:00', type: 'meeting', location: 'مكتب F20' },
  { id: 2, title: 'تحضيرات حفل التخرج', description: 'مراجعة الترتيبات اللوجستية والتأكد من جاهزية المعدات لحفل تخرج جامعة الملك سعود', assignedTo: 'لينا المطيري', assignedEmail: 'lina.mutairi@f20event.com', date: '2026-06-26', time: '12:00-10:00', type: 'task' },
  { id: 3, title: 'حفل تخرج جامعة الملك سعود', description: 'تنفيذ حفل التخرج الرسمي بمركز الملك فيصل الدولي', assignedTo: 'الفريق بأكمله', assignedEmail: 'team@f20event.com', date: '2026-06-28', time: '21:00-16:00',  type: 'event', location: 'مركز الملك فيصل الدولي للمؤتمرات' },
  { id: 4, title: 'اجتماع عميل مؤتمر التسويق', description: 'لقاء تنسيقي نهائي مع شركة إعلام الرياض قبل المؤتمر', assignedTo: 'لينا المطيري', assignedEmail: 'lina.mutairi@f20event.com', date: '2026-07-01', time: '12:30-11:00', type: 'meeting' },
  { id: 5, title: 'موعد تسليم المواد التصميمية', description: 'تسليم جميع التصاميم المطلوبة لمؤتمر التسويق الرقمي', assignedTo: 'منى الدوسري', assignedEmail: 'mona.dosari@f20event.com', date: '2026-07-10', time: '15:00-14:00', type: 'deadline' },
  { id: 6, title: 'تصوير حملة سوشال ميديا', description: 'جلسة تصوير للمحتوى الشهري لجميع حسابات التواصل الاجتماعي', assignedTo: 'وليد الرشيدي', assignedEmail: 'waleed.rashidi@f20event.com', date: '2026-07-08', time: '16:00-13:00',  type: 'task' },
  { id: 7, title: 'مؤتمر التسويق الرقمي — اليوم الأول', description: 'تنفيذ اليوم الأول من مؤتمر التسويق الرقمي بفندق هيلتون', assignedTo: 'لينا المطيري', assignedEmail: 'lina.mutairi@f20event.com', date: '2026-07-15', time: '16:00-08:00',  type: 'event', location: 'فندق هيلتون الرياض' },
  { id: 8, title: 'مؤتمر التسويق الرقمي — اليوم الثاني', description: 'تنفيذ اليوم الثاني واختتام المؤتمر', assignedTo: 'لينا المطيري', assignedEmail: 'lina.mutairi@f20event.com', date: '2026-07-16', time: '16:00-08:00',  type: 'event', location: 'فندق هيلتون الرياض' },
  { id: 9, title: 'اجتماع تقييم الربع الثالث', description: 'مراجعة أداء الشركة خلال Q3 ووضع خطة Q4', assignedTo: 'سلطان الحارثي', assignedEmail: 'sultan.harthy@f20event.com', date: '2026-07-20', time: '12:00-10:00',  type: 'meeting', location: 'مكتب F20' },
  { id: 10, title: 'إرسال عروض الأسعار للعملاء', description: 'متابعة وإرسال عروض الأسعار لثلاثة عملاء محتملين', assignedTo: 'فهد العمري', assignedEmail: 'fahad.omari@f20event.com', date: '2026-07-03', time: '10:00-09:00',  type: 'deadline' },
  { id: 11, title: 'جلسة تدريب الفريق', description: 'تدريب عملي على أدوات Microsoft 365 للفريق بأكمله', assignedTo: 'الفريق بأكمله', assignedEmail: 'team@f20event.com', date: '2026-07-22', time: '13:00-10:00',  type: 'meeting', location: 'مكتب F20' },
  { id: 12, title: 'متابعة مشاريع أغسطس', description: 'مراجعة جاهزية الفريق لأحداث أغسطس', assignedTo: 'لينا المطيري', assignedEmail: 'lina.mutairi@f20event.com', date: '2026-07-28', time: '15:00-14:00',  type: 'task' },
]
