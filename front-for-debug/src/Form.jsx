import { useState } from "react";
import axios from 'axios'
const Form = () => {
  const [date,setDate] = useState();
  const [startTime,setStartTime] = useState();
  const [endTime,setEndTime] = useState();
  const [text,setText] = useState();


  const sendInfo = async () => {
    const startDateTime = `${date}T${startTime}:00`;
    const endDateTime = `${date}T${endTime}:00`;
    const info = {
      startDate: startDateTime,
      endDate: endDateTime,
      text: text,
    };

    const response = await axios.post("http://localhost:3000/addContent", info, {
      withCredentials: true
    });
    console.log(response.data);

  }
  return (
    <div style={{ textAlign: 'center' }}>
      日付: <input type="date" onChange={(e) => {
        setDate(e.target.value);
      }}/><br />
      開始時刻: <input type="time" onChange={(e) => {
        setStartTime(e.target.value);
      }}/><br />
      終了時刻: <input type="time" onChange={(e) => {
        setEndTime(e.target.value);
      }}/><br />
      内容: <input onChange={(e) =>{
        setText(e.target.value);
      }}/><br />
      <button type="submit" onClick={sendInfo}>送信</button>
    </div>
  )
}

export default Form;