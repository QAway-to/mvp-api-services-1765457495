import Link from "next/link";

const providers = [
  {
    name: "SendGrid",
    status: "pending",
    description: "REST API, 28 templates, domain authenticated",
  },
  {
    name: "Mailgun",
    status: "ready",
    description: "US/EU regions configured, tracking webhooks live",
  },
  {
    name: "AWS SES",
    status: "todo",
    description: "Region: eu-central-1, warm-up plan pending approval",
  },
];

export default function SettingsPage() {
  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Настройки интеграций</h1>
          <p className="subtitle">
            Здесь клиент видит, что осталось включить: API‑ключи, домены,
            webhooks. Все чек-листы готовы – активируем после оплаты.
          </p>
        </div>
        <Link href="/" className="btn">
          ← На главную
        </Link>
      </header>

      <section className="integration-grid">
        {providers.map((provider) => (
          <div className="integration-card" key={provider.name}>
            <header>
              <h3>{provider.name}</h3>
              <span className={`status-badge status-${provider.status}`}>
                {provider.status === "ready"
                  ? "Готово"
                  : provider.status === "pending"
                  ? "Настраивается"
                  : "Ожидает"}
              </span>
            </header>
            <p>{provider.description}</p>
            <ul>
              <li>API ключи хранятся в Vault</li>
              <li>Поддержка DKIM/SPF/DMARC</li>
              <li>Webhook-и для трекинга открытий и кликов</li>
            </ul>
          </div>
        ))}
      </section>

      <section className="code-preview">
        <h2>Backend уже подготовлен</h2>
        <p>
          Скрипт <code>email_campaign_manager.py</code> обрабатывает очередь
          SendGrid, ведёт логи в SQLite и мониторит ответы. Осталось задеплоить
          на сервер (Railway/Vercel functions/Cloud Run) и подключить cron.
        </p>
        <pre>
{`async def main():
    manager = EmailCampaignManager()
    await manager.send_campaign_emails("contacts.csv")
    await manager.monitor_replies(
        email_account="sales@brand.dev",
        password="app_password"
    )`}
        </pre>
      </section>
    </main>
  );
}

