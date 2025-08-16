'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { 
  FaUsers, FaUserPlus, FaUserShield, FaUserCheck, FaUserTimes, 
  FaUserEdit, FaEye, FaCrown, FaExclamationTriangle, FaCheckCircle, 
  FaTimes, FaEnvelope, FaClock, FaFilter, FaSearch, FaSort,
  FaUserCog, FaBan, FaPlay, FaPause
} from 'react-icons/fa'

interface Usuario {
  id: string
  user_id: string | null
  nombre: string
  rol: 'admin' | 'miembro' | 'visor'
  estado: 'pendiente' | 'activo' | 'suspendido'
  creado_en: string
  email?: string
}

export default function UsuariosPage() {
  const { miembro } = useAuth()
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRol, setFilterRol] = useState<string>('todos')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [sortBy, setSortBy] = useState<'nombre' | 'creado_en' | 'rol' | 'estado'>('creado_en')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Estados para modals
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [editForm, setEditForm] = useState({
    nombre: '',
    rol: 'miembro' as 'admin' | 'miembro' | 'visor',
    estado: 'activo' as 'pendiente' | 'activo' | 'suspendido'
  })

  useEffect(() => {
    if (miembro?.rol === 'admin') {
      loadUsuarios()
    }
  }, [miembro])

  useEffect(() => {
    // Aplicar filtros y búsqueda
    let filtered = usuarios.filter(usuario => {
      const matchesSearch = usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (usuario.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      
      const matchesRol = filterRol === 'todos' || usuario.rol === filterRol
      const matchesEstado = filterEstado === 'todos' || usuario.estado === filterEstado
      
      return matchesSearch && matchesRol && matchesEstado
    })

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'nombre':
          aValue = a.nombre.toLowerCase()
          bValue = b.nombre.toLowerCase()
          break
        case 'creado_en':
          aValue = new Date(a.creado_en)
          bValue = new Date(b.creado_en)
          break
        case 'rol':
          aValue = a.rol
          bValue = b.rol
          break
        case 'estado':
          aValue = a.estado
          bValue = b.estado
          break
        default:
          aValue = a.nombre
          bValue = b.nombre
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredUsuarios(filtered)
  }, [usuarios, searchTerm, filterRol, filterEstado, sortBy, sortOrder])

  const loadUsuarios = async () => {
    try {
      // Obtener usuarios con su información de auth
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('miembros')
        .select('*')
        .order('creado_en', { ascending: false })

      if (usuariosError) {
        setError('Error al cargar usuarios')
        console.error(usuariosError)
        return
      }

      // Obtener emails de auth.users para los usuarios que tienen user_id
      const usuariosConEmail = await Promise.all(
        (usuariosData || []).map(async (usuario) => {
          if (usuario.user_id) {
            try {
              const { data: authData } = await supabase
                .from('auth.users')
                .select('email')
                .eq('id', usuario.user_id)
                .single()
              
              return {
                ...usuario,
                email: authData?.email || 'Sin email'
              }
            } catch {
              return {
                ...usuario,
                email: 'Sin email'
              }
            }
          }
          return {
            ...usuario,
            email: 'Sin vinculación'
          }
        })
      )

      setUsuarios(usuariosConEmail)

    } catch (error) {
      console.error('Error loading usuarios:', error)
      setError('Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingUsuario) return

    try {
      const { error } = await supabase
        .from('miembros')
        .update({
          nombre: editForm.nombre.trim(),
          rol: editForm.rol,
          estado: editForm.estado
        })
        .eq('id', editingUsuario.id)

      if (error) {
        setError('Error al actualizar usuario')
        return
      }

      setSuccess('Usuario actualizado exitosamente')
      setShowEditModal(false)
      setEditingUsuario(null)
      loadUsuarios()

    } catch (error) {
      console.error('Error updating usuario:', error)
      setError('Error al actualizar usuario')
    }
  }

  const handleQuickAction = async (usuarioId: string, action: 'activar' | 'suspender' | 'hacer_admin' | 'hacer_miembro') => {
    try {
      let updateData: any = {}
      
      switch (action) {
        case 'activar':
          updateData = { estado: 'activo' }
          break
        case 'suspender':
          updateData = { estado: 'suspendido' }
          break
        case 'hacer_admin':
          updateData = { rol: 'admin', estado: 'activo' }
          break
        case 'hacer_miembro':
          updateData = { rol: 'miembro' }
          break
      }

      const { error } = await supabase
        .from('miembros')
        .update(updateData)
        .eq('id', usuarioId)

      if (error) {
        setError('Error al realizar la acción')
        return
      }

      setSuccess('Acción realizada exitosamente')
      loadUsuarios()

    } catch (error) {
      console.error('Error en acción rápida:', error)
      setError('Error al realizar la acción')
    }
  }

  const openEditModal = (usuario: Usuario) => {
    setEditingUsuario(usuario)
    setEditForm({
      nombre: usuario.nombre,
      rol: usuario.rol,
      estado: usuario.estado
    })
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingUsuario(null)
  }

  const getRolIcon = (rol: string) => {
    switch (rol) {
      case 'admin': return <FaCrown className="text-yellow-500" />
      case 'miembro': return <FaUserCheck className="text-blue-500" />
      case 'visor': return <FaEye className="text-gray-500" />
      default: return <FaUsers className="text-gray-400" />
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activo': return <FaCheckCircle className="text-green-500" />
      case 'pendiente': return <FaClock className="text-yellow-500" />
      case 'suspendido': return <FaBan className="text-red-500" />
      default: return <FaExclamationTriangle className="text-gray-400" />
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'bg-green-100 text-green-800 border-green-200'
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'suspendido': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'admin': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'miembro': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'visor': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Verificar si el usuario actual es admin
  if (miembro?.rol !== 'admin') {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaExclamationTriangle className="text-3xl text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-700 mb-4">Acceso Denegado</h1>
        <p className="text-slate-600">Solo los administradores pueden gestionar usuarios</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full animate-pulse mb-4 mx-auto"></div>
          <p className="text-slate-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-700 flex items-center">
            <FaUsers className="mr-3 text-indigo-600" />
            Gestión de Usuarios
          </h1>
          <p className="text-slate-600">Administra miembros, roles y permisos del grupo</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">
            {filteredUsuarios.length} de {usuarios.length} usuarios
          </span>
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

      {/* Filtros y búsqueda */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-indigo-200/50">
        <div className="grid lg:grid-cols-5 gap-4">
          {/* Búsqueda */}
          <div className="lg:col-span-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Filtro por rol */}
          <div>
            <select
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todos">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="miembro">Miembros</option>
              <option value="visor">Visores</option>
            </select>
          </div>

          {/* Filtro por estado */}
          <div>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="pendiente">Pendientes</option>
              <option value="suspendido">Suspendidos</option>
            </select>
          </div>

          {/* Ordenamiento */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field as any)
                setSortOrder(order as any)
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="creado_en-desc">Más recientes</option>
              <option value="creado_en-asc">Más antiguos</option>
              <option value="nombre-asc">Nombre A-Z</option>
              <option value="nombre-desc">Nombre Z-A</option>
              <option value="rol-asc">Rol</option>
              <option value="estado-asc">Estado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      {filteredUsuarios.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUsers className="text-2xl text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            {usuarios.length === 0 ? 'No hay usuarios registrados' : 'No se encontraron usuarios'}
          </h3>
          <p className="text-slate-600">
            {usuarios.length === 0 
              ? 'Los usuarios aparecerán aquí cuando se registren'
              : 'Intenta ajustar los filtros de búsqueda'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredUsuarios.map((usuario) => (
            <div key={usuario.id} className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow border border-indigo-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {usuario.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-slate-700">{usuario.nombre}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRolColor(usuario.rol)}`}>
                        {getRolIcon(usuario.rol)}
                        <span className="ml-1 capitalize">{usuario.rol}</span>
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(usuario.estado)}`}>
                        {getEstadoIcon(usuario.estado)}
                        <span className="ml-1 capitalize">{usuario.estado}</span>
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <FaEnvelope className="mr-1" />
                      <span className="mr-4">{usuario.email}</span>
                      <FaClock className="mr-1" />
                      <span>Registrado {formatDate(usuario.creado_en)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Acciones rápidas */}
                  {usuario.estado === 'pendiente' && (
                    <button
                      onClick={() => handleQuickAction(usuario.id, 'activar')}
                      className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      title="Activar usuario"
                    >
                      <FaPlay className="mr-1" />
                      Activar
                    </button>
                  )}
                  
                  {usuario.estado === 'activo' && usuario.rol !== 'admin' && (
                    <button
                      onClick={() => handleQuickAction(usuario.id, 'hacer_admin')}
                      className="inline-flex items-center bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      title="Hacer administrador"
                    >
                      <FaCrown className="mr-1" />
                      Admin
                    </button>
                  )}

                  {usuario.estado === 'activo' && (
                    <button
                      onClick={() => handleQuickAction(usuario.id, 'suspender')}
                      className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      title="Suspender usuario"
                    >
                      <FaPause className="mr-1" />
                      Suspender
                    </button>
                  )}

                  <button
                    onClick={() => openEditModal(usuario)}
                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                    title="Editar usuario"
                  >
                    <FaUserEdit className="mr-1" />
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && editingUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-slate-700 mb-4">
              Editar Usuario: {editingUsuario.nombre}
            </h3>
            <form onSubmit={handleUpdateUsuario} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rol</label>
                <select
                  value={editForm.rol}
                  onChange={(e) => setEditForm({...editForm, rol: e.target.value as any})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="visor">Visor</option>
                  <option value="miembro">Miembro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
                <select
                  value={editForm.estado}
                  onChange={(e) => setEditForm({...editForm, estado: e.target.value as any})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="activo">Activo</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Actualizar
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}