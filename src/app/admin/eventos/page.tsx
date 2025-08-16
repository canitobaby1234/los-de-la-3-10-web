'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { FaPlus, FaEdit, FaEye, FaTrash, FaCalendarAlt, FaMapMarkerAlt, FaDollarSign, FaCheckCircle, FaClock, FaTimes, FaFilter } from 'react-icons/fa'

interface EventoConBalance {
  id: string
  fecha: string
  lugar: string
  cliente: string
  total: number
  anticipo_recibido: number
  contrato_firmado: boolean
  estado: 'tentativo' | 'confirmado' | 'completado' | 'cancelado'
  gastos_totales: number
  ahorro_aportado: number
  ingresos_extras: number
  neto_evento: number
  creado_por: string
}

export default function EventosPage() {
  const { miembro } = useAuth()
  const [eventos, setEventos] = useState<EventoConBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    if (miembro?.estado === 'activo') {
      loadEventos()
    }
  }, [miembro])

  const loadEventos = async () => {
    try {
      const { data, error } = await supabase
        .from('v_evento_balance')
        .select(`
          *,
          eventos!inner(
            id,
            fecha,
            lugar,
            cliente,
            total,
            anticipo_recibido,
            contrato_firmado,
            estado,
            creado_por
          )
        `)
        .order('fecha', { ascending: false })

      if (error) {
        console.error('Error loading eventos:', error)
        return
      }

      // Combinar datos del balance con datos del evento
      const eventosConBalance = data?.map(balance => ({
        id: balance.id,
        fecha: balance.fecha,
        lugar: balance.lugar,
        cliente: balance.eventos.cliente,
        total: balance.total,
        anticipo_recibido: balance.eventos.anticipo_recibido,
        contrato_firmado: balance.eventos.contrato_firmado,
        estado: balance.eventos.estado,
        gastos_totales: balance.gastos_totales || 0,
        ahorro_aportado: balance.ahorro_aportado || 0,
        ingresos_extras: balance.ingresos_extras || 0,
        neto_evento: balance.neto_evento || 0,
        creado_por: balance.eventos.creado_por
      })) || []

      setEventos(eventosConBalance)
    } catch (error) {
      console.error('Error loading eventos:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteEvento = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting evento:', error)
        alert('Error al eliminar el evento')
        return
      }

      // Recargar la lista
      loadEventos()
    } catch (error) {
      console.error('Error deleting evento:', error)
      alert('Error al eliminar el evento')
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
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'confirmado':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'tentativo':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <FaCheckCircle className="text-green-600" />
      case 'confirmado':
        return <FaCheckCircle className="text-blue-600" />
      case 'tentativo':
        return <FaClock className="text-yellow-600" />
      case 'cancelado':
        return <FaTimes className="text-red-600" />
      default:
        return <FaClock className="text-gray-600" />
    }
  }

  // Filtrar eventos
  const eventosFiltrados = eventos.filter(evento => {
    const cumpleFiltroEstado = filtroEstado === 'todos' || evento.estado === filtroEstado
    const cumpleBusqueda = evento.lugar.toLowerCase().includes(busqueda.toLowerCase()) ||
                          evento.cliente.toLowerCase().includes(busqueda.toLowerCase())
    return cumpleFiltroEstado && cumpleBusqueda
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-blue-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-blue-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (miembro?.estado !== 'activo') {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaClock className="text-3xl text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-700 mb-4">
          Acceso Restringido
        </h1>
        <p className="text-lg text-slate-600">
          Tu cuenta debe ser activada por un administrador para acceder a esta sección.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-700 mb-2">Eventos</h1>
          <p className="text-slate-600">Gestiona eventos, finanzas y repartos</p>
        </div>
        
        <Link
          href="/admin/eventos/nuevo"
          className="inline-flex items-center bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-700 hover:to-slate-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-amber-400/20"
        >
          <FaPlus className="mr-2" />
          Nuevo Evento
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-blue-200/50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="busqueda" className="block text-sm font-medium text-slate-700 mb-2">
              Buscar por lugar o cliente
            </label>
            <input
              id="busqueda"
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Buscar..."
            />
          </div>
          
          <div>
            <label htmlFor="filtroEstado" className="block text-sm font-medium text-slate-700 mb-2">
              Filtrar por estado
            </label>
            <select
              id="filtroEstado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="tentativo">Tentativo</option>
              <option value="confirmado">Confirmado</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de eventos */}
      {eventosFiltrados.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCalendarAlt className="text-3xl text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700 mb-4">
            {busqueda || filtroEstado !== 'todos' ? 'No se encontraron eventos' : 'No hay eventos registrados'}
          </h2>
          <p className="text-slate-600 mb-8">
            {busqueda || filtroEstado !== 'todos' 
              ? 'Intenta cambiar los filtros de búsqueda' 
              : 'Comienza registrando tu primer evento'
            }
          </p>
          {(!busqueda && filtroEstado === 'todos') && (
            <Link
              href="/admin/eventos/nuevo"
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-slate-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-slate-800 transition-all"
            >
              <FaPlus className="mr-2" />
              Crear Primer Evento
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {eventosFiltrados.map((evento) => (
            <div
              key={evento.id}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-blue-200/50 hover:shadow-xl transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Info principal */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-700 mb-1">{evento.lugar}</h3>
                      <div className="flex items-center text-slate-600 mb-2">
                        <FaCalendarAlt className="mr-2 text-blue-600" />
                        <span>{formatDate(evento.fecha)}</span>
                      </div>
                      <div className="flex items-center text-slate-600">
                        <FaMapMarkerAlt className="mr-2 text-amber-600" />
                        <span>Cliente: {evento.cliente || 'No especificado'}</span>
                      </div>
                    </div>
                    
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(evento.estado)}`}>
                      {getEstadoIcon(evento.estado)}
                      <span className="ml-2 capitalize">{evento.estado}</span>
                    </div>
                  </div>

                  {/* Métricas financieras */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium uppercase">Total</p>
                      <p className="text-lg font-bold text-blue-800">{formatCurrency(evento.total)}</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-600 font-medium uppercase">Anticipo</p>
                      <p className="text-lg font-bold text-green-800">{formatCurrency(evento.anticipo_recibido)}</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-600 font-medium uppercase">Gastos</p>
                      <p className="text-lg font-bold text-red-800">{formatCurrency(evento.gastos_totales)}</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-purple-600 font-medium uppercase">Neto</p>
                      <p className="text-lg font-bold text-purple-800">{formatCurrency(evento.neto_evento)}</p>
                    </div>
                  </div>

                  {/* Indicadores */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {evento.contrato_firmado && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        📄 Contrato firmado
                      </span>
                    )}
                    {evento.anticipo_recibido >= (evento.total * 0.4) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        💰 Anticipo completo
                      </span>
                    )}
                    {evento.estado === 'completado' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Evento cerrado
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2 lg:ml-6">
                  <Link
                    href={`/admin/eventos/${evento.id}`}
                    className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FaEye className="mr-2" />
                    Ver Detalle
                  </Link>
                  
                  <Link
                    href={`/admin/eventos/${evento.id}?tab=editar`}
                    className="inline-flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FaEdit className="mr-2" />
                    Editar
                  </Link>
                  
                  <button
                    onClick={() => deleteEvento(evento.id)}
                    className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FaTrash className="mr-2" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resumen */}
      {eventosFiltrados.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl p-6 border border-blue-200/50">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Resumen</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{eventosFiltrados.length}</p>
              <p className="text-sm text-slate-600">Eventos mostrados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(eventosFiltrados.reduce((sum, e) => sum + e.total, 0))}
              </p>
              <p className="text-sm text-slate-600">Ingresos totales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(eventosFiltrados.reduce((sum, e) => sum + e.gastos_totales, 0))}
              </p>
              <p className="text-sm text-slate-600">Gastos totales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(eventosFiltrados.reduce((sum, e) => sum + e.neto_evento, 0))}
              </p>
              <p className="text-sm text-slate-600">Neto total</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}