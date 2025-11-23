import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services/storage';

export type UserRole = 'admin' | 'staff' | 'employee';

export type User = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
};

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string, role: UserRole) => {
    try {
      const user = userService.validateCredentials(username, password);
      
      // Check if user exists and has the correct role
      if (user && user.role === role) {
        // Remove password before storing in state
        const { password: _, ...userData } = user;
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setUser(userData);
        return true;
      }
      
      // If user exists but wrong role, don't reveal that in the error message
      if (user) {
        console.warn(`User ${username} exists but has role ${user.role}, expected ${role}`);
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
