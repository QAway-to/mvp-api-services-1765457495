export default function StatsPanel({ stats }) {
  if (!stats) return null;

  return (
    <div className="metrics-grid">
      <div className="metric">
        <p className="metric-label">Каналы</p>
        <p className="metric-value">{stats.channels.active}/{stats.channels.total}</p>
      </div>
      <div className="metric">
        <p className="metric-label">Правила</p>
        <p className="metric-value">{stats.rules.active}/{stats.rules.total}</p>
      </div>
      <div className="metric">
        <p className="metric-label">Сообщений</p>
        <p className="metric-value">{stats.messages.total}</p>
      </div>
      <div className="metric">
        <p className="metric-label">Совпадений</p>
        <p className="metric-value">{stats.matches.total}</p>
      </div>
      <div className="metric">
        <p className="metric-label">За 24ч</p>
        <p className="metric-value">{stats.matches.last_24h}</p>
      </div>
    </div>
  );
}

