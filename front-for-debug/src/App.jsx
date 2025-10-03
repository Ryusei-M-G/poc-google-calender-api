import Calendar from './Calendar.jsx';
import { useAuth } from './auth/AuthProvider.jsx';

function App() {
  const { isAuthenticated } = useAuth();

  const onClickHandle = () => {
    window.location.href = 'http://localhost:3000/auth';
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      {!isAuthenticated.current && (
        <button onClick={onClickHandle}>Googleでログイン</button>
      )}
      {isAuthenticated.current && <Calendar />}
    </div>
  )
}

export default App
