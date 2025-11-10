import Link from "next/link";
import { clsx } from "clsx";

export function CampaignSummary({ campaign }) {
  if (!campaign) return null;

  return (
    <div className="card">
      <header className="card-header">
        <div>
          <h2>{campaign.name}</h2>
          <p>{campaign.segment}</p>
        </div>
        <span className={clsx("status-badge", `status-${campaign.status}`)}>
          {campaign.status_label}
        </span>
      </header>

      <div className="metrics-grid">
        <Metric
          label="Доставлено"
          value={`${campaign.metrics.delivered}%`}
          trend="+4.8% за неделю"
        />
        <Metric
          label="Открытия"
          value={`${campaign.metrics.open_rate}%`}
          trend="+2.1%"
        />
        <Metric
          label="CTR"
          value={`${campaign.metrics.click_rate}%`}
          trend="+0.9%"
        />
        <Metric
          label="Отписки"
          value={`${campaign.metrics.unsubscribe_rate}%`}
          trend="держится < 0.4%"
        />
      </div>

      <footer className="card-footer">
        <Link href="/campaigns" className="btn">
          📈 Посмотреть подробную статистику
        </Link>
        <small>Данные обновляются каждые 5 минут</small>
      </footer>
    </div>
  );
}

function Metric({ label, value, trend }) {
  return (
    <div className="metric">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      <p className="metric-trend">{trend}</p>
    </div>
  );
}

