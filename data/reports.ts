export interface PerformanceReport {
  id: number
  employeeName: string
  eventName: string
  location: string
  date: string
  generalGoal: string
  achievedGoals: string
  attendanceData: string
  programRating: number
  programQuality: number
  adherence: 'مطابق للخطة' | 'تعديل طفيف' | 'تغيير كبير'
  positives: string
  challenges: string
  recommendations: string
  notes: string
}

export const reports: PerformanceReport[] = [
  { id: 1, employeeName: 'لينا', eventName: 'مبادرة جمعية سند', location: 'مستشفى الملك خالد الجامعي', date: '2026-04-18', generalGoal: 'رفع معنويات الأطفال وتعزيز الأمل لديهم', achievedGoals: 'تقديم هدايا وتنفيذ فعاليات وفقرات ترفيهية لإسعاد الأطفال', attendanceData: '21 طفل', programRating: 5, programQuality: 10, adherence: 'مطابق للخطة', positives: 'دعم التواصل الإيجابي مع الأطفال وأسرهم، إدخال الفرح والسعادة على الأطفال', challenges: 'إجراءات الدخول والتنظيم داخل المستشفى', recommendations: 'تحسين التواصل والتخطيط المسبق لضمان انسيابية الزيارة وجودتها', notes: '' },
  { id: 2, employeeName: 'ريم', eventName: 'مبادرة جمعية سند', location: 'مستشفى الملك خالد الجامعي', date: '2026-03-31', generalGoal: 'دعم الأطفال نفسياً ومعنوياً من خلال إدخال الفرح والسرور', achievedGoals: 'توزيع هدايا، مشاركة الأطفال في الأنشطة الترفيهية، تعزيز روح العمل الجماعي', attendanceData: '21 طفل', programRating: 5, programQuality: 10, adherence: 'مطابق للخطة', positives: 'تعزيز الدعم النفسي والمعنوي للمرضى وأسرهم', challenges: '', recommendations: 'التنسيق المسبق لتوضيح المكان بشكل أدق، توفير شخص من الجمعية لاستقبال الفريق', notes: '' },
  { id: 3, employeeName: 'هند', eventName: 'مبادرة جمعية سند', location: 'مستشفى الملك خالد الجامعي', date: '2026-04-18', generalGoal: 'تعزيز الدعم النفسي والاجتماعي للأطفال من خلال زيارة إنسانية', achievedGoals: 'التفاعل مع الأطفال من خلال تقديم الهدايا والأنشطة الترفيهية', attendanceData: '21 طفل', programRating: 5, programQuality: 10, adherence: 'مطابق للخطة', positives: 'تعاون فريق العمل كان واضحاً وفاعلاً، التفاعل مع الأطفال أسهم في رفع معنوياتهم', challenges: '', recommendations: 'التخطيط المسبق لعدد الهدايا، التنويع في الأنشطة لتناسب مختلف الأعمار', notes: '' },
  { id: 4, employeeName: 'لينا', eventName: 'تنظيم افتتاح OLBA', location: 'Olba Bakehouse & Cafe', date: '2026-04-10', generalGoal: 'إنجاح حفل الافتتاح من خلال تنظيم متكامل يعزز حضوره ويجذب العملاء', achievedGoals: 'إظهار حفل الافتتاح منظماً وجاذباً ودعم نجاح الافتتاح وتحقيق انتشار أولي', attendanceData: '34 شخص', programRating: 4, programQuality: 8, adherence: 'تعديل طفيف', positives: 'خلق انطباع أولي إيجابي لدى الزوار', challenges: 'تغييرات مفاجئة أثناء التنفيذ، الحاجة للتعامل السريع مع ملاحظات ميدانية', recommendations: 'توثيق الملاحظات بعد الحدث للاستفادة منها مستقبلاً', notes: '' },
]
