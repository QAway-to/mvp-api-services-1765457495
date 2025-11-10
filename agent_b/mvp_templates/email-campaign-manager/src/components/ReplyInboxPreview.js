export function ReplyInboxPreview({ replies }) {
  return (
    <div className="card">
      <header className="card-header">
        <h2>Входящие ответы</h2>
        <p>Все входящие письма логируются и попадают в CRM.</p>
      </header>

      <ul className="inbox-list">
        {replies.map((reply) => (
          <li key={reply.id} className="inbox-item">
            <div className="inbox-meta">
              <strong>{reply.from}</strong>
              <span>{reply.received_at}</span>
            </div>
            <p>{reply.preview}</p>
            <span className="tag">{reply.intent}</span>
          </li>
        ))}
      </ul>

      <footer className="card-footer">
        <small>
          Автоответчик на базе <code>monitor_replies()</code> уже готов. Настроим
          push-уведомления в Telegram/Slack.
        </small>
      </footer>
    </div>
  );
}

