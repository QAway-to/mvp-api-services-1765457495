import Head from "next/head";
import Link from "next/link";
import { CampaignSummary } from "../src/components/CampaignSummary";
import { DeliverabilityChart } from "../src/components/DeliverabilityChart";
import { AutomationTimeline } from "../src/components/AutomationTimeline";
import { ReplyInboxPreview } from "../src/components/ReplyInboxPreview";
import campaigns from "../src/mock-data/campaigns";
import replies from "../src/mock-data/replies";

export default function Home() {
  const activeCampaign = campaigns[0];

  return (
    <>
      <Head>
        <title>Email Campaign Manager – Demo</title>
      </Head>
      <main className="page">
        <header className="page-header">
          <div>
            <h1>Email Campaign Manager</h1>
            <p className="subtitle">
              Демонстрация панели управления кампанией по email‑рассылкам. 80%
              работы уже сделано – осталось подключить реальный SMTP и автоматику.
            </p>
          </div>
          <div className="header-actions">
            <Link href="/campaigns" className="btn btn-primary">
              📧 Все кампании
            </Link>
            <Link href="/templates" className="btn">
              📝 Шаблоны писем
            </Link>
            <Link href="/settings" className="btn">
              ⚙️ Настройки
            </Link>
          </div>
        </header>

        <section className="grid two-columns">
          <CampaignSummary campaign={activeCampaign} />
          <DeliverabilityChart data={activeCampaign.metrics} />
        </section>

        <section className="grid two-columns">
          <AutomationTimeline steps={activeCampaign.automation} />
          <ReplyInboxPreview replies={replies.slice(0, 4)} />
        </section>

        <section className="next-steps">
          <h2>Что остаётся подключить по запросу клиента</h2>
          <div className="steps-list">
            <div className="step-card">
              <h3>✅ Интеграция SendGrid/Mailgun/SES</h3>
              <p>
                Пара кликов – и скрипт <code>email_campaign_manager.py</code>
                отправляет письма из облака. API обвязка уже готова.
              </p>
            </div>
            <div className="step-card">
              <h3>📥 Автоответы и CRM</h3>
              <p>
                Модуль мониторинга входящих писем уже написан. Осталось связать с
                CRM (Bitrix24, HubSpot) или Telegram-оповещениями.
              </p>
            </div>
            <div className="step-card">
              <h3>📊 Глубокая аналитика</h3>
              <p>
                Подключаем BigQuery/ClickHouse, строим отчёты по сегментам,
                ротации шаблонов и ROI кампаний.
              </p>
            </div>
            <div className="step-card">
              <h3>🔒 Безопасность и доставка</h3>
              <p>
                Настраиваем DKIM, SPF, DMARC и warm-up адресов. Всё это готово в
                чек-листах команды.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

