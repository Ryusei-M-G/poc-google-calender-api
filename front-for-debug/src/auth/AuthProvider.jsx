import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const AuthContext = createContext(null);

const hasSessionCookie = () => {
  if (typeof document === 'undefined') return false;
  const raw = document.cookie || '';
  if (!raw) return false;
  // 厳密に名前を判定
  const pairs = raw.split(';').map((s) => s.trim());
  return pairs.some((p) => p.startsWith('session=') || p.startsWith('connect.sid='));
};

export function AuthProvider({ children }) {
  // useRefで認証状態を保持（再レンダリングを避ける要件に沿う）
  const isAuthenticated = useRef(false);
  const [loading, setLoading] = useState(true);
  const [, force] = useState(0); // isAuthenticated変更後に一度だけ再描画させるため

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('http://localhost:3000/auth/me', {
          credentials: 'include'
        });
        if (res.ok) {
          isAuthenticated.current = true;
        } else {
          isAuthenticated.current = false;
        }
      } catch (e) {
        isAuthenticated.current = false;
      } finally {
        setLoading(false);
        // 再描画を促す（refだけだと再描画されない）
        force((x) => x + 1);
      }
    };
    check();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/auth/me', {
        credentials: 'include'
      });
      isAuthenticated.current = res.ok;
    } catch {
      isAuthenticated.current = false;
    } finally {
      setLoading(false);
      force((x) => x + 1);
    }
  };

  const value = useMemo(() => ({ isAuthenticated, loading, refresh }), [loading]);

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
