import { useState, useEffect } from 'react';

export default function RuleManager({ onUpdate }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rule_type: 'keywords',
    pattern: '',
    is_active: true
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const res = await fetch('/api/rules');
      const data = await res.json();
      setRules(data);
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  };

  const addRule = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({ name: '', rule_type: 'keywords', pattern: '', is_active: true });
        loadRules();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error adding rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (id) => {
    if (!confirm('Удалить правило?')) return;
    try {
      const res = await fetch(`/api/rules/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadRules();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const toggleRule = async (id, isActive) => {
    try {
      const res = await fetch(`/api/rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      });
      if (res.ok) {
        loadRules();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  return (
    <div className="grid two-columns">
      <div className="card">
        <div className="card-header">
          <h2>Создать правило поиска</h2>
          <p>Настройте правило для поиска сообщений</p>
        </div>
        <form onSubmit={addRule}>
          <div className="form-group">
            <label className="form-label">Название правила</label>
            <input
              type="text"
              className="form-input"
              placeholder="Имя правила"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Тип правила</label>
            <select
              className="form-select"
              value={formData.rule_type}
              onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
            >
              <option value="keywords">Ключевые слова</option>
              <option value="regex">Регулярное выражение</option>
              <option value="semantic">Семантический поиск</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Поисковая фраза</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder={
                formData.rule_type === 'keywords'
                  ? 'python, telegram, bot (через запятую)'
                  : formData.rule_type === 'regex'
                  ? '/pattern/gi'
                  : 'Описание для семантического поиска'
              }
              value={formData.pattern}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Создание...' : '➕ Создать правило'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Список правил</h2>
          <p>Всего: {rules.length}</p>
        </div>
        <div className="rules-list">
          {rules.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>Нет правил</p>
          ) : (
            rules.map(rule => (
              <div key={rule.id} className="rule-item">
                <div>
                  <strong>{rule.name}</strong>
                  <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: '4px 0' }}>
                    Тип: {rule.rule_type} | Паттерн: {rule.pattern}
                  </p>
                </div>
                <div className="rule-actions">
                  <span className={`status-badge ${rule.is_active ? 'status-success' : 'status-warning'}`}>
                    {rule.is_active ? '✅ Активно' : '⏸️ Выключено'}
                  </span>
                  <button
                    className="btn"
                    onClick={() => toggleRule(rule.id, rule.is_active)}
                  >
                    {rule.is_active ? '⏸️ Выключить' : '▶️ Включить'}
                  </button>
                  <button
                    className="btn"
                    style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444' }}
                    onClick={() => deleteRule(rule.id)}
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

