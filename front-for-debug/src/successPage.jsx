import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider.jsx';

const SuccessPage = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  useEffect(() => {
    // 認証成功後にAuth状態を最新化
    refresh();
    const timer = setTimeout(() => {
      navigate('/');
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return(
    <div style={{textAlign:'center'}}>
      ログイン成功
    </div>
  )
}

export default SuccessPage;
