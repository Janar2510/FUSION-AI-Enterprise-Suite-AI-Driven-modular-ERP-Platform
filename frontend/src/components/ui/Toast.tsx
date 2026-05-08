import { Toaster } from 'react-hot-toast'

/** Drop-in replacement for the Toaster in App.tsx.
 *  Import this instead of react-hot-toast's Toaster directly. */
export const FusionToaster = () => (
  <Toaster
    position="bottom-right"
    toastOptions={{
      duration: 4000,
      style: {
        background: 'rgba(13, 21, 38, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#f8fafc',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: '13px',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      },
      success: {
        iconTheme: { primary: '#10b981', secondary: '#ffffff' },
        style: { borderColor: 'rgba(16,185,129,0.2)' },
      },
      error: {
        iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
        style: { borderColor: 'rgba(239,68,68,0.2)' },
      },
    }}
  />
)
