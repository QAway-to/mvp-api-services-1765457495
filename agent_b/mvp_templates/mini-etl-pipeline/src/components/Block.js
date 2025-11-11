import { useMemo } from 'react';

const STEP_COLORS = {
  extract: { bg: '#1e3a8a', border: '#3b82f6', icon: '📥' },
  transform: { bg: '#7c2d12', border: '#f97316', icon: '🔄' },
  load: { bg: '#14532d', border: '#22c55e', icon: '📤' }
};

const STATUS_COLORS = {
  pending: { bg: '#1f2937', border: '#4b5563', text: '#9ca3af' },
  running: { bg: '#1e40af', border: '#3b82f6', text: '#93c5fd' },
  success: { bg: '#14532d', border: '#22c55e', text: '#86efac' },
  error: { bg: '#7f1d1d', border: '#ef4444', text: '#fca5a5' }
};

export default function Block({ step, status, data, onRun }) {
  const stepConfig = STEP_COLORS[step] || STEP_COLORS.extract;
  const statusConfig = STATUS_COLORS[status] || STATUS_COLORS.pending;
  
  const stepLabel = useMemo(() => {
    const labels = {
      extract: 'Extract',
      transform: 'Transform',
      load: 'Load'
    };
    return labels[step] || step;
  }, [step]);

  const previewCount = useMemo(() => {
    if (!data || !Array.isArray(data)) return 0;
    return data.length;
  }, [data]);

  return (
    <div
      style={{
        background: statusConfig.bg,
        border: `2px solid ${statusConfig.border}`,
        borderRadius: 12,
        padding: 20,
        minWidth: 280,
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'all 0.3s ease',
        opacity: status === 'pending' ? 0.6 : 1
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 24 }}>{stepConfig.icon}</span>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: statusConfig.text }}>
          {stepLabel}
        </h3>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 14, color: statusConfig.text, opacity: 0.8 }}>
          Status: <strong>{status}</strong>
        </div>
        
        {previewCount > 0 && (
          <div style={{ fontSize: 14, color: statusConfig.text, opacity: 0.8 }}>
            Records: <strong>{previewCount}</strong>
          </div>
        )}

        {status === 'success' && data && Array.isArray(data) && data.length > 0 && (
          <div style={{ 
            background: 'rgba(0,0,0,0.3)', 
            borderRadius: 8, 
            padding: 12, 
            fontSize: 12,
            color: statusConfig.text,
            maxHeight: 120,
            overflow: 'auto'
          }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Preview:</div>
            {data.slice(0, 3).map((item, idx) => (
              <div key={idx} style={{ marginBottom: 4, opacity: 0.9 }}>
                {item.title || item.id || `Item ${idx + 1}`}
              </div>
            ))}
            {data.length > 3 && (
              <div style={{ opacity: 0.7, marginTop: 4 }}>
                ... and {data.length - 3} more
              </div>
            )}
          </div>
        )}
      </div>

      {status === 'pending' && onRun && (
        <button
          onClick={onRun}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: stepConfig.border,
            border: 'none',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
            minWidth: 120,
            minHeight: 36
          }}
        >
          Run {stepLabel}
        </button>
      )}
    </div>
  );
}

