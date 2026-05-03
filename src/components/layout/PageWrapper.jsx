import Sidebar from './Sidebar'
import Header from './Header'

export default function PageWrapper({ title, children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col">
        <Header title={title} />
        <main className="flex-1 mt-16 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
