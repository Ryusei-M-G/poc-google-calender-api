import { useState } from "react";
import axios from 'axios'
const Form = () => {
  const [date,setDate] = useState();
  const [text,setText] = useState();


  const sendInfo = () => {
    const info = {
      date: date,
      text: text,
    };

    axios.post("http://localhost:3000/addContent",info);

  }
  return (
    <div style={{ textAlign: 'center' }}>
      日付: <input type="date" onChange={(e) => {
        setDate(e.target.value);
      }}/><br />
      内容: <input onChange={(e) =>{
        setText(e.target.value);
      }}/><br />
      <button type="submit" onClick={sendInfo}>送信</button>  
    </div>
  )
}

export default Form;