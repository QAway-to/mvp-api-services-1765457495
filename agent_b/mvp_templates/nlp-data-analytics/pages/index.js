import { useState, useEffect } from 'react';
import FileUploader from '../src/components/FileUploader';
import ChatInterface from '../src/components/ChatInterface';
import DataTable from '../src/components/DataTable';
import ChartPanel from '../src/components/ChartPanel';
import sampleData from '../src/mock-data/sample';

// Стили для скроллбара (современный вид)
const scrollbarStyles = `
  /* Webkit (Chrome, Safari, Edge) */
  *::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  *::-webkit-scrollbar-track {
    background: #11162a;
    border-radius: 4px;
  }
  *::-webkit-scrollbar-thumb {
    background: #3b82f6;
    border-radius: 4px;
  }
  *::-webkit-scrollbar-thumb:hover {
    background: #2563eb;
  }
  /* Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: #3b82f6 #11162a;
  }
`;

const container = {
  fontFamily: 'Inter, sans-serif',
  padding: '24px 32px',
  background: '#0f172a',
  color: '#f8fafc',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column'
};

const header = {
  marginBottom: 32,
  flexShrink: 0
};

// Основной контейнер с тремя колонками - фиксированная высота
const getMainGridStyle = (isMobile = false) => ({
  display: 'grid',
  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
  gap: 24,
  flex: '1 1 auto',
  minHeight: 0, // Важно для работы overflow
  height: isMobile ? 'auto' : 'calc(100vh - 180px)' // Высота окна минус хедер и отступы
});

const section = {
  background: '#1e1f33',
  borderRadius: 16,
  padding: 24,
  border: '1px solid rgba(59,130,246,0.2)',
  boxShadow: '0 20px 35px rgba(15, 23, 42, 0.35)',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0, // Важно для работы overflow
  overflow: 'hidden' // Предотвращаем выход контента за границы
};

// Внутренний контейнер для скролла внутри секции
const sectionContent = {
  flex: '1 1 auto',
  overflowY: 'auto',
  overflowX: 'hidden',
  minHeight: 0
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
  const [isMobile, setIsMobile] = useState(false);

  // Определение мобильного устройства
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleDataLoaded = (loadedData) => {
    setData(loadedData);
    if (loadedData.logs && loadedData.logs.length > 0) {
      setLogs(loadedData.logs);
    }
  };

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
      setLogs([{ timestamp: new Date().toISOString(), message: '❌ ОШИБКА: Нет данных для анализа' }]);
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
      console.log('[Query] Логи из ответа:', result.logs);

      if (!response.ok) {
        console.error('[Query] Ошибка ответа:', result);
        console.error('[Query] Детали ошибки:', result.details);
        console.error('[Query] Stack trace:', result.stack);
        
        // Build detailed error message
        let errorMessage = result.error || result.message || 'Ошибка обработки запроса';
        if (result.details) {
          errorMessage += `\n\nДетали:\n${JSON.stringify(result.details, null, 2)}`;
          if (result.details.suggestion) {
            errorMessage += `\n\n💡 Решение: ${result.details.suggestion}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      setResults(result);
      
      // Show logs if available
      if (result.logs && result.logs.length > 0) {
        setLogs(result.logs);
      }
    } catch (error) {
      console.error('[Query] Ошибка:', error);
      console.error('[Query] Error stack:', error.stack);
      
      const errorMessage = error.message || 'Ошибка обработки запроса';
      
      setResults({
        type: 'error',
        message: errorMessage,
        table: null,
        chart: null,
        logs: logs,
        errorDetails: error.stack
      });
      
      setLogs(prev => [
        ...prev, 
        { 
          timestamp: new Date().toISOString(), 
          message: `❌ ОШИБКА: ${errorMessage}` 
        },
        {
          timestamp: new Date().toISOString(),
          message: `Детали: ${error.stack?.substring(0, 500) || 'Нет дополнительной информации'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={container}>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <header style={header}>
        <h1 style={{ fontSize: 36, margin: 0 }}>📊 NLP Data Analytics</h1>
        <p style={{ color: '#94a3b8', marginTop: 8 }}>
          Анализ данных через естественный язык. Загрузите CSV/Excel или подключите БД.
        </p>
      </header>

      {/* Основной трёхколоночный layout с фиксированной высотой */}
      <div style={getMainGridStyle(isMobile)}>
        {/* Левая колонка: Загрузка данных */}
        <section style={section}>
          <h2 style={{ marginTop: 0, marginBottom: 16, flexShrink: 0 }}>📁 Загрузка данных</h2>
          <div style={sectionContent}>
            <FileUploader onDataLoaded={handleDataLoaded} />
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
          </div>
        </section>

        {/* Средняя колонка: Задайте вопрос */}
        <section style={section}>
          <h2 style={{ marginTop: 0, marginBottom: 16, flexShrink: 0 }}>💬 Задайте вопрос</h2>
          <div style={sectionContent}>
            <ChatInterface 
              query={query}
              onQueryChange={setQuery}
              onQuerySubmit={handleQuerySubmit}
              loading={loading}
            />
            <div style={{ marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
              Примеры: "покажи средние продажи", "создай график тренда", "найди аномалии"
            </div>
          </div>
        </section>

        {/* Правая колонка: Результаты анализа (включая ответ LLM) */}
        <section style={section}>
          <h2 style={{ marginTop: 0, marginBottom: 16, flexShrink: 0 }}>📊 Результаты анализа</h2>
          <div style={sectionContent}>
            {loading && (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 14 }}>⏳ Обработка запроса...</div>
              </div>
            )}
            
            {!loading && results && results.chart && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, color: '#f8fafc' }}>📈 Визуализация</h3>
                <ChartPanel data={results.chart} />
              </div>
            )}
            
            {!loading && results && results.table && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, color: '#f8fafc' }}>📋 Данные</h3>
                <div style={{ overflowX: 'auto' }}>
                  <DataTable data={results.table} />
                </div>
              </div>
            )}
            
            {/* Блок "Ответ от LLM" внутри правой колонки */}
            {!loading && results && results.message && (
              <div style={{ marginTop: results.chart || results.table ? 24 : 0 }}>
                <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, color: '#f8fafc' }}>💬 Ответ от LLM</h3>
                <div style={{
                  color: results.type === 'error' ? '#ef4444' : '#94a3b8',
                  whiteSpace: 'pre-wrap',
                  fontFamily: results.type === 'error' ? 'monospace' : 'inherit',
                  fontSize: results.type === 'error' ? 12 : 14,
                  lineHeight: 1.6,
                  wordBreak: 'break-word',
                  padding: results.type === 'error' ? 12 : 0,
                  background: results.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  borderRadius: results.type === 'error' ? 8 : 0
                }}>
                  {results.message}
                </div>
                {results.type === 'error' && results.errorDetails && (
                  <details style={{ marginTop: 16 }}>
                    <summary style={{ color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>
                      Показать технические детали
                    </summary>
                    <pre style={{
                      marginTop: 8,
                      padding: 12,
                      background: '#11162a',
                      borderRadius: 8,
                      color: '#ef4444',
                      fontSize: 11,
                      overflow: 'auto',
                      maxHeight: 200
                    }}>
                      {results.errorDetails}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            {!loading && !results && (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                💡 Результаты анализа появятся здесь после отправки запроса
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Логи обработки - внизу, вне основного layout'а, не влияют на высоту колонок */}
      {logs.length > 0 && (
        <div style={{ 
          ...section, 
          marginTop: 24, 
          flexShrink: 0,
          maxHeight: '200px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>📝 Логи обработки</h2>
          <div style={{
            background: '#11162a',
            borderRadius: 8,
            padding: 16,
            maxHeight: 150,
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
    </main>
  );
}

