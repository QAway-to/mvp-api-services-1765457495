export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, config = {} } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Data must be an array' });
    }

    // Simulate loading to target (in production, this would write to database, file, etc.)
    const target = config.target || 'console';
    
    // For demo purposes, we just return a summary
    const summary = {
      totalRecords: data.length,
      sampleRecord: data[0] || null,
      fields: data.length > 0 ? Object.keys(data[0] || {}) : [],
      loadedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      data: data,
      message: `Loaded ${data.length} records to ${target}`,
      preview: data.slice(0, 3),
      metadata: {
        target,
        recordCount: data.length,
        ...summary
      }
    });
  } catch (error) {
    console.error('[load-target] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
}

