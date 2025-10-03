import { createContext, useRef, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const isAuthenticated = useRef(false);

  useEffect(() => {
    // Cookieにsessionがあるかチェック
    const hasSession = document.cookie.split(';').some(cookie =>
      cookie.trim().startsWith('session=')
    );
    isAuthenticated.current = hasSession;
  }, []);

  return (
    <AuthContext.Provider value={isAuthenticated}>
      {children}
    </AuthContext.Provider>
  );
}
