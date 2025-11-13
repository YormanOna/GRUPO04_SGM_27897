import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import citaService from '../services/citaService'
import recetaService from '../services/recetaService'
import { getMedicamentos } from '../services/medicamentoService'

export const useNotifications = () => {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotificationCount = async () => {
    if (!user) return

    setLoading(true)
    try {
      const hoy = new Date().toISOString().split('T')[0]
      let count = 0

      if (user?.cargo === 'Enfermero' || user?.cargo === 'Enfermera') {
        // Contar citas confirmadas del día
        const citasResponse = await citaService.listar({ fecha: hoy, estado: 'confirmada' })
        count = (citasResponse.data || []).length
      }

      if (user?.cargo === 'Medico' || user?.cargo === 'Médico') {
        // Contar pacientes listos para consulta
        const citasResponse = await citaService.listar({ 
          fecha: hoy, 
          estado: 'en_consulta',
          medico_id: user.id 
        })
        count = (citasResponse.data || []).length
      }

      if (user?.cargo === 'Farmaceutico' || user?.cargo === 'Farmacéutico') {
        // Contar recetas pendientes
        const recetasResponse = await recetaService.listarRecetas({ estado: 'pendiente' })
        const recetasPendientes = (recetasResponse.data || []).length

        // Contar medicamentos sin stock
        const medicamentos = await getMedicamentos()
        const stockAgotado = medicamentos.filter(m => m.stock === 0).length

        count = recetasPendientes + stockAgotado
      }

      setUnreadCount(count)
    } catch (error) {
      console.error('Error fetching notification count:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotificationCount()
      
      // Actualizar cada 30 segundos
      const interval = setInterval(fetchNotificationCount, 30000)
      
      return () => clearInterval(interval)
    }
  }, [user])

  return { unreadCount, loading, refresh: fetchNotificationCount }
}
