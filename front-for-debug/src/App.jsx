import Calendar from './Calendar.jsx';
import { useAuth } from './auth/AuthProvider.jsx';

function App() {
  const { isAuthenticated, loading } = useAuth();

  const onClickHandle = () => {
    window.location.href = 'http://localhost:3000/auth';
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      {loading && (
        <div>認証状態を確認中...</div>
      )}
      {!loading && !isAuthenticated.current && (
        <button onClick={onClickHandle}>Googleでログイン</button>
      )}
      {!loading && isAuthenticated.current && <Calendar />}
    </div>
  )
}

export default App
