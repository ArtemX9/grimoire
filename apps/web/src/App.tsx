import { Routes, Route, Navigate } from 'react-router-dom'

import Layout from '@/shared/components/Layout/Layout'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute/ProtectedRoute'
import { Toaster } from '@/shared/components/ui/toaster'
import { AuthPage } from '@/pages/AuthPage'
import { LibraryPage } from '@/pages/LibraryPage'
import { GameDetailPage } from '@/pages/GameDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'

export default function App() {
  return (
    <>
      <Routes>
        <Route path='/auth' element={<AuthPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path='/' element={<Navigate to='/library' replace />} />
            <Route path='/library' element={<LibraryPage />} />
            <Route path='/games/:id' element={<GameDetailPage />} />
            <Route path='/settings' element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}
