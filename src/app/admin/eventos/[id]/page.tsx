'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  FaArrowLeft, FaEdit, FaTrash, FaCalendarAlt, FaMapMarkerAlt, FaUser, FaDollarSign, 
  FaFileContract, FaPlus, FaMinus, FaChartLine, FaPiggyBank, FaMoneyBillWave, 
  FaUsers, FaUndo, FaExclamationTriangle, FaCheckCircle, FaClock, FaTimes,
  FaReceipt, FaLightbulb, FaTruck, FaTools, FaWarehouse, FaShoppingCart
} from 'react-icons/fa'

interface EventoCompleto {
  id: string
  fecha: string
  lugar: string
  cliente: string
  total: number
  anticipo_recibido: number
  contrato_firmado: boolean
  estado: 'tentativo' | 'confirmado' | 'completado' | 'cancelado'
  creado_por: string
  gastos_totales: number
  ahorro_aportado: number
  ingresos_extras: number
  neto_evento: number
}

interface Gasto {
  id: string
  fecha: string
  categoria: string
  monto: number
  notas: string
  creado_por: string
}

interface IngresoExtra {
  id: string
  fecha: string
  categoria: string
  monto: number
  notas: string
  creado_por: string
}

interface RepartoLote {
  id: string
  creado_en: string
  estado: 'aplicado' | 'cancelado'
  repartos: Array<{
    id: string
    miembro_id: string
    monto: number
    miembros: {
      nombre: string
    }
  }>
}

export default function EventoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { miembro } = useAuth()
  
  const [evento, setEvento] = useState<EventoCompleto | null>(null)
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [ingresos, setIngresos] = useState<IngresoExtra[]>([])
  const [repartos, setRepartos] = useState<RepartoLote[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'resumen')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Estados para formularios
  const [showGastoForm, setShowGastoForm] = useState(false)
  const [showIngresoForm, setShowIngresoForm] = useState(false)
  const [repartoLoading, setRepartoLoading] = useState(false)

  const [gastoForm, setGastoForm] = useState({
    categoria: 'transporte' as const,
    monto: '',
    notas: '',
    fecha: new Date().toISOString().split('T')[0]
  })

  const [ingresoForm, setIngresoForm] = useState({
    categoria: 'renta_audio' as const,
    monto: '',
    notas: '',
    fecha: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (params.id && miembro?.estado === 'activo') {
      loadEventoCompleto()
    }
  }, [params.id, miembro])

  const loadEventoCompleto = async () => {
    try {
      // Cargar evento con balance
      const { data: eventoData, error: eventoError } = await supabase
        .from('v_evento_balance')
        .select(`
          *,
          eventos!inner(
            id, fecha, lugar, cliente, total, anticipo_recibido, 
            contrato_firmado, estado, creado_por
          )
        `)
        .eq('id', params.id)
        .single()

      if (eventoError) {
        setError('Error al cargar el evento')
        setLoading(false)
        return
      }

      setEvento({
        id: eventoData.id,
        fecha: eventoData.fecha,
        lugar: eventoData.lugar,
        cliente: eventoData.eventos.cliente,
        total: eventoData.total,
        anticipo_recibido: eventoData.eventos.anticipo_recibido,
        contrato_firmado: eventoData.eventos.contrato_firmado,
        estado: eventoData.eventos.estado,
        creado_por: eventoData.eventos.creado_por,
        gastos_totales: eventoData.gastos_totales || 0,
        ahorro_aportado: eventoData.ahorro_aportado || 0,
        ingresos_extras: eventoData.ingresos_extras || 0,
        neto_evento: eventoData.neto_evento || 0
      })

      // Cargar gastos
      const { data: gastosData } = await supabase
        .from('gastos')
        .select('*')
        .eq('evento_id', params.id)
        .order('fecha', { ascending: false })

      setGastos(gastosData || [])

      // Cargar ingresos extras
      const { data: ingresosData } = await supabase
        .from('ingresos_extras')
        .select('*')
        .eq('evento_id', params.id)
        .order('fecha', { ascending: false })

      setIngresos(ingresosData || [])

      // Cargar repartos
      const { data: repartosData } = await supabase
        .from('reparto_lotes')
        .select(`
          *,
          repartos(
            id,
            miembro_id,
            monto,
            miembros(nombre)
          )
        `)
        .eq('evento_id', params.id)
        .order('creado_en', { ascending: false })

      setRepartos(repartosData || [])

    } catch (error) {
      console.error('Error loading evento:', error)
      setError('Error al cargar los datos del evento')
    } finally {
      setLoading(false)
    }
  }

  const handleAddGasto = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!miembro) return

    try {
      const { error } = await supabase
        .from('gastos')
        .insert([{
          evento_id: params.id,
          categoria: gastoForm.categoria,
          monto: parseFloat(gastoForm.monto),
          notas: gastoForm.notas.trim(),
          fecha: gastoForm.fecha,
          creado_por: miembro.id
        }])

      if (error) {
        setError('Error al agregar gasto')
        return
      }

      setSuccess('Gasto agregado exitosamente')
      setShowGastoForm(false)
      setGastoForm({
        categoria: 'transporte',
        monto: '',
        notas: '',
        fecha: new Date().toISOString().split('T')[0]
      })
      loadEventoCompleto()

    } catch (error) {
      console.error('Error adding gasto:', error)
      setError('Error al agregar gasto')
    }
  }

  const handleAddIngreso = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!miembro) return

    try {
      const { error } = await supabase
        .from('ingresos_extras')
        .insert([{
          evento_id: params.id,
          categoria: ingresoForm.categoria,
          monto: parseFloat(ingresoForm.monto),
          notas: ingresoForm.notas.trim(),
          fecha: ingresoForm.fecha,
          creado_por: miembro.id
        }])

      if (error) {
        setError('Error al agregar ingreso')
        return
      }

      setSuccess('Ingreso agregado exitosamente')
      setShowIngresoForm(false)
      setIngresoForm({
        categoria: 'renta_audio',
        monto: '',
        notas: '',
        fecha: new Date().toISOString().split('T')[0]
      })
      loadEventoCompleto()

    } catch (error) {
      console.error('Error adding ingreso:', error)
      setError('Error al agregar ingreso')
    }
  }

  const handleRepartirDinero = async () => {
    if (!evento || evento.estado === 'completado') return

    const confirmar = confirm(
      `¿Estás seguro de cerrar y repartir este evento?\n\n` +
      `Neto a repartir: ${formatCurrency(evento.neto_evento)}\n` +
      `Esto marcará el evento como completado y creará los repartos individuales.\n\n` +
      `Esta acción se puede revertir si es necesario.`
    )

    if (!confirmar) return

    setRepartoLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.rpc('cerrar_y_repartir_evento', {
        p_evento_id: params.id,
        p_omitir_ahorro: false, // Por defecto aplicar 10% de ahorro
        p_ahorro_pct: 0.10
      })

      if (error) {
        console.error('Error en reparto:', error)
        setError('Error al repartir: ' + error.message)
        setRepartoLoading(false)
        return
      }

      setSuccess('¡Evento cerrado y dinero repartido exitosamente!')
      loadEventoCompleto()

    } catch (error) {
      console.error('Error repartiendo dinero:', error)
      setError('Error inesperado al repartir dinero')
    } finally {
      setRepartoLoading(false)
    }
  }

  const handleCancelarReparto = async (loteId: string) => {
    const confirmar = confirm(
      '¿Estás seguro de cancelar este reparto?\n\n' +
      'Esto revertirá todos los repartos del lote y volverá el evento a estado "confirmado".'
    )

    if (!confirmar) return

    try {
      const { error } = await supabase.rpc('cancelar_reparto_lote', {
        p_lote_id: loteId
      })

      if (error) {
        console.error('Error cancelando reparto:', error)
        setError('Error al cancelar reparto: ' + error.message)
        return
      }

      setSuccess('Reparto cancelado exitosamente')
      loadEventoCompleto()

    } catch (error) {
      console.error('Error cancelando reparto:', error)
      setError('Error inesperado al cancelar reparto')
    }
  }

  const deleteGasto = async (gastoId: string) => {
    if (!confirm('¿Eliminar este gasto?')) return

    try {
      const { error } = await supabase
        .from('gastos')
        .delete()
        .eq('id', gastoId)

      if (error) {
        setError('Error al eliminar gasto')
        return
      }

      setSuccess('Gasto eliminado')
      loadEventoCompleto()
    } catch (error) {
      setError('Error al eliminar gasto')
    }
  }

  const deleteIngreso = async (ingresoId: string) => {
    if (!confirm('¿Eliminar este ingreso?')) return

    try {
      const { error } = await supabase
        .from('ingresos_extras')
        .delete()
        .eq('id', ingresoId)

      if (error) {
        setError('Error al eliminar ingreso')
        return
      }

      setSuccess('Ingreso eliminado')
      loadEventoCompleto()
    } catch (error) {
      setError('Error al eliminar ingreso')
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

  const getCategoriaIcon = (categoria: string) => {
    const iconMap: Record<string, any> = {
      transporte: FaTruck,
      chalan: FaUser,
      renta_equipo: FaTools,
      renta_bodega: FaWarehouse,
      compra_equipo: FaShoppingCart,
      renta_audio: FaReceipt,
      renta_iluminacion: FaLightbulb,
      otro: FaReceipt
    }
    const Icon = iconMap[categoria] || FaReceipt
    return <Icon />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-slate-500 rounded-full animate-pulse mb-4 mx-auto"></div>
          <p className="text-slate-600">Cargando evento...</p>
        </div>
      </div>
    )
  }

  if (!evento) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaExclamationTriangle className="text-3xl text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-700 mb-4">Evento no encontrado</h1>
        <Link
          href="/admin/eventos"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" />
          Volver a eventos
        </Link>
      </div>
    )
  }

  const tabs = [
    { id: 'resumen', name: 'Resumen', icon: FaChartLine },
    { id: 'gastos', name: `Gastos (${gastos.length})`, icon: FaMinus },
    { id: 'ingresos', name: `Ingresos (${ingresos.length})`, icon: FaPlus },
    { id: 'repartos', name: `Repartos (${repartos.length})`, icon: FaUsers }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/eventos"
            className="inline-flex items-center text-slate-600 hover:text-slate-800 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Volver
          </Link>
          <div className="h-6 w-px bg-slate-300"></div>
          <div>
            <h1 className="text-3xl font-bold text-slate-700">{evento.lugar}</h1>
            <p className="text-slate-600">{formatDate(evento.fecha)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {evento.estado !== 'completado' && evento.neto_evento > 0 && (
            <button
              onClick={handleRepartirDinero}
              disabled={repartoLoading}
              className="inline-flex items-center bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:scale-105"
            >
              {repartoLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Repartiendo...
                </>
              ) : (
                <>
                  <FaMoneyBillWave className="mr-2" />
                  Repartir Dinero
                </>
              )}
            </button>
          )}
          
          <Link
            href={`/admin/eventos/${evento.id}/editar`}
            className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <FaEdit className="mr-2" />
            Editar
          </Link>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
          <FaExclamationTriangle className="mr-2 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <FaTimes />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
          <FaCheckCircle className="mr-2 flex-shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto">
            <FaTimes />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-blue-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className="inline mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de tabs */}
      <div className="min-h-96">
        {activeTab === 'resumen' && (
          <ResumenTab evento={evento} />
        )}
        
        {activeTab === 'gastos' && (
          <GastosTab 
            gastos={gastos}
            showForm={showGastoForm}
            setShowForm={setShowGastoForm}
            gastoForm={gastoForm}
            setGastoForm={setGastoForm}
            onSubmit={handleAddGasto}
            onDelete={deleteGasto}
            formatCurrency={formatCurrency}
            getCategoriaIcon={getCategoriaIcon}
          />
        )}
        
        {activeTab === 'ingresos' && (
          <IngresosTab 
            ingresos={ingresos}
            showForm={showIngresoForm}
            setShowForm={setShowIngresoForm}
            ingresoForm={ingresoForm}
            setIngresoForm={setIngresoForm}
            onSubmit={handleAddIngreso}
            onDelete={deleteIngreso}
            formatCurrency={formatCurrency}
            getCategoriaIcon={getCategoriaIcon}
          />
        )}
        
        {activeTab === 'repartos' && (
          <RepartosTab 
            repartos={repartos}
            onCancelarReparto={handleCancelarReparto}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </div>
  )
}

function ResumenTab({ evento }: { evento: EventoCompleto }) {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado': return 'bg-green-100 text-green-800 border-green-200'
      case 'confirmado': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'tentativo': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Información principal */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-blue-200/50">
          <h2 className="text-xl font-bold text-slate-700 mb-4">Información del Evento</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <FaCalendarAlt className="text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-slate-600">Fecha</p>
                  <p className="font-medium text-slate-700">{new Date(evento.fecha).toLocaleDateString('es-MX')}</p>
                </div>
              </div>
              <div className="flex items-center">
                <FaMapMarkerAlt className="text-amber-600 mr-3" />
                <div>
                  <p className="text-sm text-slate-600">Lugar</p>
                  <p className="font-medium text-slate-700">{evento.lugar}</p>
                </div>
              </div>
              <div className="flex items-center">
                <FaUser className="text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-slate-600">Cliente</p>
                  <p className="font-medium text-slate-700">{evento.cliente || 'No especificado'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <FaDollarSign className="text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-slate-600">Total del evento</p>
                  <p className="font-bold text-lg text-green-700">{formatCurrency(evento.total)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <FaFileContract className="text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-slate-600">Contrato</p>
                  <p className="font-medium text-slate-700">
                    {evento.contrato_firmado ? '✅ Firmado' : '❌ Sin firmar'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600">Estado</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(evento.estado)}`}>
                  {evento.estado.charAt(0).toUpperCase() + evento.estado.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Balance financiero */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-blue-200/50">
          <h2 className="text-xl font-bold text-slate-700 mb-4">Balance Financiero</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">Total del evento:</span>
              <span className="font-bold text-lg text-green-600">{formatCurrency(evento.total)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">Anticipo recibido:</span>
              <span className="font-medium text-blue-600">{formatCurrency(evento.anticipo_recibido)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">Gastos totales:</span>
              <span className="font-medium text-red-600">-{formatCurrency(evento.gastos_totales)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">Ingresos extras:</span>
              <span className="font-medium text-green-600">+{formatCurrency(evento.ingresos_extras)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">Ahorro aplicado:</span>
              <span className="font-medium text-purple-600">-{formatCurrency(evento.ahorro_aportado)}</span>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-slate-700">Neto a repartir:</span>
                <span className={`text-2xl font-bold ${evento.neto_evento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(evento.neto_evento)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel lateral */}
      <div className="space-y-6">
        {/* Progreso del anticipo */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-4">💰 Estado del Anticipo</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">Recibido:</span>
              <span className="font-bold text-blue-800">{formatCurrency(evento.anticipo_recibido)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">Pendiente:</span>
              <span className="font-bold text-blue-800">
                {formatCurrency(evento.total - evento.anticipo_recibido)}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((evento.anticipo_recibido / evento.total) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-blue-700 text-center">
              {((evento.anticipo_recibido / evento.total) * 100).toFixed(1)}% pagado
            </p>
          </div>
        </div>

        {/* Acciones rápidas */}
        {evento.estado !== 'completado' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-amber-800 mb-4">⚡ Acciones Rápidas</h3>
            <div className="space-y-2">
              <p className="text-sm text-amber-700">
                <strong>Para cerrar el evento:</strong>
              </p>
              <ul className="text-sm text-amber-600 space-y-1 ml-4">
                <li>• Registra todos los gastos</li>
                <li>• Agrega ingresos extras si hay</li>
                <li>• Usa "Repartir Dinero" para cerrar</li>
              </ul>
            </div>
          </div>
        )}

        {/* Estado del evento */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-700 mb-4">📊 Estado Actual</h3>
          <div className="space-y-2 text-sm">
            {evento.estado === 'completado' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-green-800">✅ Evento completado</p>
                <p className="text-green-600">El dinero ha sido repartido</p>
              </div>
            )}
            {evento.estado === 'confirmado' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-blue-800">🔹 Evento confirmado</p>
                <p className="text-blue-600">Listo para ejecutar</p>
              </div>
            )}
            {evento.estado === 'tentativo' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-medium text-yellow-800">⏳ Evento tentativo</p>
                <p className="text-yellow-600">Pendiente de confirmación</p>
              </div>
            )}
            {evento.estado === 'cancelado' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-medium text-red-800">❌ Evento cancelado</p>
                <p className="text-red-600">No se procesará</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function GastosTab({ 
  gastos, showForm, setShowForm, gastoForm, setGastoForm, 
  onSubmit, onDelete, formatCurrency, getCategoriaIcon 
}: any) {
  
  const categoriasGastos = [
    { value: 'transporte', label: 'Transporte' },
    { value: 'chalan', label: 'Chalán' },
    { value: 'renta_equipo', label: 'Renta de equipo' },
    { value: 'renta_bodega', label: 'Renta de bodega' },
    { value: 'compra_equipo', label: 'Compra de equipo' },
    { value: 'otro', label: 'Otro' }
  ]

  return (
    <div className="space-y-6">
      {/* Header con botón agregar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-700">Gastos del Evento</h2>
          <p className="text-slate-600">
            Total en gastos: <span className="font-bold text-red-600">
              {formatCurrency(gastos.reduce((sum: number, g: any) => sum + g.monto, 0))}
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <FaPlus className="mr-2" />
          {showForm ? 'Cancelar' : 'Agregar Gasto'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={onSubmit} className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-red-800 mb-4">Nuevo Gasto</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
              <select
                value={gastoForm.categoria}
                onChange={(e) => setGastoForm({...gastoForm, categoria: e.target.value})}
                className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              >
                {categoriasGastos.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Monto</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={gastoForm.monto}
                onChange={(e) => setGastoForm({...gastoForm, monto: e.target.value})}
                className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fecha</label>
              <input
                type="date"
                value={gastoForm.fecha}
                onChange={(e) => setGastoForm({...gastoForm, fecha: e.target.value})}
                className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Notas</label>
              <input
                type="text"
                value={gastoForm.notas}
                onChange={(e) => setGastoForm({...gastoForm, notas: e.target.value})}
                className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Descripción opcional"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Guardar Gasto
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de gastos */}
      {gastos.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaMinus className="text-2xl text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No hay gastos registrados</h3>
          <p className="text-slate-600">Agrega el primer gasto de este evento</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {gastos.map((gasto: any) => (
            <div key={gasto.id} className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow border border-red-200/50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  {getCategoriaIcon(gasto.categoria)}
                </div>
                <div>
                  <h4 className="font-medium text-slate-700 capitalize">
                    {gasto.categoria.replace('_', ' ')}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {new Date(gasto.fecha).toLocaleDateString('es-MX')}
                    {gasto.notas && ` • ${gasto.notas}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-bold text-red-600 text-lg">
                  {formatCurrency(gasto.monto)}
                </span>
                <button
                  onClick={() => onDelete(gasto.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function IngresosTab({ 
  ingresos, showForm, setShowForm, ingresoForm, setIngresoForm, 
  onSubmit, onDelete, formatCurrency, getCategoriaIcon 
}: any) {
  
  const categoriasIngresos = [
    { value: 'renta_audio', label: 'Renta de audio' },
    { value: 'renta_iluminacion', label: 'Renta de iluminación' },
    { value: 'otro', label: 'Otro' }
  ]

  return (
    <div className="space-y-6">
      {/* Header con botón agregar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-700">Ingresos Extras</h2>
          <p className="text-slate-600">
            Total ingresos extras: <span className="font-bold text-green-600">
              {formatCurrency(ingresos.reduce((sum: number, i: any) => sum + i.monto, 0))}
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <FaPlus className="mr-2" />
          {showForm ? 'Cancelar' : 'Agregar Ingreso'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={onSubmit} className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-green-800 mb-4">Nuevo Ingreso Extra</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
              <select
                value={ingresoForm.categoria}
                onChange={(e) => setIngresoForm({...ingresoForm, categoria: e.target.value})}
                className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                {categoriasIngresos.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Monto</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={ingresoForm.monto}
                onChange={(e) => setIngresoForm({...ingresoForm, monto: e.target.value})}
                className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fecha</label>
              <input
                type="date"
                value={ingresoForm.fecha}
                onChange={(e) => setIngresoForm({...ingresoForm, fecha: e.target.value})}
                className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Notas</label>
              <input
                type="text"
                value={ingresoForm.notas}
                onChange={(e) => setIngresoForm({...ingresoForm, notas: e.target.value})}
                className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Descripción opcional"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Guardar Ingreso
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de ingresos */}
      {ingresos.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaPlus className="text-2xl text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No hay ingresos extras</h3>
          <p className="text-slate-600">Los ingresos extras aumentan las ganancias del evento</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {ingresos.map((ingreso: any) => (
            <div key={ingreso.id} className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow border border-green-200/50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  {getCategoriaIcon(ingreso.categoria)}
                </div>
                <div>
                  <h4 className="font-medium text-slate-700 capitalize">
                    {ingreso.categoria.replace('_', ' ')}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {new Date(ingreso.fecha).toLocaleDateString('es-MX')}
                    {ingreso.notas && ` • ${ingreso.notas}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-bold text-green-600 text-lg">
                  +{formatCurrency(ingreso.monto)}
                </span>
                <button
                  onClick={() => onDelete(ingreso.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RepartosTab({ repartos, onCancelarReparto, formatCurrency }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-700">Historial de Repartos</h2>
        <p className="text-slate-600">Repartos de dinero realizados para este evento</p>
      </div>

      {repartos.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUsers className="text-2xl text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No hay repartos realizados</h3>
          <p className="text-slate-600">
            Usa el botón "Repartir Dinero" en la parte superior para cerrar el evento y distribuir las ganancias
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {repartos.map((lote: any) => (
            <div key={lote.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-200/50">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-700">
                    Reparto #{lote.id.slice(-8)}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {new Date(lote.creado_en).toLocaleString('es-MX')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    lote.estado === 'aplicado' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {lote.estado === 'aplicado' ? '✅ Aplicado' : '❌ Cancelado'}
                  </span>
                  {lote.estado === 'aplicado' && (
                    <button
                      onClick={() => onCancelarReparto(lote.id)}
                      className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                    >
                      <FaUndo className="mr-1" />
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                {lote.repartos?.map((reparto: any) => (
                  <div key={reparto.id} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center mr-3">
                        <FaUser className="text-purple-600 text-sm" />
                      </div>
                      <span className="font-medium text-slate-700">
                        {reparto.miembros?.nombre || 'Usuario desconocido'}
                      </span>
                    </div>
                    <span className="font-bold text-purple-600">
                      {formatCurrency(reparto.monto)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Total repartido:</span>
                  <span className="font-bold text-lg text-purple-600">
                    {formatCurrency(lote.repartos?.reduce((sum: number, r: any) => sum + r.monto, 0) || 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}