import Head from 'next/head';
import DashboardHeader from '../src/components/DashboardHeader';
import KpiSection from '../src/components/KpiSection';
import ChartPanel from '../src/components/ChartPanel';
import ActivityFeed from '../src/components/ActivityFeed';
import metrics from '../src/mock-data/metrics';

export default function Home() {
  return (
    <>
      <Head>
        <title>Analytics MVP</title>
        <meta name="description" content="Продающее демо MVP аналитического дашборда" />
      </Head>
      <main className="layout">
        <DashboardHeader clientName="Acme Corp" reportPeriod="Последние 30 дней" />
        <KpiSection kpis={metrics.kpis} />
        <div className="grid">
          <ChartPanel title="Рост конверсии" data={metrics.conversion} />
          <ChartPanel title="Активность пользователей" data={metrics.activity} />
          <ActivityFeed items={metrics.events} />
        </div>
      </main>
    </>
  );
}
