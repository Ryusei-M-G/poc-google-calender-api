
function App() {
  const onClickHandle = () => {

    window.location.href =
      'http://localhost:3000/auth';


  }
  return (
    <div>
      <button onClick={onClickHandle}>Button</button>
    </div>
  )
}

export default App
