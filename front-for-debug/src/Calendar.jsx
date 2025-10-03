import { useState,useEffect } from "react";
const Calendar = () =>{

  const [state, setState] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ summary: '', description: '', startInput: '', endInput: '', isAllDay: false });

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

  // ---- Mock API handlers (since server endpoints are not ready) ----
  const mockDeleteEvent = async (id) => {
    // Simulate latency
    await new Promise((res) => setTimeout(res, 200));
    return { ok: true, id };
  };

  const mockUpdateEvent = async (id, payload) => {
    // Simulate latency and echo back update
    await new Promise((res) => setTimeout(res, 250));
    return { ok: true, id, payload };
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('このイベントを削除しますか？');
    if (!ok) return;
    try {
      const res = await mockDeleteEvent(id);
      if (res.ok) {
        setState((prev) => prev.filter((ev) => ev.id !== id));
      }
    } catch (err) {
      console.error(err);
      alert('削除に失敗しました（モック）');
    }
  };

  const startEdit = (ev) => {
    setEditingId(ev.id);
    const isAllDay = !!(ev.start?.date || ev.end?.date);
    const toInputDateTime = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mi = pad(d.getMinutes());
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    };

    setEditForm({
      summary: ev.summary || '',
      description: ev.description || '',
      startInput: isAllDay ? (ev.start?.date || '') : toInputDateTime(ev.start?.dateTime),
      endInput: isAllDay ? (ev.end?.date || '') : toInputDateTime(ev.end?.dateTime),
      isAllDay
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ summary: '', description: '' });
  };

  const saveEdit = async (id) => {
    try {
      const res = await mockUpdateEvent(id, editForm);
      if (res.ok) {
        setState((prev) => prev.map((ev) => {
          if (ev.id !== id) return ev;
          const { summary, description, startInput, endInput, isAllDay } = editForm;
          if (isAllDay) {
            return {
              ...ev,
              summary,
              description,
              start: { date: startInput },
              end: { date: endInput }
            };
          } else {
            const toISO = (s) => s ? new Date(s).toISOString() : undefined;
            return {
              ...ev,
              summary,
              description,
              start: { dateTime: toISO(startInput) },
              end: { dateTime: toISO(endInput) }
            };
          }
        }));
        cancelEdit();
      }
    } catch (err) {
      console.error(err);
      alert('更新に失敗しました（モック）');
    }
  };

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
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#333',
                    flex: 1
                  }}>
                    {e.summary || '(タイトルなし)'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => startEdit(e)}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #0d6efd',
                        borderRadius: '6px',
                        backgroundColor: '#0d6efd',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                      disabled={editingId === e.id}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #dc3545',
                        borderRadius: '6px',
                        backgroundColor: '#dc3545',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                      disabled={editingId === e.id}
                    >
                      削除
                    </button>
                  </div>
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

                {editingId === e.id && (
                  <div style={{
                    marginTop: '15px',
                    padding: '12px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '4px' }}>タイトル</label>
                      <input
                        type="text"
                        value={editForm.summary}
                        onChange={(ev) => setEditForm((p) => ({ ...p, summary: ev.target.value }))}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                        placeholder="タイトルを入力"
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '4px' }}>説明</label>
                      <textarea
                        value={editForm.description}
                        onChange={(ev) => setEditForm((p) => ({ ...p, description: ev.target.value }))}
                        rows={3}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }}
                        placeholder="説明を入力"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '4px' }}>開始</label>
                        {editForm.isAllDay ? (
                          <input
                            type="date"
                            value={editForm.startInput}
                            onChange={(ev) => setEditForm((p) => ({ ...p, startInput: ev.target.value }))}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                          />
                        ) : (
                          <input
                            type="datetime-local"
                            value={editForm.startInput}
                            onChange={(ev) => setEditForm((p) => ({ ...p, startInput: ev.target.value }))}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                            step={60}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '4px' }}>終了</label>
                        {editForm.isAllDay ? (
                          <input
                            type="date"
                            value={editForm.endInput}
                            onChange={(ev) => setEditForm((p) => ({ ...p, endInput: ev.target.value }))}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                          />
                        ) : (
                          <input
                            type="datetime-local"
                            value={editForm.endInput}
                            onChange={(ev) => setEditForm((p) => ({ ...p, endInput: ev.target.value }))}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                            step={60}
                          />
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => saveEdit(e.id)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #198754',
                          borderRadius: '6px',
                          backgroundColor: '#198754',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >保存</button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #6c757d',
                          borderRadius: '6px',
                          backgroundColor: '#6c757d',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >キャンセル</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Calendar
