import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("token") || null;
    } catch (error) {
      console.warn("Failed to access localStorage:", error);
      return null;
    }
  });
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          // Validate user data structure
          if (data && typeof data === 'object') {
            setUser(data);
          } else {
            console.error("Invalid user data received:", data);
            setUser(null);
          }
        } else {
          console.error("Failed to fetch user:", res.status, res.statusText);
          setUser(null);
          
          // If token is invalid, clear it
          if (res.status === 401) {
            logout();
          }
        }
      } catch (err) {
        console.error("Error fetching user:", err.message);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [token, API_BASE]);

  const login = (newToken) => {
    if (!newToken || typeof newToken !== 'string') {
      console.error("Invalid token provided to login");
      return;
    }

    try {
      localStorage.setItem("token", newToken);
      setToken(newToken);
    } catch (error) {
      console.error("Failed to save token to localStorage:", error);
      // Still set token in state even if localStorage fails
      setToken(newToken);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("token");
    } catch (error) {
      console.warn("Failed to remove token from localStorage:", error);
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ 
        token, 
        user, 
        login, 
        logout, 
        isAuthenticated: !!token,
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};