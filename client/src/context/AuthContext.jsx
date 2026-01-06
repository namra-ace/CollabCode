import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  // ✅ NEW: Add loading state to prevent premature connections
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchUser = async () => {
      // If no token, we aren't loading anymore
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true); // Ensure loading is true while fetching
        const res = await fetch(`${BACKEND_URL}/api/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data); 
        } else {
          console.error("Failed to fetch user - Token might be invalid");
          setUser(null);
          // ✅ FIX: If token is invalid, clear it so we don't send bad tokens to sockets
          logout(); 
        }
      } catch (err) {
        console.error("Error fetching user:", err.message);
        setUser(null);
      } finally {
        setLoading(false); // ✅ Done loading
      }
    };

    fetchUser();
  }, [token, BACKEND_URL]);

  const login = (token) => {
    localStorage.setItem("token", token);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      // ✅ Expose loading so EditorPage waits for it
      value={{ token, user, login, logout, isAuthenticated: !!token, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);