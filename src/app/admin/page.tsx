'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FaCalendarAlt, FaPiggyBank, FaDollarSign, FaChartLine, FaClock, FaCheckCircle, FaUsers, FaPlus } from 'react-icons/fa'
import Link from 'next/link'

interface DashboardStats {
  totalEventos: number
  eventosPendientes: number
  eventosCompletados: number
  totalIngresos: number
  saldoAhorro: number
  proximoEvento: any
}

export default function AdminDashboard() {
  const { miembro, isAdmin } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalEventos: 0,
    eventosPendientes: 0,
    eventosCompletados: 0,
    totalIngresos: 0,
    saldoAhorro: 0,
    proximoEvento: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (miembro?.estado === 'activo') {
      loadDashboardData()
    } else {
      setLoading(false)
    }
  }, [miembro])

  const loadDashboardData = async () => {
    try {
      // Estadísticas de eventos
      const { data: eventos } = await supabase
        .from('eventos')
        .select('*')

      // Balance de eventos
      const { data: balances } = await supabase
        .from('v_evento_balance')
        .select('*')

      // Saldo de ahorro
      const { data: ahorros } = await supabase
        .from('ahorro_ledger')
        .select('*')

      // Próximo evento
      const { data: proximoEvento } = await supabase
        .from('eventos')
        .select('*')
        .gte('fecha', new Date().toISOString().split('T')[0])
        .order('fecha', { ascending: true })
        .limit(1)

      if (eventos) {
        const totalIngresos = balances?.reduce((sum, balance) => sum + (balance.neto_evento || 0), 0) || 0
        const saldoAhorro = ahorros?.reduce((sum, ahorro) => {
          return sum + (ahorro.tipo === 'aporte' ? ahorro.monto : ahorro.tipo === 'retiro' ? -ahorro.monto : ahorro.monto)
        }, 0) || 0

        setStats({
          totalEventos: eventos.length,
          eventosPendientes: eventos.filter(e => e.estado === 'tentativo' || e.estado === 'confirmado').length,
          eventosCompletados: eventos.filter(e => e.estado === 'completado').length,
          totalIngresos,
          saldoAhorro,
          proximoEvento: proximoEvento?.[0] || null
        })
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-amber-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-amber-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Si el usuario no está activo, mostrar mensaje
  if (miembro?.estado !== 'activo') {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaClock className="text-3xl text-white" />
        </div>
        <h1 className="text-3xl font-bold text-amber-800 mb-4">
          Cuenta Pendiente
        </h1>
        <p className="text-lg text-amber-700 mb-8 max-w-md mx-auto">
          Tu cuenta está pendiente de activación. Un administrador debe aprobar tu acceso para comenzar a usar el sistema.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-sm mx-auto">
          <p className="text-sm text-amber-700">
            <span className="font-semibold">Estado:</span> {miembro?.estado}
          </p>
          <p className="text-sm text-amber-700">
            <span className="font-semibold">Rol:</span> {miembro?.rol}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          ¡Hola, {miembro?.nombre}! 👋
        </h1>
        <p className="text-amber-100 text-lg">
          Bienvenido al panel administrativo de Los de la 3-10
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm font-medium uppercase tracking-wide">Total Eventos</p>
              <p className="text-3xl font-bold text-amber-800">{stats.totalEventos}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
              <FaCalendarAlt className="text-white text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium uppercase tracking-wide">Pendientes</p>
              <p className="text-3xl font-bold text-orange-800">{stats.eventosPendientes}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
              <FaClock className="text-white text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium uppercase tracking-wide">Completados</p>
              <p className="text-3xl font-bold text-green-800">{stats.eventosCompletados}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
              <FaCheckCircle className="text-white text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium uppercase tracking-wide">Ingresos Totales</p>
              <p className="text-3xl font-bold text-blue-800">{formatCurrency(stats.totalIngresos)}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
              <FaDollarSign className="text-white text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium uppercase tracking-wide">Saldo Ahorro</p>
              <p className="text-3xl font-bold text-purple-800">{formatCurrency(stats.saldoAhorro)}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
              <FaPiggyBank className="text-white text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm font-medium uppercase tracking-wide">Promedio por Evento</p>
              <p className="text-3xl font-bold text-amber-800">
                {stats.eventosCompletados > 0 ? formatCurrency(stats.totalIngresos / stats.eventosCompletados) : formatCurrency(0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
              <FaChartLine className="text-white text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Próximo Evento */}
      {stats.proximoEvento && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-blue-800 mb-4">📅 Próximo Evento</h2>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-blue-900">{stats.proximoEvento.lugar}</p>
            <p className="text-blue-700">{formatDate(stats.proximoEvento.fecha)}</p>
            <p className="text-blue-600">Cliente: {stats.proximoEvento.cliente || 'No especificado'}</p>
            <p className="text-blue-600">Total: {formatCurrency(stats.proximoEvento.total)}</p>
            <p className="text-blue-600">Anticipo: {formatCurrency(stats.proximoEvento.anticipo_recibido)}</p>
            <div className="pt-2">
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                stats.proximoEvento.estado === 'confirmado' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {stats.proximoEvento.estado === 'confirmado' ? '✅ Confirmado' : '⏳ Tentativo'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/eventos"
          className="bg-gradient-to-br from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center space-x-4">
            <FaCalendarAlt className="text-2xl" />
            <div>
              <h3 className="font-bold text-lg">Ver Eventos</h3>
              <p className="text-amber-100">Gestionar eventos y finanzas</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/ahorro"
          className="bg-gradient-to-br from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center space-x-4">
            <FaPiggyBank className="text-2xl" />
            <div>
              <h3 className="font-bold text-lg">Ahorro Grupal</h3>
              <p className="text-purple-100">Revisar movimientos de ahorro</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/eventos/nuevo"
          className="bg-gradient-to-br from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center space-x-4">
            <FaPlus className="text-2xl" />
            <div>
              <h3 className="font-bold text-lg">Nuevo Evento</h3>
              <p className="text-green-100">Registrar evento nuevo</p>
            </div>
          </div>
        </Link>

        {isAdmin && (
          <Link
            href="/admin/usuarios"
            className="bg-gradient-to-br from-indigo-400 to-blue-500 hover:from-indigo-500 hover:to-blue-600 text-white p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <FaUsers className="text-2xl" />
              <div>
                <h3 className="font-bold text-lg">Gestionar Usuarios</h3>
                <p className="text-indigo-100">Control de acceso y permisos</p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}