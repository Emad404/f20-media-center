import Sidebar from '@/components/Sidebar'
import MainWrapper from '@/components/MainWrapper'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Sidebar />
      <MainWrapper>
        {children}
      </MainWrapper>
    </div>
  )
}
