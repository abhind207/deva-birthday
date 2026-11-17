import { lazy, Suspense, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { MusicControl, MusicProvider } from './components/Music'
import { track } from './lib/api'
import Welcome from './pages/Welcome'
import Questions from './pages/Questions'
import Proposal from './pages/Proposal'
import Letter from './pages/Letter'
import Reply from './pages/Reply'

// The admin console is a separate bundle with its own design; the public site never loads it.
const Admin = lazy(() => import('./admin/AdminApp'))

function PublicSite() {
  const location = useLocation()
  useEffect(() => { void track('page_view', location.pathname) }, [location.pathname])
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Welcome />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/proposal" element={<Proposal />} />
          <Route path="/letter" element={<Letter />} />
          <Route path="/reply" element={<Reply />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      <MusicControl />
    </>
  )
}

export default function App() {
  const { pathname } = useLocation()
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-ink" />}>
        <Admin />
      </Suspense>
    )
  }
  return (
    <MusicProvider>
      <PublicSite />
    </MusicProvider>
  )
}
