import { useContext } from 'react';
import { ConsultationModalContext } from '@/context/ConsultationModalContext.jsx';

export function useConsultationModal() {
  const ctx = useContext(ConsultationModalContext);
  if (!ctx) throw new Error('useConsultationModal must be used within a ConsultationModalProvider');
  return ctx;
}
