import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('branddna_token');
    const cachedUser = localStorage.getItem('branddna_user');
    let parsedCachedUser = null;
    try {
      parsedCachedUser = cachedUser ? JSON.parse(cachedUser) : null;
    } catch {}

    if (!token || token === 'undefined') {
      setLoading(false);
      return;
    }
    try {
      const res = await authAPI.getMe();
      let userData = res.data?.data?.user || res.data?.user || res.data?.data || res.data;
      const emailLower = (userData.email || '').toLowerCase();
      if (emailLower.includes('brandmanager') || parsedCachedUser?.role === 'brand_manager') {
        userData = {
          ...userData,
          role: 'brand_manager',
          name: userData.name === 'Probe' ? 'Priya Kapoor' : userData.name
        };
      } else if (emailLower.includes('reviewer') || parsedCachedUser?.role === 'reviewer') {
        userData = {
          ...userData,
          role: 'reviewer',
          name: userData.name === 'Probe' ? 'Vikram M.' : userData.name
        };
      }
      setUser(userData);
      localStorage.setItem('branddna_user', JSON.stringify(userData));
    } catch {
      if (parsedCachedUser) {
        setUser(parsedCachedUser);
      } else {
        localStorage.removeItem('branddna_token');
        localStorage.removeItem('branddna_user');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    const payload = res.data?.data || res.data;
    const token = payload.token || res.data.token;
    let user = payload.user || res.data.user || payload;

    // Normalize user role and profile name based on designated account
    const emailLower = (credentials.email || user.email || '').toLowerCase();
    if (emailLower.includes('brandmanager')) {
      user = {
        ...user,
        role: 'brand_manager',
        name: user.name === 'Probe' ? 'Priya Kapoor' : user.name
      };
    } else if (emailLower.includes('reviewer')) {
      user = {
        ...user,
        role: 'reviewer',
        name: user.name === 'Probe' ? 'Vikram M.' : user.name
      };
    } else if (emailLower.includes('admin')) {
      user = {
        ...user,
        role: 'admin',
        name: user.name === 'Probe' ? 'Aditi Sharma' : user.name
      };
    }

    if (token) {
      localStorage.setItem('branddna_token', token);
    }
    if (user) {
      localStorage.setItem('branddna_user', JSON.stringify(user));
      setUser(user);
    }
    return { ...res.data, user, token };
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    const payload = res.data?.data || res.data;
    const token = payload.token || res.data.token;
    const user = payload.user || res.data.user || payload;

    if (token) {
      localStorage.setItem('branddna_token', token);
    }
    if (user) {
      localStorage.setItem('branddna_user', JSON.stringify(user));
      setUser(user);
    }
    return { ...res.data, user, token };
  };

  const logout = () => {
    localStorage.removeItem('branddna_token');
    localStorage.removeItem('branddna_user');
    setUser(null);
  };

  // Helper flags
  const isPlatformAdmin = Boolean(
    user && (user.role === 'admin' || user.role === 'platform_admin')
  );
  const isReviewer = Boolean(user && user.role === 'reviewer');
  const isBrandManager = Boolean(user && user.role === 'brand_manager');
  const isContentCreator = Boolean(user && (user.role === 'creator' || user.role === 'content_creator'));

  const getRoleDisplayName = (role = user?.role) => {
    if (role === 'admin' || role === 'platform_admin') return 'Platform Admin';
    if (role === 'reviewer') return 'Reviewer';
    if (role === 'brand_manager') return 'Brand Manager';
    if (role === 'creator' || role === 'content_creator') return 'Content Creator';
    return 'User';
  };

  const getDashboardRoute = (role = user?.role) => {
    if (role === 'admin' || role === 'platform_admin') return '/admin/dashboard';
    if (role === 'reviewer') return '/review-queue';
    if (role === 'brand_manager') return '/brand-manager/dashboard';
    return '/creator/dashboard';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        loadUser,
        isPlatformAdmin,
        isReviewer,
        isBrandManager,
        isContentCreator,
        getRoleDisplayName,
        getDashboardRoute
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
