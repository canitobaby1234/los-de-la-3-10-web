'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaHome, FaCalendarAlt, FaPiggyBank, FaSignOutAlt, FaUser, FaBars, FaTimes, FaUsers } from 'react-icons/fa'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, miembro, loading, signOut, isAdmin } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full animate-pulse mb-4 mx-auto"></div>
          <p className="text-amber-700">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user || !miembro) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: FaHome },
    { name: 'Eventos', href: '/admin/eventos', icon: FaCalendarAlt },
    { name: 'Ahorro', href: '/admin/ahorro', icon: FaPiggyBank },
  ]

  // Solo agregar Usuarios si es admin
  if (isAdmin) {
    navigation.push({ name: 'Usuarios', href: '/admin/usuarios', icon: FaUsers })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-amber-200"
        >
          {sidebarOpen ? <FaTimes className="text-amber-600" /> : <FaBars className="text-amber-600" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/90 backdrop-blur-sm shadow-xl border-r border-blue-200/50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-blue-200/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">3-10</span>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-slate-700 to-blue-800 bg-clip-text text-transparent">
                  Los de la 3-10
                </h1>
                <p className="text-xs text-slate-600">Panel Admin</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-blue-100/50 rounded-lg transition-colors group"
              >
                <item.icon className="text-blue-600 group-hover:text-blue-700" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-blue-200/50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                <FaUser className="text-white text-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{miembro.nombre}</p>
                <p className="text-xs text-slate-600 capitalize">{miembro.rol}</p>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FaSignOutAlt />
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50">
          {miembro.estado !== 'activo' && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <p className="text-sm">
                <span className="font-semibold">Acceso limitado:</span> Tu cuenta está pendiente de activación por un administrador.
              </p>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}