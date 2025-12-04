import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Use bodyParser with size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get file from request body (sent as base64 or buffer)
    const { fileData, fileName, fileType } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'No file data provided' });
    }

    const fileExtension = (fileName || fileType || '').split('.').pop().toLowerCase();
    let data = [];
    let columns = [];

    // Convert base64 to buffer if needed
    let fileBuffer;
    if (typeof fileData === 'string' && fileData.startsWith('data:')) {
      // Data URL format: data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,...
      const base64Data = fileData.split(',')[1];
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else if (typeof fileData === 'string') {
      // Plain base64
      fileBuffer = Buffer.from(fileData, 'base64');
    } else {
      // Already a buffer
      fileBuffer = Buffer.from(fileData);
    }

    // Parse based on file type
    if (fileExtension === 'csv') {
      const csvText = fileBuffer.toString('utf-8');
      const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });
      data = parsed.data;
      columns = parsed.meta.fields || [];
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      columns = Object.keys(data[0] || {});
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Use CSV or Excel files.' });
    }

    // Validate data
    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'File is empty or could not be parsed' });
    }

    // Clean data - remove completely empty rows
    data = data.filter(row => {
      return Object.values(row).some(val => val !== null && val !== undefined && val !== '');
    });

    // Return parsed data
    return res.status(200).json({
      success: true,
      rows: data.length,
      columns: columns.length,
      columnNames: columns,
      sample: data.slice(0, 10), // First 10 rows as sample
      data: data, // Full data (for small files)
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Error processing file',
      message: error.message 
    });
  }
}

