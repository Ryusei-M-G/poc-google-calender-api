import { useState,useEffect } from "react";
const Calendar = () =>{

  const [state, setState] = useState([]);

  const formatDateTime = (dateTime, date) => {
    if (dateTime) {
      const d = new Date(dateTime);
      return d.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (date) {
      const d = new Date(date);
      return d.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
    return '';
  };

  const fetchHandle = async () => {
    try {
      const res = await fetch('http://localhost:3000/events', {
        credentials: 'include'
      });
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
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>カレンダーイベント</h2>
      <button
        onClick={fetchHandle}
        style={{
          padding: '10px 20px',
          marginBottom: '20px',
          border: '1px solid #007bff',
          borderRadius: '6px',
          backgroundColor: '#007bff',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        更新
      </button>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {state.length === 0 ? (
          <p>イベントがありません</p>
        ) : (
          state.map((e) => {
            return (
              <div
                key={e.id}
                style={{
                  border: '1px solid #e5e5e5',
                  borderRadius: '12px',
                  padding: '20px',
                  margin: '15px 0',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  textAlign: 'left'
                }}
              >
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  color: '#333'
                }}>
                  {e.summary || '(タイトルなし)'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '5px'
                }}>
                  <span style={{ fontWeight: '600' }}>開始:</span> {formatDateTime(e.start?.dateTime, e.start?.date)}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#666'
                }}>
                  <span style={{ fontWeight: '600' }}>終了:</span> {formatDateTime(e.end?.dateTime, e.end?.date)}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Calendar