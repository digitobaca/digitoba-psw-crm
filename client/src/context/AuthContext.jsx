import { createContext, useCallback, useEffect, useState } from 'react';
import * as api from '@/lib/api';

export const AuthContext = createContext(null);

/**
 * Holds the logged-in team member (if any) plus their currently open shift —
 * login doubles as "Shift Start" and logout as "Shift End" for the
 * attendance system (see server/models/Attendance.js). On mount it checks
 * the HTTP-only cookie via GET /auth/me so a page refresh doesn't lose the
 * session or the shift-start time shown in the header.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .fetchMe()
      .then((res) => {
        setUser(res.user);
        setShift(res.shift);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email, password) => {
    const res = await api.login(email, password);
    setUser(res.user);
    setShift(res.shift);
    return res.user;
  }, []);

  /** Ends the shift (with the "what did you get done today" summary) and logs out. */
  const signOut = useCallback(async (summary) => {
    await api.logout(summary).catch(() => {});
    setUser(null);
    setShift(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, shift, loading, signIn, signOut, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
