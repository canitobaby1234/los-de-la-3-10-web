'use client'
import { useState, useEffect, useCallback, JSX } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { 
  FaPlus, FaPiggyBank, FaCalendarAlt, 
  FaUser, FaArrowUp, FaArrowDown, FaAdjust, FaTrash, 
  FaEdit, FaExclamationTriangle, FaCheckCircle, FaTimes, FaChartLine,
  FaCoins, FaReceipt
} from 'react-icons/fa'

interface MovimientoAhorro {
  id: string
  evento_id: string | null
  fecha: string
  tipo: 'aporte' | 'retiro' | 'ajuste'
  monto: number
  concepto: string
  creado_por: string
  eventos?: {
    lugar: string
    fecha: string
  } | null
  miembros?: {
    nombre: string
  }
}

interface EstadisticasAhorro {
  total_actual: number
  total_aportes: number
  total_retiros: number
  total_ajustes: number
  movimientos_mes: number
}

export default function AhorroPage() {
  const { miembro } = useAuth()
  
  const [movimientos, setMovimientos] = useState<MovimientoAhorro[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasAhorro>({
    total_actual: 0,
    total_aportes: 0,
    total_retiros: 0,
    total_ajustes: 0,
    movimientos_mes: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('resumen')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Estados para formularios
  const [showMovimientoForm, setShowMovimientoForm] = useState(false)
  const [editingMovimiento, setEditingMovimiento] = useState<MovimientoAhorro | null>(null)

  const [movimientoForm, setMovimientoForm] = useState<{
    tipo: 'aporte' | 'retiro' | 'ajuste'
    monto: string
    concepto: string
    fecha: string
  }>({
    tipo: 'aporte',
    monto: '',
    concepto: '',
    fecha: new Date().toISOString().split('T')[0]
  })

  // ✅ CORREGIDO: Uso useCallback para evitar el warning de dependencias
  const loadAhorroData = useCallback(async () => {
    try {
      // Cargar movimientos con relaciones
      const { data: movimientosData, error: movimientosError } = await supabase
        .from('ahorro_ledger')
        .select(`
          *,
          eventos(lugar, fecha),
          miembros(nombre)
        `)
        .order('fecha', { ascending: false })

      if (movimientosError) {
        setError('Error al cargar movimientos de ahorro')
        console.error(movimientosError)
        return
      }

      setMovimientos(movimientosData || [])

      // Calcular estadísticas
      const stats = calcularEstadisticas(movimientosData || [])
      setEstadisticas(stats)

    } catch (error) {
      console.error('Error loading ahorro data:', error)
      setError('Error al cargar los datos de ahorro')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (miembro?.estado === 'activo') {
      loadAhorroData()
    }
  }, [miembro, loadAhorroData])

  const calcularEstadisticas = (movimientos: MovimientoAhorro[]): EstadisticasAhorro => {
    const aportes = movimientos.filter(m => m.tipo === 'aporte')
    const retiros = movimientos.filter(m => m.tipo === 'retiro')
    const ajustes = movimientos.filter(m => m.tipo === 'ajuste')
    
    const total_aportes = aportes.reduce((sum, m) => sum + m.monto, 0)
    const total_retiros = retiros.reduce((sum, m) => sum + m.monto, 0)
    const total_ajustes = ajustes.reduce((sum, m) => sum + (m.monto), 0)
    
    const total_actual = total_aportes - total_retiros + total_ajustes
    
    const inicioMes = new Date()
    inicioMes.setDate(1)
    const movimientos_mes = movimientos.filter(m => 
      new Date(m.fecha) >= inicioMes
    ).length

    return {
      total_actual,
      total_aportes,
      total_retiros,
      total_ajustes,
      movimientos_mes
    }
  }

  const handleSubmitMovimiento = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!miembro) return

    try {
      const movimientoData = {
        fecha: movimientoForm.fecha,
        tipo: movimientoForm.tipo,
        monto: parseFloat(movimientoForm.monto),
        concepto: movimientoForm.concepto.trim(),
        creado_por: miembro.id
      }

      let result
      if (editingMovimiento) {
        result = await supabase
          .from('ahorro_ledger')
          .update(movimientoData)
          .eq('id', editingMovimiento.id)
      } else {
        result = await supabase
          .from('ahorro_ledger')
          .insert([movimientoData])
      }

      if (result.error) {
        setError(`Error al ${editingMovimiento ? 'actualizar' : 'agregar'} movimiento`)
        return
      }

      setSuccess(`Movimiento ${editingMovimiento ? 'actualizado' : 'agregado'} exitosamente`)
      setShowMovimientoForm(false)
      setEditingMovimiento(null)
      resetForm()
      loadAhorroData()

    } catch (error) {
      setError(`Error al ${editingMovimiento ? 'actualizar' : 'agregar'} movimiento`)
      console.error(error)
    }
  }

  const handleEditMovimiento = (movimiento: MovimientoAhorro) => {
    setEditingMovimiento(movimiento)
    setMovimientoForm({
      tipo: movimiento.tipo,
      monto: movimiento.monto.toString(),
      concepto: movimiento.concepto,
      fecha: movimiento.fecha
    })
    setShowMovimientoForm(true)
  }

  const handleDeleteMovimiento = async (movimientoId: string) => {
    if (!confirm('¿Eliminar este movimiento de ahorro?')) return

    try {
      await supabase
        .from('ahorro_ledger')
        .delete()
        .eq('id', movimientoId)

      setSuccess('Movimiento eliminado')
      loadAhorroData()
    } catch{
      setError('Error al eliminar movimiento')
    }
  }

  const resetForm = () => {
    setMovimientoForm({
      tipo: 'aporte',
      monto: '',
      concepto: '',
      fecha: new Date().toISOString().split('T')[0]
    })
  }

  const cancelForm = () => {
    setShowMovimientoForm(false)
    setEditingMovimiento(null)
    resetForm()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'aporte': return <FaArrowUp className="text-blue-600" />
      case 'retiro': return <FaArrowDown className="text-orange-600" />
      case 'ajuste': return <FaAdjust className="text-purple-600" />
      default: return <FaCoins className="text-gray-600" />
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'aporte': return 'text-blue-600'
      case 'retiro': return 'text-orange-600'
      case 'ajuste': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const getTipoBgColor = (tipo: string) => {
    switch (tipo) {
      case 'aporte': return 'bg-blue-100 border-blue-200'
      case 'retiro': return 'bg-orange-100 border-orange-200'
      case 'ajuste': return 'bg-purple-100 border-purple-200'
      default: return 'bg-gray-100 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full animate-pulse mb-4 mx-auto"></div>
          <p className="text-slate-600">Cargando ahorro...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'resumen', name: 'Resumen', icon: FaChartLine },
    { id: 'movimientos', name: `Movimientos (${movimientos.length})`, icon: FaReceipt }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-700 flex items-center">
            <FaPiggyBank className="mr-3 text-blue-600" />
            Gestión de Ahorro
          </h1>
          <p className="text-slate-600">Administra el fondo de ahorro del grupo</p>
        </div>

        {miembro?.rol === 'admin' && (
          <button
            onClick={() => setShowMovimientoForm(true)}
            className="inline-flex items-center bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <FaPlus className="mr-2" />
            Nuevo Movimiento
          </button>
        )}
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

      {/* Formulario Modal */}
      {showMovimientoForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-slate-700 mb-4">
              {editingMovimiento ? 'Editar Movimiento' : 'Nuevo Movimiento'}
            </h3>
            <form onSubmit={handleSubmitMovimiento} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
                <select
                  value={movimientoForm.tipo}
                  onChange={(e) => setMovimientoForm({...movimientoForm, tipo: e.target.value as 'aporte' | 'retiro' | 'ajuste'})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="aporte">Aporte</option>
                  <option value="retiro">Retiro</option>
                  <option value="ajuste">Ajuste</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Monto</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={movimientoForm.monto}
                  onChange={(e) => setMovimientoForm({...movimientoForm, monto: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={movimientoForm.fecha}
                  onChange={(e) => setMovimientoForm({...movimientoForm, fecha: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Concepto</label>
                <textarea
                  value={movimientoForm.concepto}
                  onChange={(e) => setMovimientoForm({...movimientoForm, concepto: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descripción del movimiento..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {editingMovimiento ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
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
          <ResumenAhorroTab 
            estadisticas={estadisticas}
            formatCurrency={formatCurrency}
          />
        )}
        
        {activeTab === 'movimientos' && (
          <MovimientosTab 
            movimientos={movimientos}
            onEdit={miembro?.rol === 'admin' ? handleEditMovimiento : undefined}
            onDelete={miembro?.rol === 'admin' ? handleDeleteMovimiento : undefined}
            formatCurrency={formatCurrency}
            getTipoIcon={getTipoIcon}
            getTipoColor={getTipoColor}
            getTipoBgColor={getTipoBgColor}
          />
        )}
      </div>
    </div>
  )
}

// ✅ CORREGIDO: Definí interfaz para props
interface ResumenAhorroTabProps {
  estadisticas: EstadisticasAhorro;
  formatCurrency: (amount: number) => string;
}

function ResumenAhorroTab({ estadisticas, formatCurrency }: ResumenAhorroTabProps) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Tarjetas principales */}
      <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
        {/* Total actual */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">💰 Total en Ahorro</h3>
              <p className="text-3xl font-bold">{formatCurrency(estadisticas.total_actual)}</p>
              <p className="text-blue-100 text-sm mt-1">Disponible actualmente</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <FaPiggyBank className="text-2xl" />
            </div>
          </div>
        </div>

        {/* Total aportes */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-blue-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">📈 Total Aportes</h3>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(estadisticas.total_aportes)}</p>
              <p className="text-slate-600 text-sm mt-1">Dinero ingresado</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FaArrowUp className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total retiros */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-orange-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">📉 Total Retiros</h3>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(estadisticas.total_retiros)}</p>
              <p className="text-slate-600 text-sm mt-1">Dinero retirado</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <FaArrowDown className="text-orange-600" />
            </div>
          </div>
        </div>

        {/* Ajustes */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">⚖️ Ajustes</h3>
              <p className={`text-2xl font-bold ${estadisticas.total_ajustes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(estadisticas.total_ajustes)}
              </p>
              <p className="text-slate-600 text-sm mt-1">Correcciones aplicadas</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <FaAdjust className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Panel lateral */}
      <div className="space-y-6">
        {/* Actividad del mes */}
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-cyan-800 mb-4">📊 Este Mes</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-cyan-700">Movimientos:</span>
              <span className="font-bold text-cyan-800">{estadisticas.movimientos_mes}</span>
            </div>
            <div className="text-sm text-cyan-600">
              Operaciones realizadas en el mes actual
            </div>
          </div>
        </div>

        {/* Balance general */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-700 mb-4">📈 Balance General</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Ingresos:</span>
              <span className="font-medium text-green-600">+{formatCurrency(estadisticas.total_aportes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Egresos:</span>
              <span className="font-medium text-red-600">-{formatCurrency(estadisticas.total_retiros)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Ajustes:</span>
              <span className={`font-medium ${estadisticas.total_ajustes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {estadisticas.total_ajustes >= 0 ? '+' : ''}{formatCurrency(estadisticas.total_ajustes)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Total:</span>
                <span className={`font-bold text-lg ${estadisticas.total_actual >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(estadisticas.total_actual)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Información útil */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-4">💡 Información</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p><strong>Aportes:</strong> Dinero que entra al fondo</p>
            <p><strong>Retiros:</strong> Dinero que sale del fondo</p>
            <p><strong>Ajustes:</strong> Correcciones contables</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ✅ CORREGIDO: Definí interfaz para props
interface MovimientosTabProps {
  movimientos: MovimientoAhorro[];
  onEdit?: (movimiento: MovimientoAhorro) => void;
  onDelete?: (id: string) => void;
  formatCurrency: (amount: number) => string;
  getTipoIcon: (tipo: string) => JSX.Element;
  getTipoColor: (tipo: string) => string;
  getTipoBgColor: (tipo: string) => string;
}

function MovimientosTab({ 
  movimientos, onEdit, onDelete, formatCurrency, 
  getTipoIcon, getTipoColor, getTipoBgColor 
}: MovimientosTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-700">Historial de Movimientos</h2>
        <p className="text-slate-600">Todos los movimientos del fondo de ahorro</p>
      </div>

      {movimientos.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaPiggyBank className="text-2xl text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No hay movimientos registrados</h3>
          <p className="text-slate-600">Agrega el primer movimiento al fondo de ahorro</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {movimientos.map((movimiento: MovimientoAhorro) => (
            <div key={movimiento.id} className={`bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow border ${getTipoBgColor(movimiento.tipo)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                    {getTipoIcon(movimiento.tipo)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-semibold capitalize ${getTipoColor(movimiento.tipo)}`}>
                        {movimiento.tipo}
                      </h4>
                      {movimiento.eventos && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                          Evento: {movimiento.eventos.lugar}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 font-medium">{movimiento.concepto}</p>
                    <div className="flex items-center text-sm text-slate-500 mt-1">
                      <FaCalendarAlt className="mr-1" />
                      {new Date(movimiento.fecha).toLocaleDateString('es-MX')}
                      {movimiento.miembros && (
                        <>
                          <span className="mx-2">•</span>
                          <FaUser className="mr-1" />
                          {movimiento.miembros.nombre}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`font-bold text-lg ${getTipoColor(movimiento.tipo)}`}>
                    {movimiento.tipo === 'retiro' ? '-' : '+'}
                    {formatCurrency(movimiento.monto)}
                  </span>
                  {(onEdit || onDelete) && (
                    <div className="flex space-x-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(movimiento)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                        >
                          <FaEdit />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(movimiento.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}