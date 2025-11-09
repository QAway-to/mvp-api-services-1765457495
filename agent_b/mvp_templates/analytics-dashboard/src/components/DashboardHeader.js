export default function DashboardHeader({ clientName, reportPeriod }) {
  return (
    <section className="header">
      <div>
        <h1>💼 Отчёт для {clientName}</h1>
        <p>Период: {reportPeriod}</p>
      </div>
      <div className="cta">
        <button className="primary">Запросить полный доступ</button>
        <button className="ghost">Скачать презентацию</button>
      </div>
    </section>
  );
}
