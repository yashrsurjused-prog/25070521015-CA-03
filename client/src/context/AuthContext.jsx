import { useCallback, useEffect, useMemo, useState } from 'react';

import api, { getApiErrorMessage } from '../services/api';
import AuthContext from './authContextValue';

const TOKEN_KEY = 'smartcampus_token';
const USER_KEY = 'smartcampus_user';

function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem(USER_KEY);

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

function storeAuth(token, user) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }

    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()));
  const [authError, setAuthError] = useState(null);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthError(null);
    storeAuth(null, null);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const storedToken = getStoredToken();

    if (!storedToken) {
      clearAuth();
      setLoading(false);
      return null;
    }

    try {
      const response = await api.get('/api/auth/me');
      const currentUser = response.data?.user || null;

      if (!currentUser) {
        throw new Error('Session response was missing user data.');
      }

      setToken(storedToken);
      setUser(currentUser);
      setAuthError(null);
      storeAuth(storedToken, currentUser);
      return currentUser;
    } catch {
      clearAuth();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    let cancelled = false;

    if (!getStoredToken()) {
      return undefined;
    }

    const restoreSession = async () => {
      try {
        const response = await api.get('/api/auth/me');
        const currentUser = response.data?.user;

        if (!currentUser) {
          throw new Error('Session response was missing user data.');
        }

        if (cancelled) {
          return;
        }

        const storedToken = getStoredToken();
        setToken(storedToken);
        setUser(currentUser);
        setAuthError(null);
        storeAuth(storedToken, currentUser);
      } catch {
        if (!cancelled) {
          clearAuth();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [clearAuth]);

  const login = useCallback(async (credentials) => {
    setAuthError(null);

    try {
      const response = await api.post('/api/auth/login', credentials);
      const { token: receivedToken, user: receivedUser } = response.data || {};

      if (!receivedToken || !receivedUser) {
        throw new Error('Login response was missing authentication data.');
      }

      setToken(receivedToken);
      setUser(receivedUser);
      storeAuth(receivedToken, receivedUser);

      return { token: receivedToken, user: receivedUser };
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to log in.');

      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setAuthError(null);

    try {
      const response = await api.post('/api/auth/register', payload);
      const receivedUser = response.data?.user || null;

      return { user: receivedUser, message: response.data?.message };
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to register.');

      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      authError,
      isAuthenticated: Boolean(token && user),
      isStudent: user?.role === 'student',
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      clearAuthError: () => setAuthError(null),
      refreshUser: fetchCurrentUser,
    }),
    [authError, fetchCurrentUser, loading, login, logout, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthProvider };
