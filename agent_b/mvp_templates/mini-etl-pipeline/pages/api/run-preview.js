export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pipeline } = req.body;

    if (!Array.isArray(pipeline) || pipeline.length === 0) {
      return res.status(400).json({ error: 'Pipeline must be a non-empty array' });
    }

    const logs = [];
    let currentData = null;
    let errors = [];

    // Step 1: Extract
    const extractStep = pipeline.find(s => s.type === 'extract');
    if (extractStep) {
      try {
        logs.push({
          step: extractStep.name || 'Extract',
          type: 'extract',
          status: 'active',
          message: 'Fetching data from source...',
          timestamp: new Date().toISOString()
        });

        const extractRes = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/fetch-source`);
        const extractData = await extractRes.json();
        
        currentData = extractData.data || [];
        
        logs.push({
          step: extractStep.name || 'Extract',
          type: 'extract',
          status: 'success',
          message: `Fetched ${currentData.length} records`,
          timestamp: new Date().toISOString(),
          data: { recordCount: currentData.length }
        });
      } catch (error) {
        errors.push({ step: 'extract', error: error.message });
        logs.push({
          step: extractStep.name || 'Extract',
          type: 'extract',
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Step 2: Transform
    const transformStep = pipeline.find(s => s.type === 'transform');
    if (transformStep && currentData) {
      try {
        logs.push({
          step: transformStep.name || 'Transform',
          type: 'transform',
          status: 'active',
          message: 'Transforming data...',
          timestamp: new Date().toISOString()
        });

        const transformRes = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/transform-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: currentData,
            config: transformStep.config || {}
          })
        });
        
        const transformData = await transformRes.json();
        currentData = transformData.data || currentData;
        
        logs.push({
          step: transformStep.name || 'Transform',
          type: 'transform',
          status: 'success',
          message: `Transformed to ${currentData.length} records`,
          timestamp: new Date().toISOString(),
          data: { 
            inputCount: currentData.length,
            outputCount: currentData.length 
          }
        });
      } catch (error) {
        errors.push({ step: 'transform', error: error.message });
        logs.push({
          step: transformStep.name || 'Transform',
          type: 'transform',
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Step 3: Load
    const loadStep = pipeline.find(s => s.type === 'load');
    if (loadStep && currentData) {
      try {
        logs.push({
          step: loadStep.name || 'Load',
          type: 'load',
          status: 'active',
          message: 'Loading data to target...',
          timestamp: new Date().toISOString()
        });

        const loadRes = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/load-target`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: currentData,
            config: loadStep.config || {}
          })
        });
        
        const loadData = await loadRes.json();
        
        logs.push({
          step: loadStep.name || 'Load',
          type: 'load',
          status: 'success',
          message: `Loaded ${currentData.length} records`,
          timestamp: new Date().toISOString(),
          data: { recordCount: currentData.length }
        });
      } catch (error) {
        errors.push({ step: 'load', error: error.message });
        logs.push({
          step: loadStep.name || 'Load',
          type: 'load',
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return res.status(200).json({
      success: errors.length === 0,
      data: currentData,
      logs,
      errors,
      summary: {
        totalSteps: pipeline.length,
        completedSteps: logs.filter(l => l.status === 'success').length,
        errorSteps: errors.length,
        finalRecordCount: Array.isArray(currentData) ? currentData.length : 0
      }
    });
  } catch (error) {
    console.error('[run-preview] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      logs: [],
      errors: [{ step: 'pipeline', error: error.message }]
    });
  }
}

