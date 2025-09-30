import { useState, useEffect } from "react";
const SuccessPage = () => {

  const [state, setState] = useState([]);

  const fetchHandle = async () => {
    try {
      const res = await fetch('http://localhost:3000/events');
      const data = await res.json();
      console.log(data);
      setState(data);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(()=>{
    fetchHandle();
  },[]
  )
  return (
    <div style={
      {textAlign: 'center'}
    }>
      <div>login success</div>
      <button onClick={fetchHandle}>button</button>
      {
        state.map((e) => {
          return (
            <div key={e.id} style={{border: 'solid',borderRadius:'16px',padding:'1rem',margin:'1rem'}}>
              <div>{e.start?.dateTime}</div>
              <div>{e.start?.date}</div>
              <div>{e.summary}</div>
            </div>
          )
        })
      }

    </div>
  )
}

export default SuccessPage;