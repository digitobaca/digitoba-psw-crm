import { createContext, useCallback, useEffect, useState } from 'react';
import * as api from '@/lib/api';

export const PortalAuthContext = createContext(null);

/**
 * Mirrors AuthContext but for the student self-service portal — a
 * completely separate session (different cookie, different backend
 * collection) so a counsellor and a student can be logged in simultaneously
 * in the same browser without interfering with each other.
 */
export function PortalAuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .fetchPortalMe()
      .then((res) => setStudent(res.student))
      .catch(() => setStudent(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email, password) => {
    const res = await api.portalLogin(email, password);
    setStudent(res.student);
    return res.student;
  }, []);

  const signOut = useCallback(async () => {
    await api.portalLogout().catch(() => {});
    setStudent(null);
  }, []);

  return (
    <PortalAuthContext.Provider value={{ student, loading, signIn, signOut, isAuthenticated: !!student }}>
      {children}
    </PortalAuthContext.Provider>
  );
}
