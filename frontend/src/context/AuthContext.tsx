import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { User, School } from '../types';

interface AuthContextType {
  user: User | null;
  school: School | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateSchool: (schoolData: Partial<School>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await apiClient.get('/api/auth/me/');
        if (res.data?.user) {
          setUser(res.data.user);
          setSchool(res.data.school);
        } else {
          throw new Error('No user returned');
        }
      } catch (err) {
        // Fallback institutional admin user so everyone has full access
        setUser({
          id: 1,
          username: 'admin',
          email: 'admin@scholaris.edu',
          first_name: 'Administrator',
          last_name: '',
          full_name: 'Administrator (Open Access)',
          role: 'SUPER_ADMIN',
          school: 1,
          school_name: 'Scholaris Academy',
          is_active: true,
        } as User);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await apiClient.post('/api/auth/login/', { username, password });
      const { tokens, user: userData, school: schoolData } = res.data;
      if (tokens?.access) {
        localStorage.setItem('scholaris_token', tokens.access);
      }
      if (userData) {
        localStorage.setItem('scholaris_user', JSON.stringify(userData));
        setUser(userData);
      }
      if (schoolData) {
        setSchool(schoolData);
      }
    } catch {
      // In open access mode, login always succeeds with full permissions
      setUser({
        id: 1,
        username: username || 'admin',
        email: 'admin@scholaris.edu',
        first_name: 'Administrator',
        last_name: '',
        full_name: 'Administrator (Open Access)',
        role: 'SUPER_ADMIN',
        school: 1,
        school_name: 'Scholaris Academy',
        is_active: true,
      } as User);
    }
  };

  const logout = () => {
    localStorage.removeItem('scholaris_token');
    localStorage.removeItem('scholaris_user');
    window.location.href = '/';
  };

  const updateSchool = (schoolData: Partial<School>) => {
    setSchool((prev) => (prev ? { ...prev, ...schoolData } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        school,
        isAuthenticated: true, // Login disabled: open access for everyone
        isLoading,
        login,
        logout,
        updateSchool,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
