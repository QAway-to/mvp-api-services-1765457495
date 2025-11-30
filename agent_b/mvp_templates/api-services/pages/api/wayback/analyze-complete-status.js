// API endpoint for getting real-time complete analysis status via SSE
// Similar to analyze-spam-status but also handles complete analysis results

// Global storage for domain statuses and results
if (typeof global.domainStatusStorage === 'undefined') {
  global.domainStatusStorage = new Map();
}
if (typeof global.completeAnalysisResults === 'undefined') {
  global.completeAnalysisResults = new Map();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId query parameter is required' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

  // Polling interval
  const pollInterval = 500;
  let lastUpdateTime = Date.now();

  const checkAndSendUpdates = () => {
    try {
      const statuses = global.domainStatusStorage.get(sessionId);
      const results = global.completeAnalysisResults.get(sessionId);
      
      if (statuses) {
        const statusArray = Array.from(statuses.values());
        
        // Check if we have complete results
        if (results && results.length > 0) {
          // Check if all domains are complete
          const allComplete = statusArray.every(d => 
            ['COMPLETE', 'UNAVAILABLE', 'NO_SNAPSHOTS'].includes(d.status) || d.status?.includes('COMPLETE')
          );
          
          if (allComplete) {
            // Send complete results
            res.write(`data: ${JSON.stringify({ 
              type: 'complete', 
              domains: results.map(r => ({
                ...r,
                currentStatus: statuses.get(r.domain)?.status || r.status,
                lastMessage: statuses.get(r.domain)?.lastMessage || r.error || 'Analysis complete',
              }))
            })}\n\n`);
            
            // Clear results after sending
            global.completeAnalysisResults.delete(sessionId);
            return;
          }
        }
        
        res.write(`data: ${JSON.stringify({ type: 'update', domains: statusArray })}\n\n`);
        lastUpdateTime = Date.now();
      }
    } catch (error) {
      console.error('Error sending SSE update:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    }
  };

  // Send initial status if available
  checkAndSendUpdates();

  // Set up interval
  const intervalId = setInterval(() => {
    if (res.closed) {
      clearInterval(intervalId);
      return;
    }
    checkAndSendUpdates();
  }, pollInterval);

  // Keepalive
  const keepaliveId = setInterval(() => {
    if (res.closed) {
      clearInterval(keepaliveId);
      return;
    }
    res.write(`: keepalive\n\n`);
  }, 30000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(intervalId);
    clearInterval(keepaliveId);
    setTimeout(() => {
      if (global.domainStatusStorage.has(sessionId)) {
        global.domainStatusStorage.delete(sessionId);
      }
      if (global.completeAnalysisResults.has(sessionId)) {
        global.completeAnalysisResults.delete(sessionId);
      }
    }, 300000);
  });
}

