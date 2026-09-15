import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { buildUrl, parseErrorBody, ApiError } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true until initial refresh attempt resolves

  // Access token lives in state (so components like Navbar re-render on
  // login/logout) and is mirrored into a ref (so authFetch always reads the
  // current value, even mid-retry, without stale-closure bugs).
  const [accessToken, setAccessTokenState] = useState(null);
  const tokenRef = useRef(null);
  const setAccessToken = (token) => {
    tokenRef.current = token;
    setAccessTokenState(token);
  };

  /**
   * Plain fetch to /auth/refresh. Returns the new access token on success,
   * or null if there's no valid session (401) - caller decides what that means.
   */
  const refresh = useCallback(async () => {
    const res = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    setAccessToken(data.access_token);
    return data.access_token;
  }, []);

  const fetchMe = useCallback(async (token) => {
    const res = await fetch(buildUrl('/auth/me'), {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (!res.ok) return null;
    return res.json();
  }, []);

  // On app load: try to silently restore a session from the refresh cookie.
  useEffect(() => {
    (async () => {
      const token = await refresh().catch(() => null);
      if (token) {
        const me = await fetchMe(token).catch(() => null);
        setUser(me);
      }
      setIsLoading(false);
    })();
  }, [refresh, fetchMe]);

  /**
   * The fetch wrapper every request should go through. Attaches the bearer
   * token if we have one, sends the refresh cookie, and on a 401 tries a
   * single refresh-then-retry before giving up.
   *
   * `auth: 'required' | 'optional' | 'none'` controls whether a 401 triggers
   * the refresh dance at all - game routes take an optional bearer, so a 401
   * there just means "played as guest", not "session expired".
   */
  const authFetch = useCallback(
    async (path, { auth = 'required', ...options } = {}) => {
      const doFetch = (token) => {
        const headers = { ...(options.headers || {}) };
        if (options.body && !headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
        if (token) headers.Authorization = `Bearer ${token}`;
        return fetch(buildUrl(path), {
          ...options,
          headers,
          credentials: 'include',
        });
      };

      let res = await doFetch(tokenRef.current);

      if (res.status === 401 && auth !== 'none') {
        const newToken = await refresh().catch(() => null);
        if (newToken) {
          res = await doFetch(newToken);
        } else if (auth === 'required') {
          setUser(null);
          setAccessToken(null);
        }
        // auth === 'optional': no valid session, just proceed with the
        // (failed) response - caller treats it as "guest".
      }

      if (!res.ok) {
        const parsed = await parseErrorBody(res);
        throw new ApiError(parsed);
      }

      if (res.status === 204) return null;
      return res.json();
    },
    [refresh]
  );

  const login = useCallback(
    async (username, password) => {
      const res = await fetch(buildUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new ApiError(await parseErrorBody(res));
      const data = await res.json();
      setAccessToken(data.access_token);
      const me = await fetchMe(data.access_token).catch(() => null);
      setUser(me);
      return me;
    },
    [fetchMe]
  );

  const register = useCallback(async ({ username, email, password }) => {
    const res = await fetch(buildUrl('/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) throw new ApiError(await parseErrorBody(res));
    return res.json();
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const res = await fetch(buildUrl('/auth/forgot-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new ApiError(await parseErrorBody(res));
    return null; // 204
  }, []);

  const resetPassword = useCallback(async (token, newPassword) => {
    const res = await fetch(buildUrl('/auth/reset-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    if (!res.ok) throw new ApiError(await parseErrorBody(res));
    return null; // 204
  }, []);

  const logout = useCallback(async () => {
    await fetch(buildUrl('/auth/logout'), {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    setUser(null);
    setAccessToken(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    accessToken,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    authFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}