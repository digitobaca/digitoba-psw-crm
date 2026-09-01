import { createContext, useCallback, useMemo, useState } from 'react';
import ConsultationForm from '@/components/forms/ConsultationForm.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog.jsx';

export const ConsultationModalContext = createContext(null);

/**
 * Global "Book Your Free Consultation" modal. Any component can call
 * openConsultation() (optionally with a default program/source) via the
 * useConsultationModal hook, instead of each CTA managing its own dialog state.
 */
export function ConsultationModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [defaults, setDefaults] = useState({ intendedProgram: '', leadSource: 'consultation_form' });

  const openConsultation = useCallback((options = {}) => {
    setDefaults({
      intendedProgram: options.intendedProgram || '',
      leadSource: options.leadSource || 'consultation_form',
    });
    setOpen(true);
  }, []);

  const closeConsultation = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ openConsultation, closeConsultation }), [openConsultation, closeConsultation]);

  return (
    <ConsultationModalContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Book Your Free Consultation</DialogTitle>
            <DialogDescription>
              Tell us a bit about your goals and a licensed consultant will contact you within 1-2 business days.
            </DialogDescription>
          </DialogHeader>
          <ConsultationForm defaults={defaults} onSuccess={closeConsultation} redirectTo="/psw-canada" />
        </DialogContent>
      </Dialog>
    </ConsultationModalContext.Provider>
  );
}
