import { useState, useEffect } from 'react';

export default function ChannelManager({ onUpdate }) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  // Загружаем состояние формы из localStorage
  const [formData, setFormData] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('channelFormData');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return { channel_id: '', name: '', is_active: true };
        }
      }
    }
    return { channel_id: '', name: '', is_active: true };
  });

  // Сохраняем состояние формы при изменении
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('channelFormData', JSON.stringify(formData));
    }
  }, [formData]);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const res = await fetch('/api/channels');
      const data = await res.json();
      setChannels(data);
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  };

  const parseChannelLink = (input) => {
    // Парсинг ссылок вида https://t.me/vacancy_it_ulbitv или t.me/vacancy_it_ulbitv
    if (input.includes('t.me/')) {
      const match = input.match(/t\.me\/([a-zA-Z0-9_]+)/);
      if (match) {
        return '@' + match[1];
      }
    }
    // Если уже @username или числовой ID, возвращаем как есть
    return input.trim();
  };

  const addChannel = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Парсим ссылку если это ссылка
      const parsedChannelId = parseChannelLink(formData.channel_id);
      
      const channelData = {
        ...formData,
        channel_id: parsedChannelId
      };
      
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channelData)
      });
      if (res.ok) {
        setFormData({ channel_id: '', name: '', is_active: true });
        loadChannels();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error adding channel:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteChannel = async (id) => {
    if (!confirm('Удалить канал?')) return;
    try {
      const res = await fetch(`/api/channels/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadChannels();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  };

  const toggleChannel = async (id, isActive) => {
    try {
      const res = await fetch(`/api/channels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      });
      if (res.ok) {
        loadChannels();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error toggling channel:', error);
    }
  };

  return (
    <div className="grid two-columns">
      <div className="card">
        <div className="card-header">
          <h2>Добавить канал</h2>
          <p>Введите идентификатор канала (@username или channel_id)</p>
        </div>
        <form onSubmit={addChannel}>
          <div className="form-group">
            <label className="form-label">Ссылка на канал или идентификатор</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://t.me/vacancy_it_ulbitv или @channel_username"
              value={formData.channel_id}
              onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
              required
            />
            <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '4px' }}>
              Поддерживаются ссылки вида: https://t.me/username или @username
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Название</label>
            <input
              type="text"
              className="form-input"
              placeholder="Человекочитаемое имя"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Добавление...' : '➕ Добавить канал'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Список каналов</h2>
          <p>Всего: {channels.length}</p>
        </div>
        <div className="channels-list">
          {channels.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>Нет каналов</p>
          ) : (
            channels.map(channel => (
              <div key={channel.id} className="channel-item">
                <div>
                  <strong>{channel.name}</strong>
                  <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: '4px 0' }}>
                    {channel.channel_id}
                  </p>
                  {channel.last_check_time && (
                    <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      Последняя проверка: {new Date(channel.last_check_time).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="channel-actions">
                  <button
                    className="btn"
                    onClick={() => toggleChannel(channel.id, channel.is_active)}
                  >
                    {channel.is_active ? '⏸️ Отключить' : '▶️ Включить'}
                  </button>
                  <button
                    className="btn"
                    style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444' }}
                    onClick={() => deleteChannel(channel.id)}
                  >
                    🗑️ Удалить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

