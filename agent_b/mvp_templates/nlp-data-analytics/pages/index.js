import { useState, useEffect } from 'react';
import FileUploader from '../src/components/FileUploader';
import ChatInterface from '../src/components/ChatInterface';
import DataTable from '../src/components/DataTable';
import ChartPanel from '../src/components/ChartPanel';
import sampleData from '../src/mock-data/sample';

const container = {
  fontFamily: 'Inter, sans-serif',
  padding: '24px 32px',
  background: '#0f172a',
  color: '#f8fafc',
  minHeight: '100vh'
};

const header = {
  marginBottom: 32
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
  gap: 24,
  marginBottom: 32
};

const section = {
  background: '#1e1f33',
  borderRadius: 16,
  padding: 24,
  border: '1px solid rgba(59,130,246,0.2)',
  boxShadow: '0 20px 35px rgba(15, 23, 42, 0.35)'
};

const info = {
  marginTop: 16,
  padding: 12,
  background: 'rgba(16, 185, 129, 0.1)',
  borderRadius: 8,
  color: '#10b981',
  fontSize: 14
};

const results = {
  marginTop: 32
};

export default function Home() {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // Load sample data on mount for demo (only if no data uploaded)
  useEffect(() => {
    const savedData = sessionStorage.getItem('uploadedData');
    if (!savedData && !data) {
      setData({
        rows: sampleData.length,
        columns: Object.keys(sampleData[0] || {}).length,
        sample: sampleData.slice(0, 5),
        columnNames: Object.keys(sampleData[0] || {}),
        data: sampleData
      });
    } else if (savedData) {
      const parsedData = JSON.parse(savedData);
      const columns = JSON.parse(sessionStorage.getItem('uploadedColumns') || '[]');
      setData({
        rows: parsedData.length,
        columns: columns.length,
        sample: parsedData.slice(0, 5),
        columnNames: columns,
        data: parsedData
      });
    }
  }, []);

  const handleQuerySubmit = async (q) => {
    if (!q.trim()) return;
    
    // Get data from state or sessionStorage
    let currentData = data?.data;
    let currentColumns = data?.columnNames;

    if (!currentData) {
      const savedData = sessionStorage.getItem('uploadedData');
      if (savedData) {
        currentData = JSON.parse(savedData);
        currentColumns = JSON.parse(sessionStorage.getItem('uploadedColumns') || '[]');
      } else {
        // Use sample data
        currentData = sampleData;
        currentColumns = Object.keys(sampleData[0] || {});
      }
    }

    if (!currentData || currentData.length === 0) {
      setResults({
        type: 'error',
        message: 'Сначала загрузите данные',
        table: null,
        chart: null
      });
      return;
    }
    
    setLoading(true);
    setLogs([{ timestamp: new Date().toISOString(), message: 'Начало обработки запроса...' }]);
    
    try {
      console.log('[Query] Отправка запроса:', q);
      console.log('[Query] Данные:', currentData?.length, 'строк');
      console.log('[Query] Колонки:', currentColumns);
      
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: q,
          data: currentData,
          columns: currentColumns
        })
      });

      console.log('[Query] Ответ получен, статус:', response.status);
      const result = await response.json();
      console.log('[Query] Результат:', result);

      if (!response.ok) {
        console.error('[Query] Ошибка ответа:', result);
        throw new Error(result.error || result.message || 'Ошибка обработки запроса');
      }

      setResults(result);
      
      // Show logs if available
      if (result.logs && result.logs.length > 0) {
        setLogs(result.logs);
      }
    } catch (error) {
      console.error('[Query] Ошибка:', error);
      setResults({
        type: 'error',
        message: error.message || 'Ошибка обработки запроса',
        table: null,
        chart: null,
        logs: logs
      });
      setLogs(prev => [...prev, { 
        timestamp: new Date().toISOString(), 
        message: `❌ ОШИБКА: ${error.message}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={container}>
      <header style={header}>
        <h1 style={{ fontSize: 36, margin: 0 }}>📊 NLP Data Analytics</h1>
        <p style={{ color: '#94a3b8', marginTop: 8 }}>
          Анализ данных через естественный язык. Загрузите CSV/Excel или подключите БД.
        </p>
      </header>

      <div style={grid}>
        <section style={section}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>📁 Загрузка данных</h2>
          <FileUploader onDataLoaded={setData} />
          {data && (
            <div style={info}>
              ✅ Загружено: {data.rows} строк, {data.columns} колонок
            </div>
          )}
          {!data && (
            <div style={{ marginTop: 16, padding: 12, background: '#11162a', borderRadius: 8, fontSize: 12, color: '#94a3b8' }}>
              💡 <strong>Демо режим:</strong> Используются примерные данные для демонстрации. Загрузите свой файл для реального анализа.
            </div>
          )}
        </section>

        <section style={section}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>💬 Задайте вопрос</h2>
          <ChatInterface 
            query={query}
            onQueryChange={setQuery}
            onQuerySubmit={handleQuerySubmit}
            loading={loading}
          />
          <div style={{ marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
            Примеры: "покажи средние продажи", "создай график тренда", "найди аномалии"
          </div>
        </section>
      </div>

      {(logs.length > 0 || results) && (
        <div style={results}>
          {logs.length > 0 && (
            <div style={{ ...section, marginBottom: 24 }}>
              <h2 style={{ marginTop: 0, marginBottom: 16 }}>📝 Логи обработки</h2>
              <div style={{
                background: '#11162a',
                borderRadius: 8,
                padding: 16,
                maxHeight: 300,
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: 12
              }}>
                {logs.map((log, idx) => (
                  <div key={idx} style={{ 
                    marginBottom: 8, 
                    color: log.message.includes('ОШИБКА') || log.message.includes('❌') ? '#ef4444' : '#94a3b8',
                    whiteSpace: 'pre-wrap'
                  }}>
                    <span style={{ color: '#6366f1' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {' '}
                    {log.message}
                  </div>
                ))}
              </div>
            </div>
          )}
          {results && results.chart && (
            <div style={{ ...section, marginBottom: 24 }}>
              <h2 style={{ marginTop: 0, marginBottom: 16 }}>📊 Визуализация</h2>
              <ChartPanel data={results.chart} />
            </div>
          )}
          {results && results.table && (
            <div style={section}>
              <h2 style={{ marginTop: 0, marginBottom: 16 }}>📋 Результаты</h2>
              <DataTable data={results.table} />
            </div>
          )}
          {results && results.message && (
            <div style={{ ...section, marginTop: 24 }}>
              <p style={{ color: results.type === 'error' ? '#ef4444' : '#94a3b8' }}>
                {results.message}
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

