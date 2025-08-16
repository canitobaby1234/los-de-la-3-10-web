'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { FaArrowLeft, FaSave, FaCalendarAlt, FaMapMarkerAlt, FaUser, FaDollarSign, FaFileContract, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa'

export default function NuevoEventoPage() {
  const { miembro } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    fecha: '',
    lugar: '',
    cliente: '',
    total: '',
    anticipo_recibido: '0',
    contrato_firmado: false,
    estado: 'tentativo' as 'tentativo' | 'confirmado' | 'completado' | 'cancelado'
  })

  // Validaciones automáticas
  const anticipoPorcentaje = formData.total ? (parseFloat(formData.anticipo_recibido) / parseFloat(formData.total)) * 100 : 0
  const anticipoSuficiente = anticipoPorcentaje >= 40
  const debeContratoObligatorio = anticipoSuficiente
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!miembro) {
      setError('No se pudo identificar el usuario')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validaciones
      if (!formData.fecha || !formData.lugar || !formData.total) {
        setError('Por favor completa todos los campos obligatorios')
        setLoading(false)
        return
      }

      const total = parseFloat(formData.total)
      const anticipo = parseFloat(formData.anticipo_recibido)

      if (total <= 0) {
        setError('El total debe ser mayor a 0')
        setLoading(false)
        return
      }

      if (anticipo < 0) {
        setError('El anticipo no puede ser negativo')
        setLoading(false)
        return
      }

      if (anticipo > total) {
        setError('El anticipo no puede ser mayor al total')
        setLoading(false)
        return
      }

      // Validar regla de negocio: Si anticipo >= 40%, contrato obligatorio
      if (anticipoPorcentaje >= 40 && !formData.contrato_firmado) {
        setError('Si el anticipo es 40% o más, el contrato debe estar firmado obligatoriamente')
        setLoading(false)
        return
      }

      // Si el anticipo es suficiente, automáticamente confirmar el evento
      const estadoFinal = anticipoPorcentaje >= 40 ? 'confirmado' : formData.estado

      const { data, error } = await supabase
        .from('eventos')
        .insert([
          {
            fecha: formData.fecha,
            lugar: formData.lugar.trim(),
            cliente: formData.cliente.trim() || null,
            total: total,
            anticipo_recibido: anticipo,
            contrato_firmado: formData.contrato_firmado,
            estado: estadoFinal,
            creado_por: miembro.id
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating evento:', error)
        setError('Error al crear el evento: ' + error.message)
        setLoading(false)
        return
      }

      setSuccess('¡Evento creado exitosamente!')
      
      // Redirigir al detalle del evento creado después de 1.5 segundos
      setTimeout(() => {
        router.push(`/admin/eventos/${data.id}`)
      }, 1500)

    } catch (error) {
      console.error('Error creating evento:', error)
      setError('Error inesperado al crear el evento')
      setLoading(false)
    }
  }

  // ✅ CORREGIDO: Cambié 'any' por tipos específicos
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpiar mensajes al cambiar campos
    if (error) setError('')
    if (success) setSuccess('')
  }

  if (miembro?.estado !== 'activo') {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaExclamationTriangle className="text-3xl text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-700 mb-4">
          Acceso Restringido
        </h1>
        <p className="text-lg text-slate-600">
          Tu cuenta debe ser activada por un administrador para crear eventos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/eventos"
          className="inline-flex items-center text-slate-600 hover:text-slate-800 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Volver a eventos
        </Link>
        <div className="h-6 w-px bg-slate-300"></div>
        <h1 className="text-3xl font-bold text-slate-700">Nuevo Evento</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Formulario principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-blue-200/50 space-y-6">
            
            {/* Información básica */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-700 border-b border-blue-200 pb-2">
                Información del Evento
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fecha" className="block text-sm font-medium text-slate-700 mb-2">
                    <FaCalendarAlt className="inline mr-2 text-blue-600" />
                    Fecha del evento *
                  </label>
                  <input
                    id="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => handleInputChange('fecha', e.target.value)}
                    className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="lugar" className="block text-sm font-medium text-slate-700 mb-2">
                    <FaMapMarkerAlt className="inline mr-2 text-amber-600" />
                    Lugar del evento *
                  </label>
                  <input
                    id="lugar"
                    type="text"
                    value={formData.lugar}
                    onChange={(e) => handleInputChange('lugar', e.target.value)}
                    className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Ej: Salón Los Pinos, Jalpan de Serra"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cliente" className="block text-sm font-medium text-slate-700 mb-2">
                  <FaUser className="inline mr-2 text-green-600" />
                  Cliente
                </label>
                <input
                  id="cliente"
                  type="text"
                  value={formData.cliente}
                  onChange={(e) => handleInputChange('cliente', e.target.value)}
                  className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Nombre del cliente (opcional)"
                />
              </div>
            </div>

            {/* Información financiera */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-700 border-b border-blue-200 pb-2">
                Información Financiera
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="total" className="block text-sm font-medium text-slate-700 mb-2">
                    <FaDollarSign className="inline mr-2 text-green-600" />
                    Total del evento *
                  </label>
                  <input
                    id="total"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.total}
                    onChange={(e) => handleInputChange('total', e.target.value)}
                    className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="8000.00"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="anticipo" className="block text-sm font-medium text-slate-700 mb-2">
                    <FaDollarSign className="inline mr-2 text-blue-600" />
                    Anticipo recibido
                  </label>
                  <input
                    id="anticipo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.anticipo_recibido}
                    onChange={(e) => handleInputChange('anticipo_recibido', e.target.value)}
                    className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="0.00"
                  />
                  {formData.total && (
                    <p className="text-sm text-slate-600 mt-1">
                      {anticipoPorcentaje.toFixed(1)}% del total
                      {anticipoPorcentaje >= 40 && (
                        <span className="text-green-600 font-medium"> ✓ Anticipo suficiente</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Estado y contrato */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-700 border-b border-blue-200 pb-2">
                Estado y Contrato
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="contrato"
                    type="checkbox"
                    checked={formData.contrato_firmado}
                    onChange={(e) => handleInputChange('contrato_firmado', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="contrato" className="ml-3 text-sm font-medium text-slate-700">
                    <FaFileContract className="inline mr-2 text-blue-600" />
                    Contrato firmado
                    {debeContratoObligatorio && (
                      <span className="text-red-600 font-bold"> *OBLIGATORIO</span>
                    )}
                  </label>
                </div>

                {!anticipoSuficiente && (
                  <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-slate-700 mb-2">
                      Estado inicial
                    </label>
                    <select
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => handleInputChange('estado', e.target.value)}
                      className="px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="tentativo">Tentativo</option>
                      <option value="confirmado">Confirmado</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Mensajes */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
                <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
                <FaCheckCircle className="mr-2 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-700 hover:to-slate-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:scale-105 border-2 border-amber-400/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <FaSave className="mr-2" />
                    Crear Evento
                  </span>
                )}
              </button>
              
              <Link
                href="/admin/eventos"
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 text-center"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>

        {/* Panel de ayuda */}
        <div className="space-y-6">
          {/* Reglas de negocio */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-amber-800 mb-4">📋 Reglas Importantes</h3>
            <div className="space-y-3 text-sm text-amber-700">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p><strong>Anticipo ≥ 40%:</strong> El contrato debe firmarse obligatoriamente</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                {/* ✅ CORREGIDO: Escapé las comillas */}
                <p><strong>Anticipo &lt; 40%:</strong> Se puede agendar sin contrato si todos están de acuerdo</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                {/* ✅ CORREGIDO: Escapé las comillas */}
                <p><strong>Estado automático:</strong> Si el anticipo es ≥ 40%, el evento se marca como &ldquo;Confirmado&rdquo;</p>
              </div>
            </div>
          </div>

          {/* Vista previa de cálculos */}
          {formData.total && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-800 mb-4">💰 Cálculos</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Total del evento:</span>
                  <span className="font-bold text-blue-800">
                    ${parseFloat(formData.total || '0').toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Anticipo recibido:</span>
                  <span className="font-bold text-blue-800">
                    ${parseFloat(formData.anticipo_recibido || '0').toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Porcentaje de anticipo:</span>
                  <span className={`font-bold ${anticipoPorcentaje >= 40 ? 'text-green-600' : 'text-blue-800'}`}>
                    {anticipoPorcentaje.toFixed(1)}%
                  </span>
                </div>
                <div className="border-t border-blue-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Pendiente por cobrar:</span>
                    <span className="font-bold text-blue-800">
                      ${(parseFloat(formData.total || '0') - parseFloat(formData.anticipo_recibido || '0')).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Estado del evento */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-blue-200/50">
            <h3 className="text-lg font-bold text-slate-700 mb-4">📊 Estado del Evento</h3>
            <div className="space-y-2 text-sm">
              <div className={`p-3 rounded-lg border ${anticipoSuficiente ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <p className={`font-medium ${anticipoSuficiente ? 'text-green-800' : 'text-yellow-800'}`}>
                  {anticipoSuficiente ? '✅ Evento confirmado automáticamente' : '⏳ Evento tentativo'}
                </p>
                <p className={`text-xs mt-1 ${anticipoSuficiente ? 'text-green-600' : 'text-yellow-600'}`}>
                  {anticipoSuficiente 
                    ? 'El anticipo es suficiente (≥40%) y se requiere contrato'
                    : 'El anticipo es menor al 40%, se puede agendar sin contrato'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}