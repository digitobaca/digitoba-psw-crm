import { useContext } from 'react';
import { PortalAuthContext } from '@/context/PortalAuthContext.jsx';

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error('usePortalAuth must be used within a PortalAuthProvider');
  return ctx;
}
