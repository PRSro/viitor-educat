import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  getUser,
  getToken,
  setToken,
  setUser as storeUser,
  logout as logoutService,
  login as loginService,
  register as registerService,
} from '@/modules/core/services/authService';
import { verifySession, ApiError } from '@/lib/apiClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  // Note: ADMIN role cannot be self-registered - admins must be created via database
  register: (email: string, password: string, role: 'STUDENT' | 'TEACHER') => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount - verify with server
  useEffect(() => {
    const storedUser = getUser();
    const token = getToken();
    
    if (storedUser && token) {
      verifySession()
        .then((verifiedUser) => {
          if (verifiedUser) {
            setUser(verifiedUser as User);
          } else {
            logoutService();
          }
        })
        .catch((error) => {
          if (error instanceof ApiError && error.type === 'unauthorized') {
            logoutService();
          } else {
            setUser(storedUser as User);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await loginService(email, password);
      setToken(response.token);
      storeUser(response.user);
      setUser(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, role: 'STUDENT' | 'TEACHER') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await registerService(email, password, role);
      setToken(response.token);
      storeUser(response.user);
      setUser(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutService();
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
