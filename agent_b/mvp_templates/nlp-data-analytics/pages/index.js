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

  // Load sample data on mount for demo
  useEffect(() => {
    setData({
      rows: sampleData.length,
      columns: Object.keys(sampleData[0] || {}).length,
      sample: sampleData.slice(0, 5)
    });
  }, []);

  const handleQuerySubmit = async (q) => {
    if (!q.trim()) return;
    
    setLoading(true);
    try {
      // Simulate API call with mock response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock response based on query
      const queryLower = q.toLowerCase();
      let mockResult = null;
      
      if (queryLower.includes('средн') || queryLower.includes('average')) {
        mockResult = {
          type: 'statistics',
          message: 'Средние значения по числовым колонкам',
          table: [
            { column: 'sales', average: 1250.5, min: 500, max: 2000 },
            { column: 'revenue', average: 15230.8, min: 8000, max: 25000 }
          ],
          chart: {
            type: 'bar',
            data: [
              { name: 'Sales', value: 1250.5 },
              { name: 'Revenue', value: 15230.8 }
            ]
          }
        };
      } else if (queryLower.includes('график') || queryLower.includes('chart') || queryLower.includes('тренд')) {
        mockResult = {
          type: 'chart',
          message: 'График тренда продаж',
          chart: {
            type: 'line',
            data: [
              { date: '2024-01', value: 1000 },
              { date: '2024-02', value: 1200 },
              { date: '2024-03', value: 1500 },
              { date: '2024-04', value: 1400 },
              { date: '2024-05', value: 1600 }
            ]
          },
          table: null
        };
      } else {
        mockResult = {
          type: 'text',
          message: `Обработан запрос: "${q}"`,
          table: sampleData.slice(0, 10),
          chart: null
        };
      }
      
      setResults(mockResult);
    } catch (error) {
      console.error('Error processing query:', error);
      setResults({
        type: 'error',
        message: 'Ошибка обработки запроса',
        table: null,
        chart: null
      });
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
          <div style={{ marginTop: 16, padding: 12, background: '#11162a', borderRadius: 8, fontSize: 12, color: '#94a3b8' }}>
            💡 <strong>Демо режим:</strong> Используются примерные данные для демонстрации
          </div>
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

      {results && (
        <div style={results}>
          {results.chart && (
            <div style={{ ...section, marginBottom: 24 }}>
              <h2 style={{ marginTop: 0, marginBottom: 16 }}>📊 Визуализация</h2>
              <ChartPanel data={results.chart} />
            </div>
          )}
          {results.table && (
            <div style={section}>
              <h2 style={{ marginTop: 0, marginBottom: 16 }}>📋 Результаты</h2>
              <DataTable data={results.table} />
            </div>
          )}
          {results.message && (
            <div style={{ ...section, marginTop: 24 }}>
              <p style={{ color: '#94a3b8' }}>{results.message}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

