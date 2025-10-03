import { createContext, useContext, useEffect, useMemo, useRef } from 'react';

const AuthContext = createContext(null);

const hasSessionCookie = () => {
  if (typeof document === 'undefined') return false;
  // 最低限の検出: 'session=' を含むか
  return /(?:^|;\s*)session=/.test(document.cookie || '');
};

export function AuthProvider({ children }) {
  // useRefで認証状態を保持（再レンダリングを避ける要件に沿う）
  const isAuthenticated = useRef(false);

  useEffect(() => {
    if (hasSessionCookie()) {
      isAuthenticated.current = true;
    }
  }, []);

  const value = useMemo(() => ({ isAuthenticated }), []);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthProvider;

