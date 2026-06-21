export interface Exhibition {
id: number
title: string
organizer: string
location: string
city: string
dateStart: string
dateEnd: string
status: 'قادم' | 'جارٍ' | 'تاريخ غير محدد'
description: string
registrationLink: string
category: 'معرض' | 'مؤتمر' | 'ملتقى'
image: string
}

export const exhibitions: Exhibition[] = [
{
id: 1,
title: 'LEAP 2026',
organizer: 'وزارة الاتصالات وتقنية المعلومات',
location: 'مركز الرياض للمعارض والمؤتمرات',
city: 'الرياض',
dateStart: '2026-08-31',
dateEnd: '2026-09-03',
status: 'قادم',
description: 'أحد أكبر المؤتمرات التقنية في العالم ويجمع قادة التقنية والابتكار.',
registrationLink: 'https://onegiantleap.com',
category: 'مؤتمر',
image: 'https://prolines.sa/wp-content/uploads/2026/03/leap-2026-riyadh-saudi-arabia-date.png'
},
{
id: 2,
title: 'معرض الدفاع العالمي 2026',
organizer: 'الهيئة العامة للصناعات العسكرية',
location: 'معرض الدفاع العالمي',
city: 'الرياض',
dateStart: '2026-02-08',
dateEnd: '2026-02-12',
status: 'تاريخ غير محدد',
description: 'معرض عالمي للصناعات الدفاعية والأمنية.',
registrationLink: 'https://www.worlddefenseshow.com',
category: 'معرض',
image: 'https://www.worlddefenseshow.com/_next/static/media/Logo-Colored-ar.9367fd28.png'
},
{
id: 3,
title: 'Cityscape Global 2026',
organizer: 'Informa',
location: 'مركز الرياض للمعارض والمؤتمرات',
city: 'الرياض',
dateStart: '2026-11-16',
dateEnd: '2026-11-19',
status: 'قادم',
description: 'أكبر معرض واستثمار عقاري في الشرق الأوسط.',
registrationLink: 'https://cityscapeglobal.com',
category: 'معرض',
image: 'https://assets.sharikatmubasher.com/news/21440503.png'
},
{
id: 4,
title: 'Future Investment Initiative - مبادرة الاستثمار المستقبلي',
organizer: 'FII Institute',
location: 'مركز الملك عبدالعزيز الدولي للمؤتمرات',
city: 'الرياض',
dateStart: '',
dateEnd: '',
status: 'تاريخ غير محدد',
description: 'مؤتمر استثماري عالمي يجمع المستثمرين وقادة الأعمال وصناع القرار.',
registrationLink: 'https://fii-institute.org',
category: 'مؤتمر',
image: 'https://saudipedia.com/var/site/storage/images/4/9/6/9/5229694-1-ara-SA/6ea05c15d91f-64776.jpg'
},
{
id: 5,
title: 'Human Capability Initiative - مبادرة القدرات البشرية',
organizer: 'برنامج تنمية القدرات البشرية',
location: 'الرياض',
city: 'الرياض',
dateStart: '',
dateEnd: '',
status: 'تاريخ غير محدد',
description: 'مؤتمر عالمي يركز على مستقبل التعليم وتنمية القدرات البشرية.',
registrationLink: 'https://humancapabilityinitiative.org',
category: 'مؤتمر',
image: 'https://mma.prnewswire.com/media/2352410/Human_Capability_Initiative_Logo.jpg?p=facebook'
},
{
id: 6,
title: 'Black Hat MEA',
organizer: 'Tahaluf',
location: 'مركز الرياض للمعارض والمؤتمرات',
city: 'الرياض',
dateStart: '2026-12-1',
dateEnd: '2026-12-3',
status: 'قادم',
description: 'أكبر فعالية للأمن السيبراني في الشرق الأوسط وأفريقيا.',
registrationLink: 'https://blackhatmea.com',
category: 'مؤتمر',
image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSezdfMzw5tApCWBEFNpc1Wot_BbcAUAHWDNQ&s'
},
{
  id: 7,
  title: 'معرض الصحة العالمي',
  organizer: 'Tahaluf',
  location: 'مركز الرياض للمعارض والمؤتمرات',
  city: 'الرياض',
  dateStart: '2026-10-26',
  dateEnd: '2026-10-29',
  status: 'قادم',
  description: 'معرض ومؤتمر عالمي للرعاية الصحية والتقنيات الطبية.',
  registrationLink: 'https://www.globalhealthexhibition.com',
  category: 'معرض',
  image: 'https://www.constructionweekonline.com/cloud/2025/10/24/Screenshot-74.png'
}
,
{
id: 8,
title: 'مؤتمر ومعرض الحج',
organizer: 'وزارة الحج والعمرة',
location: 'جدة سوبر دوم',
city: 'جدة',
dateStart: '',
dateEnd: '',
status: 'تاريخ غير محدد',
description: 'مؤتمر ومعرض دولي متخصص في خدمات الحج والعمرة.',
registrationLink: 'https://hajjconfex.com/',
category: 'مؤتمر',
image: 'https://upload.wikimedia.org/wikipedia/ar/2/25/%D8%A5%D9%83%D8%B3%D8%A8%D9%88_%D8%A7%D9%84%D8%AD%D8%AC.png'
},
{
id: 9,
title: 'المؤتمر السعودي البحري واللوجستي',
organizer: 'Informa Markets',
location: 'قبة جدة سوبر دوم',
city: 'جدة',
dateStart: '2026-10-21',
dateEnd: '2026-10-22',
status: 'قادم',
description: 'أهم مؤتمر ومعرض للقطاع البحري والخدمات اللوجستية في المملكة.',
registrationLink: 'https://www.saudimaritimecongress.com',
category: 'مؤتمر',
image: 'https://knect365.imgix.net/uploads/SMLC-logo-RGB-3f26c424dfcd8d1dd140c196aacd128b.png?auto=format&fit=max&h=80&dpr=5'
},
{
id: 10,
title: 'منتدى ومعرض إكتفا',
organizer: 'أرامكو السعودية',
location: 'الظهران إكسبو',
city: 'الشرقية',
dateStart: '',
dateEnd: '',
status: 'تاريخ غير محدد',
description: 'منتدى ومعرض اكتفاء لدعم المحتوى المحلي وسلاسل الإمداد الصناعية.',
registrationLink: 'https://iktva.sa/',
category: 'معرض',
image: 'https://naizak.com/wp-content/uploads/2022/02/Advanced-Electronics-Company-AEC-Participates-in-IKTVA-2022-Forum-Exhibition-1.jpg'
}
]
