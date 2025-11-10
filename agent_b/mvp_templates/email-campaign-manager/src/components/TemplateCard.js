export function TemplateCard({ template }) {
  return (
    <div className="card template-card">
      <header className="card-header">
        <h3>{template.name}</h3>
        <span className="tag">{template.use_case}</span>
      </header>
      <p>{template.description}</p>
      <ul className="feature-list">
        {template.highlights.map((highlight) => (
          <li key={highlight}>• {highlight}</li>
        ))}
      </ul>
      <footer className="card-footer">
        <span className="status-badge status-ready">Готов на 80%</span>
      </footer>
    </div>
  );
}

