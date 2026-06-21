export interface HilalMatch {
  id: number
  homeTeam: string
  awayTeam: string
  league: string
  date: string
  venue: string
}

export interface LeaderboardEntry {
  rank: number
  employeeName: string
  correctPredictions: number
  totalPredictions: number
}

export const hilalMatches: HilalMatch[] = [
  { id: 1, homeTeam: 'الهلال', awayTeam: 'النصر', league: 'دوري روشن السعودي للمحترفين', date: '2026-07-05', venue: 'ملعب الأمير فيصل بن فهد' },
  { id: 2, homeTeam: 'الاتحاد', awayTeam: 'الهلال', league: 'دوري روشن السعودي للمحترفين', date: '2026-07-12', venue: 'ملعب مدينة الأمير عبدالله الفيصل' },
  { id: 3, homeTeam: 'الهلال', awayTeam: 'الأهلي', league: 'دوري روشن السعودي للمحترفين', date: '2026-07-19', venue: 'ملعب الأمير فيصل بن فهد' },
  { id: 4, homeTeam: 'الشباب', awayTeam: 'الهلال', league: 'كأس الملك', date: '2026-08-03', venue: 'ملعب الأمير فيصل بن فهد - حي النزهة' },
  { id: 5, homeTeam: 'الهلال', awayTeam: 'الرياض', league: 'دوري روشن السعودي للمحترفين', date: '2026-08-10', venue: 'ملعب الأمير فيصل بن فهد' },
]

export const leaderboard: LeaderboardEntry[] = [
  { rank: 1, employeeName: 'لينا المطيري', correctPredictions: 3, totalPredictions: 7 },
  { rank: 2, employeeName: 'هند العتيبي', correctPredictions: 2, totalPredictions: 5 },
  { rank: 3, employeeName: 'ريم البقمي', correctPredictions: 2, totalPredictions: 4 },
  { rank: 4, employeeName: 'وليد الرشيدي', correctPredictions: 1, totalPredictions: 3 },
  { rank: 5, employeeName: 'دانا السلمي', correctPredictions: 0, totalPredictions: 2 },
]
