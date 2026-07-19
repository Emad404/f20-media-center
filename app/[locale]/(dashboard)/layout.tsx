import Sidebar from '@/components/Sidebar'
import MainWrapper from '@/components/MainWrapper'
import { UserProfileProvider } from '@/lib/context/UserProfileContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProfileProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
        <Sidebar />
        <MainWrapper>
          {children}
        </MainWrapper>
      </div>
    </UserProfileProvider>
  )
}
