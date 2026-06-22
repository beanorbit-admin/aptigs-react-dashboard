import { useCallback } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import AppRouter from './routes/AppRouter'
import useVersionCheck from './hooks/useVersionCheck'

function App() {
  const notifyUpdateAvailable = useCallback(() => {
    toast(
      (t) => (
        <span className="flex items-center gap-3">
          A new version is available.
          <button
            className="font-medium text-blue-600 hover:underline"
            onClick={() => {
              toast.dismiss(t.id)
              window.location.reload()
            }}
          >
            Refresh
          </button>
        </span>
      ),
      { id: 'app-update', duration: Infinity },
    )
  }, [])

  useVersionCheck(notifyUpdateAvailable)

  return (
    <>
      <AppRouter />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </>
  )
}

export default App
