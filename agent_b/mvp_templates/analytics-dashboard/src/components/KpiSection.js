export default function KpiSection({ kpis }) {
  return (
    <section className="kpis">
      {kpis.map((kpi) => (
        <article key={kpi.title} className="kpi-card">
          <span className="label">{kpi.title}</span>
          <strong className="value">{kpi.value}</strong>
          <span className={`delta ${kpi.trend >= 0 ? 'up' : 'down'}`}>
            {kpi.trend >= 0 ? '▲' : '▼'} {Math.abs(kpi.trend)}%
          </span>
          <p>{kpi.description}</p>
        </article>
      ))}
    </section>
  );
}
