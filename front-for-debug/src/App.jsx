import Calendar from './Calendar.jsx';

function App() {
  const onClickHandle = () => {
    window.location.href = 'http://localhost:3000/auth';
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <button onClick={onClickHandle}>Googleでログイン</button>
      <Calendar />
    </div>
  )
}

export default App
