export function AutomationTimeline({ steps }) {
  return (
    <div className="card">
      <header className="card-header">
        <h2>Автоворонка</h2>
        <p>Последовательность писем и действий, которую можно расширить.</p>
      </header>

      <div className="timeline">
        {steps.map((step, index) => (
          <div className="timeline-item" key={step.id}>
            <div className="timeline-marker">{index + 1}</div>
            <div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <span className="timeline-meta">{step.delay}</span>
            </div>
          </div>
        ))}
      </div>

      <footer className="card-footer">
        <small>
          Интегрируется с Celery/RQ или Zapier/Make. Возможна связка с CRM и
          Telegram.
        </small>
      </footer>
    </div>
  );
}

