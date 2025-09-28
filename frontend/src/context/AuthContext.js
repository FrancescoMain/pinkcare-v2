import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/authService';

const AuthContext = createContext(null);

// Helper function to determine primary user role from roles array
const determineUserRole = (roles) => {
  if (!roles || !Array.isArray(roles)) return 'USER';

  // Priority order: ADMIN > BUSINESS > USER
  const roleNames = roles.map(role => role.nome || role.name);

  if (roleNames.includes('ROLE_ADMIN')) return 'ADMIN';
  if (roleNames.includes('ROLE_BUSINESS')) return 'BUSINESS';
  if (roleNames.includes('ROLE_USER')) return 'USER';

  return 'USER'; // Default fallback
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = AuthService.getToken();
        if (token) {
          // Verify token is still valid
          const response = await AuthService.verifyToken();
          if (response?.user) {
            // Normalize user data on automatic login too
            const normalizedUser = {
              ...response.user,
              role: determineUserRole(response.user.roles)
            };
            setUser(normalizedUser);
            setIsAuthenticated(true);
          } else {
            AuthService.removeToken();
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        AuthService.removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await AuthService.login(email, password, rememberMe);
      if (response?.token && response?.user) {
        AuthService.setToken(response.token);

        // Normalize user data - convert roles array to primary role
        const normalizedUser = {
          ...response.user,
          role: determineUserRole(response.user.roles)
        };

        setUser(normalizedUser);
        setIsAuthenticated(true);

        // Return normalized response for the Login component
        return {
          ...response,
          user: normalizedUser
        };
      }
      throw new Error('Invalid response');
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = () => {
    AuthService.removeToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};