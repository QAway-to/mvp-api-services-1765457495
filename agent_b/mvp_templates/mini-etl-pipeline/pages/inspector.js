import { useState, useEffect, useRef } from 'react';
import Sidebar from '../src/components/Sidebar';
import Toolbar from '../src/components/Toolbar';
import PropertiesPanel from '../src/components/PropertiesPanel';

const blockTypes = [
  { value: 'extract', label: 'Extract', icon: '📥' },
  { value: 'transform', label: 'Transform', icon: '🔄' },
  { value: 'load', label: 'Load', icon: '📤' }
];

export default function InspectorPage() {
  const [blocks, setBlocks] = useState([]);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    // Load saved blocks from localStorage or use defaults
    const saved = typeof window !== 'undefined' ? localStorage.getItem('etl-pipeline-blocks') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBlocks(parsed);
      } catch (e) {
        console.error('Failed to load saved blocks:', e);
      }
    }
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleAddBlock = (type) => {
    if (!isMounted.current) return;
    const newBlock = {
      id: `${type}-${Date.now()}`,
      type,
      name: `${blockTypes.find(t => t.value === type)?.label} Block`,
      description: `Configure ${type} step`,
      status: 'pending',
      config: {},
      preview: null
    };
    setBlocks(prev => [...prev, newBlock]);
    setActiveBlockId(newBlock.id);
  };

  const handleBlockUpdate = (updatedBlock) => {
    if (!isMounted.current) return;
    setBlocks(prev => {
      const updated = prev.map(b => b.id === updatedBlock.id ? updatedBlock : b);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('etl-pipeline-blocks', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleDeleteBlock = (blockId) => {
    if (!isMounted.current) return;
    setBlocks(prev => {
      const filtered = prev.filter(b => b.id !== blockId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('etl-pipeline-blocks', JSON.stringify(filtered));
      }
      return filtered;
    });
    if (activeBlockId === blockId) {
      setActiveBlockId(null);
    }
  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('etl-pipeline-blocks', JSON.stringify(blocks));
      alert('Pipeline configuration saved!');
    }
  };

  const activeBlock = blocks.find(b => b.id === activeBlockId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0b1120' }}>
      <Sidebar currentPage="inspector" />
      
      <div style={{ marginLeft: '240px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Toolbar
          onRun={() => {}}
          onSave={handleSave}
          onToggleLogs={() => {}}
          isRunning={isRunning}
          showLogs={false}
          status={null}
        />
        
        <div style={{ display: 'flex', flex: 1, padding: '24px', gap: '24px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ color: '#f8fafc', fontSize: '20px', marginBottom: '16px' }}>
                Pipeline Blocks
              </h2>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                {blockTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => handleAddBlock(type.value)}
                    style={{
                      padding: '12px 20px',
                      background: 'rgba(56,189,248,0.1)',
                      border: '1px solid rgba(56,189,248,0.3)',
                      borderRadius: '8px',
                      color: '#38bdf8',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{type.icon}</span>
                    <span>Add {type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {blocks.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#64748b',
                  background: '#111c33',
                  borderRadius: '12px',
                  border: '1px solid rgba(56,189,248,0.25)'
                }}>
                  <p>No blocks configured</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>
                    Click the buttons above to add ETL blocks
                  </p>
                </div>
              ) : (
                blocks.map((block, index) => (
                  <div
                    key={block.id}
                    onClick={() => setActiveBlockId(block.id === activeBlockId ? null : block.id)}
                    style={{
                      padding: '16px 20px',
                      background: activeBlockId === block.id ? 'rgba(56,189,248,0.1)' : '#111c33',
                      border: `2px solid ${activeBlockId === block.id ? '#38bdf8' : 'rgba(56,189,248,0.25)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>
                        {blockTypes.find(t => t.value === block.type)?.icon || '📦'}
                      </span>
                      <div>
                        <div style={{ color: '#f8fafc', fontWeight: 500, fontSize: '14px' }}>
                          {block.name}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                          {block.description}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBlock(block.id);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '6px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {activeBlock && (
            <PropertiesPanel
              block={activeBlock}
              onUpdate={handleBlockUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}

