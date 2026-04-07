import React, { createContext, useContext, useState, useCallback } from "react";
import { api } from "@/services/api";

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ isAuthenticated: false, username: null });

  const login = useCallback(async (username: string, password: string) => {
    const result = await api.login(username, password);
    if (result.success) {
      setState({ isAuthenticated: true, username });
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    setState({ isAuthenticated: false, username: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
