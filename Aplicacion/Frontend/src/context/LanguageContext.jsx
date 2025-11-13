import React, { createContext, useState, useContext, useEffect } from 'react'

const LanguageContext = createContext()

// Traducciones
const translations = {
  es: {
    // Navegación
    dashboard: 'Panel Principal',
    patients: 'Pacientes',
    appointments: 'Citas',
    consultations: 'Consultas',
    pharmacy: 'Farmacia',
    doctors: 'Médicos',
    nursing: 'Enfermería',
    reports: 'Reportes',
    settings: 'Configuración',
    logout: 'Cerrar Sesión',
    
    // Común
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    search: 'Buscar',
    add: 'Agregar',
    loading: 'Cargando',
    noData: 'No hay datos disponibles',
    actions: 'Acciones',
    
    // Perfil
    myProfile: 'Mi Perfil',
    editProfile: 'Editar Perfil',
    personalInfo: 'Información Personal',
    accountInfo: 'Información de Cuenta',
    changePassword: 'Cambiar Contraseña',
    
    // Notificaciones
    notifications: 'Notificaciones',
    noNotifications: 'No tienes notificaciones',
    markAllRead: 'Marcar todas como leídas',
    
    // Mensajes
    successSave: 'Guardado exitosamente',
    errorSave: 'Error al guardar',
    confirmDelete: '¿Está seguro de eliminar?',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    patients: 'Patients',
    appointments: 'Appointments',
    consultations: 'Consultations',
    pharmacy: 'Pharmacy',
    doctors: 'Doctors',
    nursing: 'Nursing',
    reports: 'Reports',
    settings: 'Settings',
    logout: 'Logout',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    add: 'Add',
    loading: 'Loading',
    noData: 'No data available',
    actions: 'Actions',
    
    // Profile
    myProfile: 'My Profile',
    editProfile: 'Edit Profile',
    personalInfo: 'Personal Information',
    accountInfo: 'Account Information',
    changePassword: 'Change Password',
    
    // Notifications
    notifications: 'Notifications',
    noNotifications: 'You have no notifications',
    markAllRead: 'Mark all as read',
    
    // Messages
    successSave: 'Successfully saved',
    errorSave: 'Error saving',
    confirmDelete: 'Are you sure you want to delete?',
  }
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem('language')
    return savedLang || 'es'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
    document.documentElement.lang = language
  }, [language])

  const t = (key) => {
    return translations[language][key] || key
  }

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang)
    }
  }

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'es' ? 'en' : 'es')
  }

  return (
    <LanguageContext.Provider value={{ 
      language, 
      changeLanguage, 
      toggleLanguage,
      t,
      languages: {
        es: { name: 'Español', flag: '🇪🇸' },
        en: { name: 'English', flag: '🇺🇸' }
      }
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage debe ser usado dentro de LanguageProvider')
  }
  return context
}

export default LanguageContext
