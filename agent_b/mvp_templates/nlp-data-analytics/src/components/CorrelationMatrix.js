import { ResponsiveContainer, Cell } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function CorrelationMatrix({ correlationData }) {
  if (!correlationData || !correlationData.matrix || !correlationData.columns) {
    return <p style={{ color: '#94a3b8' }}>Нет данных для корреляционной матрицы</p>;
  }

  const { matrix, columns } = correlationData;

  // Prepare data for heatmap visualization
  const heatmapData = columns.map(col1 => {
    const row = { column: col1 };
    columns.forEach(col2 => {
      row[col2] = matrix[col1][col2];
    });
    return row;
  });

  // Get color based on correlation value
  const getColor = (value) => {
    if (value >= 0.7) return '#10b981'; // Strong positive (green)
    if (value >= 0.3) return '#3b82f6'; // Moderate positive (blue)
    if (value >= -0.3) return '#94a3b8'; // Weak/no correlation (gray)
    if (value >= -0.7) return '#f59e0b'; // Moderate negative (orange)
    return '#ef4444'; // Strong negative (red)
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 16, fontSize: 14, color: '#94a3b8' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, background: '#10b981', borderRadius: 4 }}></div>
            <span>Сильная положительная (≥0.7)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, background: '#3b82f6', borderRadius: 4 }}></div>
            <span>Умеренная положительная (0.3-0.7)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, background: '#94a3b8', borderRadius: 4 }}></div>
            <span>Слабая/нет (-0.3-0.3)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, background: '#f59e0b', borderRadius: 4 }}></div>
            <span>Умеренная отрицательная (-0.7--0.3)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, background: '#ef4444', borderRadius: 4 }}></div>
            <span>Сильная отрицательная (≤-0.7)</span>
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 500 }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: 12
        }}>
          <thead>
            <tr>
              <th style={{ 
                padding: '8px', 
                textAlign: 'left', 
                background: '#1e293b',
                color: '#94a3b8',
                position: 'sticky',
                left: 0,
                zIndex: 2
              }}></th>
              {columns.map(col => (
                <th key={col} style={{ 
                  padding: '8px', 
                  textAlign: 'center', 
                  background: '#1e293b',
                  color: '#94a3b8',
                  minWidth: 80,
                  fontSize: 11
                }}>
                  {col.length > 10 ? `${col.substring(0, 10)}...` : col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {columns.map((col1, idx1) => (
              <tr key={col1}>
                <td style={{ 
                  padding: '8px', 
                  background: '#1e293b',
                  color: '#f8fafc',
                  position: 'sticky',
                  left: 0,
                  zIndex: 1,
                  fontWeight: 500,
                  fontSize: 11
                }}>
                  {col1.length > 15 ? `${col1.substring(0, 15)}...` : col1}
                </td>
                {columns.map((col2, idx2) => {
                  const value = matrix[col1][col2];
                  const color = getColor(value);
                  const opacity = Math.abs(value);
                  
                  return (
                    <td
                      key={col2}
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                        background: idx1 === idx2 
                          ? 'rgba(99, 102, 241, 0.3)' 
                          : `rgba(${color === '#10b981' ? '16, 185, 129' : color === '#3b82f6' ? '59, 130, 246' : color === '#ef4444' ? '239, 68, 68' : color === '#f59e0b' ? '245, 158, 11' : '148, 163, 184'}, ${opacity * 0.3})`,
                        color: idx1 === idx2 ? '#f8fafc' : '#f8fafc',
                        fontWeight: Math.abs(value) > 0.7 ? 600 : 400,
                        border: '1px solid #334155',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (idx1 !== idx2) {
                          e.currentTarget.style.background = `rgba(${color === '#10b981' ? '16, 185, 129' : color === '#3b82f6' ? '59, 130, 246' : color === '#ef4444' ? '239, 68, 68' : color === '#f59e0b' ? '245, 158, 11' : '148, 163, 184'}, ${opacity * 0.5})`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (idx1 !== idx2) {
                          e.currentTarget.style.background = `rgba(${color === '#10b981' ? '16, 185, 129' : color === '#3b82f6' ? '59, 130, 246' : color === '#ef4444' ? '239, 68, 68' : color === '#f59e0b' ? '245, 158, 11' : '148, 163, 184'}, ${opacity * 0.3})`;
                        }
                      }}
                      title={`${col1} ↔ ${col2}: ${value.toFixed(3)}`}
                    >
                      {value.toFixed(3)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

