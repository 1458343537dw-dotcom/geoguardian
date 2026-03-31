import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // 状态：从 localStorage 读取历史数据
  const [locations, setLocations] = useState(() => {
    const savedData = localStorage.getItem('geoGuardianData');
    return savedData ? JSON.parse(savedData) : [];
  });

  // 状态：网络连接状态监听
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // 状态：用于新建记录时的笔记输入
  const [currentNote, setCurrentNote] = useState('');

  // 状态：用于控制哪条记录正在被编辑，以及编辑时的临时文本
  const [editingId, setEditingId] = useState(null);
  const [editNoteText, setEditNoteText] = useState('');

  // 监听数据变化，自动保存到本地存储
  useEffect(() => {
    localStorage.setItem('geoGuardianData', JSON.stringify(locations));
  }, [locations]);

  // 监听全局网络状态变化
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 获取位置并保存记录
  const handleRecordLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newRecord = {
          id: Date.now().toString(),
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
          timestamp: new Date().toLocaleString(),
          note: currentNote.trim() || 'No notes added.',
          // 核心修改：根据当前网络状态决定记录的标签
          status: isOffline ? 'Offline Saved' : 'Online' 
        };
        
        setLocations([newRecord, ...locations]);
        setCurrentNote(''); // 记录成功后清空输入框
      },
      (error) => {
        alert('Unable to retrieve your location. Check permissions.');
        console.error(error);
      }
    );
  };

  // 发送短信 (去除了修改状态的逻辑，仅保留发送功能)
  const handleSendSMS = (record) => {
    const phoneNumber = ''; 
    const message = `Safety Alert! Location: https://maps.google.com/?q=$${record.lat},${record.lng}. Note: ${record.note} (Recorded: ${record.timestamp})`;
    
    const smsUri = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    window.open(smsUri, '_self');
    // 注意：这里去掉了原来 setLocations 的逻辑，因为状态现在只反映记录时的网络环境
  };

  // 开启编辑模式
  const startEditing = (record) => {
    setEditingId(record.id);
    setEditNoteText(record.note);
  };

  // 保存修改后的笔记
  const saveEditedNote = (id) => {
    const updatedLocations = locations.map((loc) => {
      if (loc.id === id) {
        return { ...loc, note: editNoteText.trim() || 'No notes added.' };
      }
      return loc;
    });
    setLocations(updatedLocations);
    setEditingId(null); 
  };

  // 删除记录
  const handleDelete = (id) => {
    const filteredLocations = locations.filter((loc) => loc.id !== id);
    setLocations(filteredLocations);
  };

  return (
    <div className="app-container">
      {/* 离线警告横幅 */}
      {isOffline && (
        <div className="offline-banner">
          No internet connection. Operating in offline mode.
        </div>
      )}

      <header className="app-header">
        <h1>GeoGuardian</h1>
        <p>Solo Travel Safety System</p>
      </header>

      <main className="app-main">
        {/* 输入与记录区域 */}
        <section className="input-section">
          <textarea 
            className="note-input"
            placeholder="Write a travel note or leave a safety message..."
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            rows="3"
          />
          <button 
            className={`btn-record ${isOffline ? 'btn-offline' : ''}`} 
            onClick={handleRecordLocation}
          >
            Record Current Location
          </button>
        </section>

        {/* 历史记录列表 */}
        <section className="location-list">
          <h2>Location History</h2>
          {locations.length === 0 ? (
            <p className="empty-state">No locations recorded yet.</p>
          ) : (
            locations.map((record) => (
              <div key={record.id} className="location-card">
                <div className="card-header">
                  <span className="time">{record.timestamp}</span>
                  {/* 将状态文本转换为适合做 CSS 类名的格式，例如 'Offline Saved' 变成 'offline-saved' */}
                  <span className={`status-badge ${record.status.toLowerCase().replace(' ', '-')}`}>
                    {record.status}
                  </span>
                </div>
                
                <div className="card-body">
                  <p className="coords">Lat: {record.lat}, Lng: {record.lng}</p>
                  
                  {editingId === record.id ? (
                    <div className="edit-mode">
                      <textarea 
                        className="edit-textarea"
                        value={editNoteText}
                        onChange={(e) => setEditNoteText(e.target.value)}
                      />
                      <button className="btn-save" onClick={() => saveEditedNote(record.id)}>Save</button>
                    </div>
                  ) : (
                    <div className="view-mode">
                      <p className="note-text">"{record.note}"</p>
                      <button className="btn-text" onClick={() => startEditing(record)}>Edit Note</button>
                    </div>
                  )}
                </div>
                
                <div className="card-actions">
                  <button className="btn-sms" onClick={() => handleSendSMS(record)}>
                    Send SMS
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(record.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default App;