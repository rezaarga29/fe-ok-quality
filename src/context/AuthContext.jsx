import { createContext, useContext, useState, useEffect } from "react";
import { getSession } from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,          setUser]          = useState(null);
  const [isAdmin,       setIsAdmin]       = useState(false);
  const [isDoctor,      setIsDoctor]      = useState(false);
  const [canKesimpulan, setCanKesimpulan] = useState(false);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const session = await getSession();
      setUser(session.user            ?? null);
      setIsAdmin(session.is_admin       ?? false);
      setIsDoctor(session.is_doctor      ?? false);
      setCanKesimpulan(session.can_kesimpulan ?? false);
    } catch {
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const clearUser = () => {
    setUser(null);
    setIsAdmin(false);
    setIsDoctor(false);
    setCanKesimpulan(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isDoctor, canKesimpulan, loading, loadUser, clearUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
