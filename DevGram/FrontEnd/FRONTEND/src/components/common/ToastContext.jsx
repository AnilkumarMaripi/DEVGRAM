import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', durationMs = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, durationMs)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const isError = toast.type === 'error'
          const isSuccess = toast.type === 'success'

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                padding: '12px 18px',
                borderRadius: '10px',
                background: isError ? '#450a0a' : isSuccess ? '#052e16' : '#18181b',
                color: isError ? '#fca5a5' : isSuccess ? '#86efac' : '#ffffff',
                border: isError ? '1px solid #991b1b' : isSuccess ? '1px solid #166534' : '1px solid #27272a',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                animation: 'slideUp 0.2s ease-out',
              }}
            >
              <span>{isError ? '⚠️ ' : isSuccess ? '✅ ' : 'ℹ️ '}{toast.message}</span>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  opacity: 0.7,
                  padding: 0,
                  marginLeft: '8px'
                }}
              >
                &times;
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // Fallback if rendered outside provider
    return {
      showToast: (msg) => console.log('[Toast]', msg),
      removeToast: () => {},
    }
  }
  return context
}

