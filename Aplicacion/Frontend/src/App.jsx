import React from 'react'
import { useLocation } from 'react-router-dom'
import AppRouter from './router/AppRouter'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './context/AuthContext'
import useWebSocket from './hooks/useWebSocket'

function App() {
  const { user } = useAuth()
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'
  
  // Conectar WebSocket si el usuario está autenticado
  const { isConnected, notifications } = useWebSocket()

  return (
    <>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{
          zIndex: 99999,
          top: 20
        }}
        toastOptions={{
          duration: 6000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            padding: '20px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            maxWidth: '500px',
            minWidth: '300px',
          },
          success: {
            duration: 4000,
            style: {
              background: '#10b981',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          error: {
            duration: 15000, // 15 segundos para errores
            style: {
              background: '#ef4444',
              color: '#fff',
              fontSize: '18px',
              fontWeight: '700',
              border: '4px solid #dc2626',
              boxShadow: '0 10px 50px rgba(239, 68, 68, 0.4)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
        }}
      />
      
      {user && !isLoginPage ? (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden transition-colors duration-200">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
              <div className="container mx-auto px-6 py-8 max-w-7xl">
                <AppRouter />
              </div>
            </main>
          </div>
        </div>
      ) : (
        <AppRouter />
      )}
    </>
  )
}

export default App

