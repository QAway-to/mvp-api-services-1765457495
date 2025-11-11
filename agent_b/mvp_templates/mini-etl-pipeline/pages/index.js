import { useState, useEffect, useRef } from 'react';
import Sidebar from '../src/components/Sidebar';
import Toolbar from '../src/components/Toolbar';
import Canvas from '../src/components/Canvas';
import PropertiesPanel from '../src/components/PropertiesPanel';
import LogPanel from '../src/components/LogPanel';

const defaultBlocks = [
  {
    id: 'extract-1',
    type: 'extract',
    name: 'Fetch Products',
    description: 'Extract products from DummyJSON API',
    status: 'pending',
    config: {},
    preview: null
  },
  {
    id: 'transform-1',
    type: 'transform',
    name: 'Filter & Sort',
    description: 'Filter and sort products by price',
    status: 'pending',
    config: {
      sortBy: 'price',
      sortDirection: 'asc'
    },
    preview: null
  },
  {
    id: 'load-1',
    type: 'load',
    name: 'Export Results',
    description: 'Load transformed data to output',
    status: 'pending',
    config: {
      target: 'console'
    },
    preview: null
  }
];

export default function CanvasPage() {
  const [blocks, setBlocks] = useState(defaultBlocks);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('idle');
  const [logs, setLogs] = useState([]);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleBlockClick = (blockId) => {
    setActiveBlockId(blockId === activeBlockId ? null : blockId);
  };

  const handleBlockUpdate = (updatedBlock) => {
    if (!isMounted.current) return;
    setBlocks(prev => prev.map(b => b.id === updatedBlock.id ? updatedBlock : b));
  };

  const handleRun = async () => {
    if (isRunning || !isMounted.current) return;

    setIsRunning(true);
    setStatus('running');
    setLogs([]);
    setActiveBlockId(null);

    // Reset all block statuses
    setBlocks(prev => prev.map(b => ({ ...b, status: 'pending', preview: null })));

    try {
      const response = await fetch('/api/run-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline: blocks })
      });

      const result = await response.json();

      if (!isMounted.current) return;

      if (result.success) {
        setStatus('success');
        
        // Update block statuses and previews
        setBlocks(prev => prev.map((block) => {
          const log = result.logs.find(l => l.type === block.type);
          const preview = Array.isArray(result.data) && result.data.length > 0 
            ? result.data.slice(0, 3) 
            : null;
          return {
            ...block,
            status: log?.status === 'success' ? 'success' : log?.status === 'error' ? 'error' : 'pending',
            preview
          };
        }));
      } else {
        setStatus('error');
      }

      setLogs(result.logs || []);
    } catch (error) {
      if (isMounted.current) {
        setStatus('error');
        setLogs([{
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Pipeline execution failed: ${error.message}`
        }]);
      }
    } finally {
      if (isMounted.current) {
        setIsRunning(false);
      }
    }
  };

  const handleSave = () => {
    // In production, this would save to backend/database
    const pipelineConfig = {
      blocks: blocks.map(b => ({
        id: b.id,
        type: b.type,
        name: b.name,
        description: b.description,
        config: b.config
      })),
      savedAt: new Date().toISOString()
    };
    
    console.log('Saving pipeline:', pipelineConfig);
    // You could also show a toast notification here
    alert('Pipeline configuration saved!');
  };

  const activeBlock = blocks.find(b => b.id === activeBlockId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0b1120' }}>
      <Sidebar currentPage="canvas" />
      
      <div style={{ marginLeft: '240px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Toolbar
          onRun={handleRun}
          onSave={handleSave}
          onToggleLogs={() => setShowLogs(!showLogs)}
          isRunning={isRunning}
          showLogs={showLogs}
          status={status}
        />
        
        <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
          <div style={{ flex: 1, marginRight: activeBlock ? '320px' : '0' }}>
            <Canvas
              blocks={blocks}
              onBlockClick={handleBlockClick}
              activeBlockId={activeBlockId}
            />
          </div>
          
          {activeBlock && (
            <PropertiesPanel
              block={activeBlock}
              onUpdate={handleBlockUpdate}
            />
          )}
        </div>
      </div>

      {showLogs && (
        <LogPanel
          logs={logs}
          onClose={() => setShowLogs(false)}
        />
      )}
    </div>
  );
}
