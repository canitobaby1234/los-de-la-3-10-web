'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: ''
  })
  
  const { signIn, resetPassword, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/admin')
    }
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    
    if (error) {
      setError('Credenciales incorrectas')
    } else {
      router.push('/admin')
    }
    
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (registerData.password !== registerData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            nombre: registerData.nombre
          }
        }
      })

      if (error) {
        setError(error.message)
      } else {
        setResetMessage('Te has registrado exitosamente. Tu cuenta está pendiente de activación.')
        setShowRegister(false)
        setRegisterData({ email: '', password: '', confirmPassword: '', nombre: '' })
      }
    } catch (error: any) {
      setError('Error al registrar usuario')
    }
    
    setLoading(false)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResetMessage('')

    const { error } = await resetPassword(resetEmail)
    
    if (error) {
      setError('Error al enviar email de recuperación')
    } else {
      setResetMessage('Se envió un email para restablecer tu contraseña')
      setShowResetPassword(false)
      setResetEmail('')
    }
    
    setLoading(false)
  }

  // Formulario de registro
  if (showRegister) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent"></div>
        
        <div className="relative flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-blue-200/50 p-8">
              {/* Logo */}
              <div className="text-center mb-8">
                <div className="inline-block p-4 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full shadow-lg mb-4">
                  <div className="w-16 h-16 relative">
                    <Image
                      src="/logo.png"
                      alt="Los de la 3-10"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-blue-800 bg-clip-text text-transparent">
                  Los de la 3-10
                </h1>
                <p className="text-slate-600 mt-2">Registro de nuevo miembro</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre completo
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    value={registerData.nombre}
                    onChange={(e) => setRegisterData({...registerData, nombre: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all"
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="registerEmail" className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    id="registerEmail"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all"
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="registerPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Contraseña
                  </label>
                  <input
                    id="registerPassword"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                    className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-700 hover:to-slate-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 border-2 border-amber-400/20"
                >
                  {loading ? 'Registrando...' : 'Registrarse'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="w-full text-slate-600 hover:text-slate-800 font-medium py-2 transition-colors"
                >
                  Ya tengo cuenta - Iniciar sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Formulario de reset password
  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent"></div>
        
        <div className="relative flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-blue-200/50 p-8">
              {/* Logo */}
              <div className="text-center mb-8">
                <div className="inline-block p-4 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full shadow-lg mb-4">
                  <div className="w-16 h-16 relative">
                    <Image
                      src="/logo.png"
                      alt="Los de la 3-10"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-blue-800 bg-clip-text text-transparent">
                  Los de la 3-10
                </h1>
                <p className="text-slate-600 mt-2">Recuperar contraseña</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all"
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {resetMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                    {resetMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-700 hover:to-slate-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border-2 border-amber-400/20"
                >
                  {loading ? 'Enviando...' : 'Enviar email de recuperación'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowResetPassword(false)}
                  className="w-full text-slate-600 hover:text-slate-800 font-medium py-2 transition-colors"
                >
                  Volver al login
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Formulario de login principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent"></div>
      
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-blue-200/50 p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full shadow-lg mb-4">
                <div className="w-16 h-16 relative">
                  <Image
                    src="/logo.png"
                    alt="Los de la 3-10"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-blue-800 bg-clip-text text-transparent">
                Los de la 3-10
              </h1>
              <p className="text-slate-600 mt-2">Panel Administrativo</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {resetMessage && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                  {resetMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-700 hover:to-slate-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 border-2 border-amber-400/20"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>

              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-slate-600 hover:text-slate-800 font-medium py-2 transition-colors text-sm"
                >
                  ¿Olvidaste tu contraseña?
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className="text-slate-600 hover:text-slate-800 font-medium py-2 transition-colors text-sm"
                >
                  ¿No tienes cuenta? Regístrate
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-blue-200">
              <p className="text-center text-sm text-slate-600">
                Sistema administrativo para gestión de eventos y finanzas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

