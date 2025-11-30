// API endpoint for spam analysis of drop domains
import { waybackAdapter } from '../../../src/lib/adapters/wayback/index.js';
import { combineStopWords, parseStopWords, defaultStopWords } from '../../../src/lib/adapters/wayback/stopWords.js';

// In-memory storage for domain statuses (for real-time updates)
const domainStatuses = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const logs = [];
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    logs.push({ timestamp, type, message });
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  try {
    const { domains, stopWords, maxSnapshots } = req.body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({ 
        error: 'domains array is required',
        logs: [{ timestamp: new Date().toISOString(), type: 'error', message: 'domains array is required' }]
      });
    }

    // Clear previous statuses
    domainStatuses.clear();

    // Parse stop words
    let finalStopWords = defaultStopWords;
    if (stopWords) {
      if (typeof stopWords === 'string') {
        finalStopWords = combineStopWords(parseStopWords(stopWords));
      } else if (Array.isArray(stopWords)) {
        finalStopWords = combineStopWords(stopWords);
      }
    }

    const snapshotsLimit = maxSnapshots || 10;

    addLog(`Starting spam analysis for ${domains.length} domain(s)`, 'info');
    addLog(`Using ${finalStopWords.length} stop words`, 'info');
    addLog(`Max snapshots per domain: ${snapshotsLimit}`, 'info');

    // Status callback to update domain statuses
    const statusCallback = (domainStatus) => {
      domainStatuses.set(domainStatus.domain, domainStatus);
    };

    try {
      const results = await waybackAdapter.analyzeDomainsForSpam(
        domains,
        finalStopWords,
        snapshotsLimit,
        (msg) => addLog(msg, 'info'),
        statusCallback,
        3 // maxConcurrent = 3
      );

      // Calculate summary with new status names
      const summary = {
        total: results.length,
        clean: results.filter(r => r.status === 'CLEAN').length,
        suspicious: results.filter(r => r.status === 'SUSPICIOUS').length,
        spam: results.filter(r => r.status === 'SPAM').length,
        unavailable: results.filter(r => r.status === 'UNAVAILABLE').length,
        no_snapshots: results.filter(r => r.status === 'NO_SNAPSHOTS').length,
      };

      addLog(`✅ Analysis complete: ${summary.clean} clean, ${summary.suspicious} suspicious, ${summary.spam} spam`, 'success');

      return res.status(200).json({
        success: true,
        results: results,
        summary: summary,
        logs: logs,
      });
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
      if (error.stack) {
        addLog(`Stack: ${error.stack}`, 'error');
      }
      throw error;
    }
  } catch (error) {
    addLog(`❌ Fatal error: ${error.message}`, 'error');
    if (error.stack) {
      addLog(`Stack: ${error.stack}`, 'error');
    }
    
    console.error('Spam analysis error:', error);
    return res.status(500).json({
      error: 'Spam analysis failed',
      message: error.message,
      details: error.stack || error.toString(),
      logs: logs,
    });
  }
}

