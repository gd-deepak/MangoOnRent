import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Gallery from './pages/Gallery'
import Trees from './pages/Trees'
import Contact from './pages/Contact'
import Booking from './pages/Booking'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// Pages where Navbar/Footer should be hidden (they have their own full layout)
const BARE_ROUTES = ['/login', '/dashboard', '/admin']

function Layout() {
  const { pathname } = useLocation()
  const bare = BARE_ROUTES.some((r) => pathname.startsWith(r))

  return (
    <div className="flex flex-col min-h-screen">
      {!bare && <Navbar />}
      {bare && <Navbar minimal />}
      <main className="flex-1">
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/about"     element={<About />} />
          <Route path="/gallery"   element={<Gallery />} />
          <Route path="/trees"     element={<Trees />} />
          <Route path="/contact"   element={<Contact />} />
          <Route path="/booking"   element={<Booking />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin"     element={<Admin />} />
        </Routes>
      </main>
      {!bare && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  )
}
