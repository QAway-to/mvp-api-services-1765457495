// Main ETL pipeline orchestrator (10 lines)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pipeline } = req.body;
    const results = [];
    let currentData = null;

    // Run Extract
    const extractRes = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/fetch-source`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pipeline.blocks.find(b => b.type === 'extract')?.config || {})
    });
    const extractData = await extractRes.json();
    if (!extractData.success) throw new Error(extractData.error);
    currentData = extractData.data;
    results.push({ step: 'extract', ...extractData });

    // Run Transform
    const transformRes = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/transform-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: currentData, ...(pipeline.blocks.find(b => b.type === 'transform')?.config || {}) })
    });
    const transformData = await transformRes.json();
    if (!transformData.success) throw new Error(transformData.error);
    currentData = transformData.data;
    results.push({ step: 'transform', ...transformData });

    // Run Load
    const loadRes = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/load-target`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: currentData, ...(pipeline.blocks.find(b => b.type === 'load')?.config || {}) })
    });
    const loadData = await loadRes.json();
    if (!loadData.success) throw new Error(loadData.error);
    results.push({ step: 'load', ...loadData });

    return res.status(200).json({ success: true, results, finalData: currentData });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

