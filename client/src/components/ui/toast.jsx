import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = React.createContext(null);

/**
 * Lightweight toast system built on Radix Toast. Wrap the app once with
 * <ToastProvider> and call useToast() anywhere to fire a notification —
 * used for form success/error feedback (e.g. lead submission, admin actions).
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const toast = React.useCallback(({ title, description, variant = 'default' }) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, variant, open: true }]);
  }, []);

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            open={t.open}
            onOpenChange={(open) => !open && dismiss(t.id)}
            duration={5000}
            className={cn(
              'grid grid-cols-[1fr_auto] gap-x-3 items-start rounded-lg border p-4 shadow-lg bg-white data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full data-[state=closed]:animate-out data-[state=closed]:fade-out-80',
              t.variant === 'destructive' ? 'border-red-300 bg-red-50' : 'border-gray-200'
            )}
          >
            <div>
              {t.title && (
                <ToastPrimitive.Title className="text-sm font-semibold text-gray-900">{t.title}</ToastPrimitive.Title>
              )}
              {t.description && (
                <ToastPrimitive.Description className="text-sm text-gray-600 mt-1">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-[420px]" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
