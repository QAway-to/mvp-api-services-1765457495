import { useState } from 'react';

export default function ScrapedDataTable({ data }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', color: '#9ca3af' }}>
        No data to display
      </div>
    );
  }

  // Get all unique column names from all rows
  const allColumns = new Set();
  data.forEach(row => {
    Object.keys(row).forEach(key => allColumns.add(key));
  });
  const columns = Array.from(allColumns);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  return (
    <div className="card">
      <header className="card-header">
        <h3>📊 Scraped Data</h3>
        <p>{data.length} rows extracted</p>
      </header>
      <div style={{ overflowX: 'auto', marginTop: '16px' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((col, colIdx) => {
                  const value = row[col];
                  return (
                    <td key={colIdx} style={{ whiteSpace: 'nowrap' }}>
                      {value !== null && value !== undefined ? String(value) : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn"
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

