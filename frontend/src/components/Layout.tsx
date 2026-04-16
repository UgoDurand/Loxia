import Header from '@/components/Header'
import PageTransition from '@/components/PageTransition'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PageTransition>
        <main>{children}</main>
      </PageTransition>
    </div>
  )
}

export default Layout
