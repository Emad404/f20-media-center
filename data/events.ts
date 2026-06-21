export interface KSAEvent {
id: number
title: string
city: 'الرياض' | 'الشرقية' | 'جدة'
category: string
dateStart: string
dateEnd: string
status: 'قادم' | 'جارٍ' | 'تاريخ غير محدد'
description: string
link: string
image: string
}

export const kSAEvents: KSAEvent[] = [
{
id: 1,
title: 'موسم الرياض',
city: 'الرياض',
category: 'ترفيه',
dateStart: '2026-10-01',
dateEnd: '2027-03-01',
status: 'قادم',
description: 'أكبر موسم ترفيهي في المملكة يضم الحفلات والعروض والفعاليات العالمية.',
link: 'https://riyadhseason.com',
image: 'https://api.riyadh.sa/sites/default/files/2025-10/Page_Cover_1920_x_1280_compressed%20%281%29.jpg'
},
{
id: 2,
title: 'موسم الدرعية',
city: 'الرياض',
category: 'ثقافة وترفيه',
dateStart: '2026-12-01',
dateEnd: '2027-02-28',
status: 'قادم',
description: 'فعاليات ثقافية ورياضية وترفيهية في الدرعية التاريخية.',
link: 'https://diriyahseason.sa',
image: 'https://images.cmscloud.ai/d56e1636-11c2-4a8b-8195-2256d8cea670/10dd8be0-9ff1-4624-938a-185e5040686e/5ppI2wy3BiGvL6kFfIsP1c/79046fed-7e3f-444b-be8e-cfc984866e76/WBK_Layali_Al-Diriyah_Adaptations-01_compressed-(1).jpg'
},
{
id: 3,
title: 'نور الرياض',
city: 'الرياض',
category: 'فنون',
dateStart: '2026-11-28',
dateEnd: '2026-12-14',
status: 'قادم',
description: 'أحد أكبر مهرجانات فنون الضوء في العالم.',
link: 'https://riyadhart.rcrc.gov.sa/en/noor-riyadh/',
image: 'https://www.rcrc.gov.sa/wp-content/uploads/2024/09/GXmCFKgX0AApxB3-scaled-1.jpg'
},
{
id: 4,
title: 'معرض الرياض الدولي للكتاب',
city: 'الرياض',
category: 'ثقافة',
dateStart: '',
dateEnd: '',
status: 'تاريخ غير محدد',
description: 'معرض سنوي يجمع دور النشر والمؤلفين من مختلف أنحاء العالم.',
link: 'https://lpt.moc.gov.sa/',
image: 'https://www.shorouknews.com/uploadedimages/Other/original/938017b6-f43a-4e49-90b2-ff7fd538fcf8.jpg'
},
{
  id: 5,
  title: 'كأس السعودية',
  city: 'الرياض',
  category: 'رياضة',
  dateStart: '',
  dateEnd: '',
  status: 'تاريخ غير محدد',
  description: 'أغلى سباق خيل في العالم ويستقطب نخبة الملاك والفرسان من مختلف الدول.',
  link: 'https://thesaudicup.com.sa',
  image: 'https://wbk-assets-backup.s3.eu-west-1.amazonaws.com/public/uploads/events/the-world-awaits-saudi-cup-weekend-2026-ar-1741095613-poster.jpeg'
},
{
 id: 6,
title: 'كأس العالم للرياضات الإلكترونية',
city: 'الرياض',
category: 'رياضات إلكترونية',
dateStart: '',
dateEnd: '',
status: 'تاريخ غير محدد',
description: 'أكبر حدث عالمي للرياضات الإلكترونية والألعاب الرقمية بمشاركة نخبة الفرق العالمية.',
link: 'https://esportsworldcup.com',
  image: 'https://ar.timeoutriyadh.com/cloud/artimeoutriyadh/2023/07/17/gamers-season-3-1024x768.jpg'
},
{

id: 7,
title: 'مهرجان البحر الأحمر السينمائي',
city: 'جدة',
category: 'سينما',
dateStart: '',
dateEnd: '',
status: 'تاريخ غير محدد',
description: 'مهرجان سينمائي دولي يستضيف صناع الأفلام والنجوم من مختلف دول العالم.',
link: 'https://redseafilmfest.com',
image: 'https://news50.sa/wp-content/uploads/2026/05/9532959.jpg'
},
{
id: 8,
title: 'موسم جدة',
city: 'جدة',
category: 'ترفيه',
dateStart: '',
dateEnd: '',
status: 'تاريخ غير محدد',
description: 'فعاليات ترفيهية وسياحية متنوعة على امتداد مدينة جدة.',
link: 'https://webook.com/ar/season/jeddah-calendar-2025?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAdGRleASk1mRleHRuA2FlbQIxMQBzcnRjBmFwcF9pZA8xMjQwMjQ1NzQyODc0MTQAAae5NuJvqC-SXxudxDRS5fJJ86MuAs13affJ_Jp2Bq6lhtdE3O_DJ3hgcBUXGA_aem_YWdncwBsGkqc7g83Pp2wjsuzNNiG&brid=YWdncwGu0QODw1me5_BhH_QphHBO',
image: 'https://alrayah.sa/mobile/uploadimages/2025/07/1-1-1.jpg'
},
{
id: 9,
title: 'فعاليات مركز إثراء',
city: 'الشرقية',
category: 'ثقافة',
dateStart: '2026-01-01',
dateEnd: '2026-12-31',
status: 'قادم',
description: 'سلسلة فعاليات ثقافية وفنية ومعرفية تقام على مدار العام في مركز الملك عبدالعزيز الثقافي العالمي.',
link: 'https://www.ithra.com',
image: 'https://www.ithra.com/application/files/cache/thumbnails/6ed2768de9916a7f3f6d40e5e9f3d877.jpg'
},
{
id: 10,
title: 'مهرجان أفلام السعودية',
city: 'الشرقية',
category: 'سينما',
dateStart: '',
dateEnd: '',
status: 'تاريخ غير محدد',
description: 'أكبر منصة وطنية لدعم وعرض الأفلام السعودية وصناعة السينما المحلية.',
link: 'https://www.saudifilmfestival.org/',
image: 'https://www.ithra.com/application/files/cache/thumbnails/47923b2bf3c2ee491f1c1fab5f257113.png'
}
]
