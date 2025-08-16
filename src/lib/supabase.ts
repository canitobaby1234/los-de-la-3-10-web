import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para las tablas
export interface Miembro {
  id: string
  user_id: string
  nombre: string
  rol: 'admin' | 'miembro' | 'visor'
  estado: 'pendiente' | 'activo' | 'suspendido'
  creado_en: string
}

export interface Evento {
  id: string
  fecha: string
  lugar: string
  cliente: string
  total: number
  anticipo_recibido: number
  contrato_firmado: boolean
  estado: 'tentativo' | 'confirmado' | 'completado' | 'cancelado'
  creado_por: string
}

export interface Gasto {
  id: string
  evento_id: string
  fecha: string
  categoria: 'transporte' | 'chalan' | 'renta_equipo' | 'renta_bodega' | 'compra_equipo' | 'otro'
  monto: number
  notas: string
  creado_por: string
}

export interface IngresoExtra {
  id: string
  evento_id: string
  fecha: string
  categoria: 'renta_audio' | 'renta_iluminacion' | 'otro'
  monto: number
  notas: string
  creado_por: string
}

export interface AhorroLedger {
  id: string
  evento_id: string
  fecha: string
  tipo: 'aporte' | 'retiro' | 'ajuste'
  monto: number
  concepto: string
  creado_por: string
}

export interface EventoBalance {
  id: string
  lugar: string
  fecha: string
  total: number
  anticipo_recibido: number
  gastos_totales: number
  ahorro_aportado: number
  ingresos_extras: number
  neto_evento: number
}

export interface RepartoLote {
  id: string
  evento_id: string
  creado_por: string
  creado_en: string
  estado: 'aplicado' | 'cancelado'
}

export interface Reparto {
  id: string
  evento_id: string
  miembro_id: string
  monto: number
  lote_id: string
  pagado_en: string
}