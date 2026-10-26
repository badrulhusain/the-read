import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, getToken } from './api';
import type { Author } from './types';

interface AuthCtx {
  user: Author | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    auth.me()
      .then(setUser)
      .catch(() => { auth.logout(); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const u = await auth.login(email, password);
    setUser(u);
  };

  const register = async (name: string, email: string, password: string) => {
    const u = await auth.register(name, email, password);
    setUser(u);
  };

  const logout = () => {
    auth.logout();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
