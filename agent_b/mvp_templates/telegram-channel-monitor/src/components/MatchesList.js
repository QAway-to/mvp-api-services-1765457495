import { useState, useEffect } from 'react';

export default function MatchesList() {
  const [matches, setMatches] = useState([]);
  const [channels, setChannels] = useState([]);
  const [rules, setRules] = useState([]);
  const [filters, setFilters] = useState({
    channel_id: '',
    rule_id: ''
  });

  useEffect(() => {
    loadChannels();
    loadRules();
    loadMatches();
  }, [filters]);

  const loadChannels = async () => {
    try {
      const res = await fetch('/api/channels');
      const data = await res.json();
      setChannels(data);
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  };

  const loadRules = async () => {
    try {
      const res = await fetch('/api/rules');
      const data = await res.json();
      setRules(data);
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  };

  const loadMatches = async () => {
    try {
      let url = '/api/matches?limit=100';
      if (filters.channel_id) url += `&channel_id=${filters.channel_id}`;
      if (filters.rule_id) url += `&rule_id=${filters.rule_id}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setMatches(data);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Найденные совпадения</h2>
        <p>Всего: {matches.length}</p>
      </div>

      <div className="form-group">
        <div className="grid two-columns">
          <div>
            <label className="form-label">Фильтр по каналу</label>
            <select
              className="form-select"
              value={filters.channel_id}
              onChange={(e) => setFilters({ ...filters, channel_id: e.target.value })}
            >
              <option value="">Все каналы</option>
              {channels.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Фильтр по правилу</label>
            <select
              className="form-select"
              value={filters.rule_id}
              onChange={(e) => setFilters({ ...filters, rule_id: e.target.value })}
            >
              <option value="">Все правила</option>
              {rules.map(rule => (
                <option key={rule.id} value={rule.id}>{rule.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="matches-table">
        {matches.length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>
            Совпадений не найдено
          </p>
        ) : (
          <table className="results-table">
            <thead>
              <tr>
                <th>Время</th>
                <th>Канал</th>
                <th>Правило</th>
                <th>Сообщение</th>
                <th>Ссылка</th>
              </tr>
            </thead>
            <tbody>
              {matches.map(match => (
                <tr key={match.id}>
                  <td>{new Date(match.detected_at).toLocaleString()}</td>
                  <td>{match.channel_name}</td>
                  <td>{match.rule_name}</td>
                  <td>
                    <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {match.message_text?.substring(0, 100)}
                      {match.message_text?.length > 100 && '...'}
                    </div>
                  </td>
                  <td>
                    {match.message_url ? (
                      <a href={match.message_url} target="_blank" rel="noopener noreferrer">
                        Открыть
                      </a>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

