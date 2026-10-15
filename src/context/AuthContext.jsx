import { createContext, useContext, useState, useEffect } from "react";
import { getSession } from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,          setUser]          = useState(null);
  const [isAdmin,       setIsAdmin]       = useState(false);
  const [isDoctor,      setIsDoctor]      = useState(false);
  const [canKesimpulan, setCanKesimpulan] = useState(false);
  const [canNotes,      setCanNotes]      = useState(false); // role ok-quality-notes
  const [isStaffRanap,  setIsStaffRanap]  = useState(false); // role staff-ranap (hanya isi luka ranap)
  const [canLukaRanap,  setCanLukaRanap]  = useState(false); // boleh isi luka ranap (staff-ranap / admin)
  const [hasStaffRanap, setHasStaffRanap] = useState(false); // punya role staff-ranap → tombol Edit disembunyikan
  const [loading,       setLoading]       = useState(true);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const session = await getSession();
      setUser(session.user            ?? null);
      setIsAdmin(session.is_admin       ?? false);
      setIsDoctor(session.is_doctor      ?? false);
      setCanKesimpulan(session.can_kesimpulan ?? false);
      setCanNotes(session.can_notes ?? false);
      setIsStaffRanap(session.is_staff_ranap ?? false);
      setCanLukaRanap(session.can_luka_ranap ?? session.is_staff_ranap ?? false);
      setHasStaffRanap(session.has_staff_ranap ?? session.is_staff_ranap ?? false);
    } catch {
      setUser(null);
      setIsAdmin(false);
      setIsStaffRanap(false);
      setCanLukaRanap(false);
      setHasStaffRanap(false);
    } finally {
      setLoading(false);
    }
  };

  const clearUser = () => {
    setUser(null);
    setIsAdmin(false);
    setIsDoctor(false);
    setCanKesimpulan(false);
    setCanNotes(false);
    setIsStaffRanap(false);
    setCanLukaRanap(false);
    setHasStaffRanap(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isDoctor, canKesimpulan, canNotes, isStaffRanap, canLukaRanap, hasStaffRanap, loading, loadUser, clearUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
