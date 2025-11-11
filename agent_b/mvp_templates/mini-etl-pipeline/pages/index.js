import { useState, useRef, useEffect } from 'react';
import Sidebar from '../src/components/Sidebar';
import Toolbar from '../src/components/Toolbar';
import Canvas from '../src/components/Canvas';
import PropertiesPanel from '../src/components/PropertiesPanel';
import LogPanel from '../src/components/LogPanel';
import { logger } from '../src/lib/logger';

export default function PipelineCanvas() {
  const [pipeline, setPipeline] = useState({
    blocks: [
      { id: 'extract-1', type: 'extract', label: 'Fetch Products', x: 100, y: 200, config: { sourceUrl: 'https://dummyjson.com/products?limit=100' }, status: 'idle' },
      { id: 'transform-1', type: 'transform', label: 'Filter & Aggregate', x: 400, y: 200, config: { filters: [], aggregations: [] }, status: 'idle' },
      { id: 'load-1', type: 'load', label: 'Output Result', x: 700, y: 200, config: { target: 'preview', format: 'json' }, status: 'idle' }
    ],
    connections: [
      { from: 'extract-1', to: 'transform-1' },
      { from: 'transform-1', to: 'load-1' }
    ]
  });
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [logsVisible, setLogsVisible] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    logger.clear();
    logger.info('Pipeline canvas initialized');
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleBlockClick = (blockId) => {
    const block = pipeline.blocks.find(b => b.id === blockId);
    setSelectedBlock(block);
    logger.info(`Block selected: ${blockId}`, { type: block?.type });
  };

  const handleBlockUpdate = (blockId, updates) => {
    if (!isMounted.current) return;
    setPipeline(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
    }));
  };

  const handleRun = async () => {
    if (isRunning || !isMounted.current) return;
    setIsRunning(true);
    logger.info('Pipeline execution started');

    // Reset block statuses
    setPipeline(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => ({ ...b, status: 'idle', metrics: null }))
    }));

    try {
      // Update extract block status
      setPipeline(prev => ({
        ...prev,
        blocks: prev.blocks.map(b => b.type === 'extract' ? { ...b, status: 'running' } : b)
      }));
      logger.info('Running Extract step...');

      const response = await fetch('/api/run-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Pipeline execution failed');
      }

      // Update block statuses and metrics
      result.results.forEach((stepResult, idx) => {
        const blockType = ['extract', 'transform', 'load'][idx];
        setPipeline(prev => ({
          ...prev,
          blocks: prev.blocks.map(b => 
            b.type === blockType 
              ? { 
                  ...b, 
                  status: stepResult.success ? 'success' : 'error',
                  metrics: {
                    rowsProcessed: stepResult.rowsProcessed || 0,
                    duration: stepResult.duration || 0
                  }
                } 
              : b
          )
        }));
        logger.success(`${blockType} step completed`, { rowsProcessed: stepResult.rowsProcessed });
      });

      logger.success('Pipeline execution completed successfully', { 
        totalRows: result.finalData?.length || 0 
      });
    } catch (error) {
      logger.error('Pipeline execution failed', { error: error.message });
      setPipeline(prev => ({
        ...prev,
        blocks: prev.blocks.map(b => ({ ...b, status: 'error' }))
      }));
    } finally {
      if (isMounted.current) {
        setIsRunning(false);
      }
    }
  };

  const handleSave = () => {
    logger.info('Pipeline saved', { blocks: pipeline.blocks.length });
    // In a real app, this would save to a backend
    alert('Pipeline saved! (PoC - not persisted)');
  };

  const handleToggleLogs = () => {
    setLogsVisible(prev => !prev);
  };

  const handlePropertiesUpdate = (blockId, updates) => {
    handleBlockUpdate(blockId, updates);
    logger.info(`Block ${blockId} updated`, updates);
  };

  return (
    <div style={containerStyle}>
      <Sidebar currentPage="/" />
      <div style={getMainContentStyle(!!selectedBlock)}>
        <Toolbar
          onRun={handleRun}
          onSave={handleSave}
          onToggleLogs={handleToggleLogs}
          isRunning={isRunning}
          logsVisible={logsVisible}
        />
        <Canvas
          pipeline={pipeline}
          onBlockClick={handleBlockClick}
          onBlockUpdate={handleBlockUpdate}
        />
        <LogPanel logs={logger.getLogs()} visible={logsVisible} />
      </div>
      {selectedBlock && (
        <PropertiesPanel
          block={selectedBlock}
          onUpdate={handlePropertiesUpdate}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  height: '100vh',
  background: '#0b1120',
  color: '#f8fafc',
  fontFamily: 'Inter, sans-serif',
  overflow: 'hidden'
};

const getMainContentStyle = (hasSelectedBlock) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  marginLeft: 240,
  marginRight: hasSelectedBlock ? 320 : 0,
  transition: 'margin-right 0.3s'
});
