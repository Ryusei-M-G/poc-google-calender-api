import { useNavigate } from 'react-router-dom';

const Navigate = () => {
  const navigate = useNavigate();

  const buttonStyle = {
    padding: '10px 20px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#333',
    transition: 'all 0.2s',
    fontWeight: '500'
  };

  return (
    <nav style={{
      display: 'flex',
      gap: '30px',
      padding: '20px 40px',
      backgroundColor: '#fff',
      borderBottom: '1px solid #e5e5e5',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <button
        style={buttonStyle}
        onClick={() => navigate('/')}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#f8f9fa';
          e.target.style.borderColor = '#007bff';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = '#fff';
          e.target.style.borderColor = '#e5e5e5';
        }}
      >
        Home
      </button>
      <button
        style={buttonStyle}
        onClick={() => navigate('/form')}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#f8f9fa';
          e.target.style.borderColor = '#007bff';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = '#fff';
          e.target.style.borderColor = '#e5e5e5';
        }}
      >
        Form
      </button>
    </nav>
  );
};

export default Navigate;
