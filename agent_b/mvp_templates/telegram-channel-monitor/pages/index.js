import { useState, useEffect } from 'react';
import Head from 'next/head';
import ChannelManager from '../src/components/ChannelManager';
import RuleManager from '../src/components/RuleManager';
import MatchesList from '../src/components/MatchesList';
import StatsPanel from '../src/components/StatsPanel';

export default function Home() {
  const [activeTab, setActiveTab] = useState('channels');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
    const statsInterval = setInterval(loadStats, 30000);
    
    // Автоматическое сканирование каналов каждый час (3600000 мс)
    const scanChannels = async () => {
      try {
        await fetch('/api/scan');
        console.log('Channel scan triggered');
      } catch (error) {
        console.error('Error triggering scan:', error);
      }
    };
    
    // Запустить сразу при загрузке
    scanChannels();
    
    // Затем каждые 60 минут
    const scanInterval = setInterval(scanChannels, 3600000);
    
    return () => {
      clearInterval(statsInterval);
      clearInterval(scanInterval);
    };
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <>
      <Head>
        <title>Telegram Channel Monitor</title>
        <meta name="description" content="Monitor Telegram channels and search for matches" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="page">
        <header className="page-header">
          <div>
            <h1>📡 Telegram Channel Monitor</h1>
            <p className="subtitle">
              Мониторинг Telegram-каналов и поиск по правилам
            </p>
          </div>
          {stats && <StatsPanel stats={stats} />}
        </header>

        <nav className="tabs">
          <button
            className={activeTab === 'channels' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('channels')}
          >
            📺 Каналы
          </button>
          <button
            className={activeTab === 'rules' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('rules')}
          >
            🔍 Правила поиска
          </button>
          <button
            className={activeTab === 'matches' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('matches')}
          >
            ✅ Совпадения
          </button>
        </nav>

        <section>
          {activeTab === 'channels' && <ChannelManager onUpdate={loadStats} />}
          {activeTab === 'rules' && <RuleManager onUpdate={loadStats} />}
          {activeTab === 'matches' && <MatchesList />}
        </section>
      </main>
    </>
  );
}

