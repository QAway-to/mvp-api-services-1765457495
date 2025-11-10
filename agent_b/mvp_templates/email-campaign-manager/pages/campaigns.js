import Link from "next/link";
import campaigns from "../src/mock-data/campaigns";

export default function Campaigns() {
  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Кампании</h1>
          <p className="subtitle">
            Живые метрики обновляются каждые 5 минут. Сейчас данные замоканы
            для демонстрации.
          </p>
        </div>
        <Link href="/" className="btn">
          ← На главную
        </Link>
      </header>

      <table className="data-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Отправлено</th>
            <th>Доставлено</th>
            <th>Открытия</th>
            <th>CTR</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr key={campaign.id}>
              <td>
                <div className="stacked">
                  <strong>{campaign.name}</strong>
                  <span>{campaign.segment}</span>
                </div>
              </td>
              <td>{campaign.metrics.sent.toLocaleString()}</td>
              <td>{campaign.metrics.delivered}%</td>
              <td>{campaign.metrics.open_rate}%</td>
              <td>{campaign.metrics.click_rate}%</td>
              <td>
                <span className={`status-badge status-${campaign.status}`}>
                  {campaign.status_label}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

