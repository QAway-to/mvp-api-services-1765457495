import { useState, useEffect, useRef } from 'react';
import Canvas from '../src/components/Canvas';
import LogPanel from '../src/components/LogPanel';
import { runPipeline, ETL_STEPS, STEP_STATUS } from '../src/lib/pipeline';

const containerStyle = {
  fontFamily: 'Inter, sans-serif',
  padding: '24px 32px',
  background: '#0b1120',
  color: '#f8fafc',
  minHeight: '100vh'
};

const headerStyle = {
  marginBottom: 24,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16
};

const cardStyle = {
  background: '#111c33',
  borderRadius: 16,
  padding: 24,
  marginBottom: 24,
  border: '1px solid rgba(56,189,248,0.25)',
  boxShadow: '0 20px 28px rgba(8, 47, 73, 0.45)'
};

export default function MiniETL() {
  const [blocks, setBlocks] = useState([
    { step: ETL_STEPS.EXTRACT, status: STEP_STATUS.PENDING, data: null },
    { step: ETL_STEPS.TRANSFORM, status: STEP_STATUS.PENDING, data: null },
    { step: ETL_STEPS.LOAD, status: STEP_STATUS.PENDING, data: null }
  ]);
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const updateBlock = (step, updates) => {
    if (!isMounted.current) return;
    setBlocks(prev => prev.map(block => 
      block.step === step ? { ...block, ...updates } : block
    ));
  };

  const addLog = (log) => {
    if (!isMounted.current) return;
    setLogs(prev => [...prev, log]);
  };

  const handleRunPipeline = async () => {
    if (isRunning || !isMounted.current) return;

    setIsRunning(true);
    setLogs([]);
    
    // Reset all blocks
    blocks.forEach(block => {
      updateBlock(block.step, { status: STEP_STATUS.PENDING, data: null });
    });

    try {
      const result = await runPipeline();

      if (!isMounted.current) return;

      // Update blocks with results
      if (result.results.extract) {
        updateBlock(ETL_STEPS.EXTRACT, { 
          status: STEP_STATUS.SUCCESS, 
          data: result.results.extract 
        });
      }
      if (result.results.transform) {
        updateBlock(ETL_STEPS.TRANSFORM, { 
          status: STEP_STATUS.SUCCESS, 
          data: result.results.transform 
        });
      }
      if (result.results.load) {
        updateBlock(ETL_STEPS.LOAD, { 
          status: STEP_STATUS.SUCCESS, 
          data: result.results.transform // Use transformed data for load preview
        });
      }

      // Update metrics
      if (result.results.extract && result.results.transform) {
        setMetrics({
          rows_in: result.results.extract.length,
          rows_out: result.results.transform.length,
          dedup_removed: result.results.extract.length - result.results.transform.length
        });
      }

      // Add logs
      result.logs.forEach(log => addLog(log));

      if (!result.success) {
        const errorBlock = result.logs.find(l => l.status === STEP_STATUS.ERROR);
        if (errorBlock) {
          updateBlock(errorBlock.step, { status: STEP_STATUS.ERROR });
        }
      }
    } catch (error) {
      if (isMounted.current) {
        addLog({ 
          step: 'system', 
          status: STEP_STATUS.ERROR, 
          message: `Pipeline execution failed: ${error.message}` 
        });
      }
    } finally {
      if (isMounted.current) {
        setIsRunning(false);
      }
    }
  };

  const handleRunBlock = async (step) => {
    if (isRunning || !isMounted.current) return;

    updateBlock(step, { status: STEP_STATUS.RUNNING });
    addLog({ step, status: STEP_STATUS.RUNNING, message: `Running ${step}...` });

    try {
      let response;
      if (step === ETL_STEPS.EXTRACT) {
        response = await fetch('/api/fetch');
      } else if (step === ETL_STEPS.TRANSFORM) {
        const extractBlock = blocks.find(b => b.step === ETL_STEPS.EXTRACT);
        if (!extractBlock?.data) {
          throw new Error('Extract must be run first');
        }
        response = await fetch('/api/transform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: extractBlock.data })
        });
      } else if (step === ETL_STEPS.LOAD) {
        const transformBlock = blocks.find(b => b.step === ETL_STEPS.TRANSFORM);
        if (!transformBlock?.data) {
          throw new Error('Transform must be run first');
        }
        response = await fetch('/api/load', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: transformBlock.data })
        });
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (!isMounted.current) return;

      if (step === ETL_STEPS.EXTRACT) {
        updateBlock(step, { status: STEP_STATUS.SUCCESS, data: data.products });
      } else {
        updateBlock(step, { status: STEP_STATUS.SUCCESS, data: data.products || data.result });
      }

      addLog({ step, status: STEP_STATUS.SUCCESS, message: `${step} completed successfully` });
    } catch (error) {
      if (isMounted.current) {
        updateBlock(step, { status: STEP_STATUS.ERROR });
        addLog({ step, status: STEP_STATUS.ERROR, message: `${step} failed: ${error.message}` });
      }
    }
  };

  return (
    <main style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ fontSize: 36, margin: 0 }}>🔄 Mini‑ETL Pipeline</h1>
          <p style={{ color: '#94a3b8', marginTop: 8 }}>
            Extract products from DummyJSON API, transform and load them.
          </p>
        </div>
        <button
          onClick={handleRunPipeline}
          disabled={isRunning}
          style={{
            padding: '12px 24px',
            borderRadius: 12,
            background: isRunning ? '#0f172a' : 'linear-gradient(135deg,#38bdf8,#0ea5e9)',
            border: 'none',
            color: isRunning ? '#475569' : '#0b1120',
            fontWeight: 700,
            cursor: isRunning ? 'wait' : 'pointer',
            fontSize: 16,
            minWidth: 180,
            minHeight: 48
          }}
        >
          {isRunning ? 'Running...' : '▶ Run Full Pipeline'}
        </button>
      </header>

      <section style={cardStyle}>
        <Canvas 
          blocks={blocks} 
          onBlockRun={handleRunBlock}
          metrics={metrics}
        />
      </section>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0, fontSize: 20, fontWeight: 700 }}>📝 Pipeline Logs</h2>
        <LogPanel logs={logs} />
      </section>
    </main>
  );
}
