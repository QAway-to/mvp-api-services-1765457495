import { useState } from 'react';

export default function FileUploader({ onDataLoaded }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    
    try {
      // Simulate file upload for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const mockData = {
        rows: 150,
        columns: 5,
        sample: [
          { id: 1, name: 'Product A', sales: 1200, revenue: 15000, date: '2024-01' },
          { id: 2, name: 'Product B', sales: 800, revenue: 12000, date: '2024-02' },
          { id: 3, name: 'Product C', sales: 1500, revenue: 18000, date: '2024-03' }
        ]
      };
      
      onDataLoaded(mockData);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <input 
        type="file" 
        accept=".csv,.xlsx,.xls" 
        onChange={handleUpload}
        disabled={uploading}
        style={{
          width: '100%',
          padding: '12px',
          background: '#11162a',
          border: '1px solid #334155',
          borderRadius: 8,
          color: '#f8fafc',
          cursor: uploading ? 'not-allowed' : 'pointer'
        }}
      />
      <p style={{ color: '#94a3b8', marginTop: 8, fontSize: 14 }}>
        {uploading ? 'Загрузка...' : 'Поддерживаются CSV и Excel файлы'}
      </p>
    </div>
  );
}

