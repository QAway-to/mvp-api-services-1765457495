import { useState } from 'react';

export default function FileUploader({ onDataLoaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      setError('Поддерживаются только CSV и Excel файлы (.csv, .xlsx, .xls)');
      return;
    }

    // Validate file size (4.5 MB limit for Vercel)
    if (file.size > 4.5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 4.5 MB');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      // Read file as base64 for Vercel compatibility
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const base64Data = e.target.result;
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileData: base64Data,
              fileName: file.name,
              fileType: file.type
            })
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Ошибка загрузки файла');
          }

          // Store full data in sessionStorage for later use
          if (result.data) {
            sessionStorage.setItem('uploadedData', JSON.stringify(result.data));
            sessionStorage.setItem('uploadedColumns', JSON.stringify(result.columnNames));
          }

          onDataLoaded({
            rows: result.rows,
            columns: result.columns,
            columnNames: result.columnNames,
            sample: result.sample,
            data: result.data
          });
        } catch (error) {
          console.error('Upload error:', error);
          setError(error.message || 'Ошибка загрузки файла');
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setError('Ошибка чтения файла');
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File read error:', error);
      setError('Ошибка чтения файла');
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
        {uploading ? 'Загрузка...' : 'Поддерживаются CSV и Excel файлы (до 4.5 MB)'}
      </p>
      {error && (
        <div style={{
          marginTop: 8,
          padding: 12,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 8,
          color: '#ef4444',
          fontSize: 14
        }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
}

