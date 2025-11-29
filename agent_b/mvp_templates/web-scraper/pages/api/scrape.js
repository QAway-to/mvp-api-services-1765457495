// API endpoint for web scraping
import { scrapeMatch, scrapeSeason, Fetcher } from '../../src/lib/scraper_core.js';

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
    const { url, type, roundNumber } = req.body;

    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required',
        logs: [{ timestamp: new Date().toISOString(), type: 'error', message: 'URL is required' }]
      });
    }

    addLog(`Starting scrape: ${type} - ${url}`, 'info');

    let data = [];
    let metadata = {
      url: url,
      type: type,
      timestamp: new Date().toISOString(),
    };

    if (type === 'match') {
      // Scrape single match
      addLog('Fetching page...', 'info');
      const fetcher = new Fetcher();
      try {
        addLog(`Parsing match data from ${url}...`, 'info');
        data = await scrapeMatch(url, fetcher);
        metadata.matchCount = 1;
        metadata.rowCount = data ? data.length : 0;
        addLog(`✅ Successfully scraped ${metadata.rowCount} rows`, 'success');
      } catch (error) {
        addLog(`❌ Error scraping match: ${error.message}`, 'error');
        addLog(`Stack: ${error.stack}`, 'error');
        throw error;
      }
    } else if (type === 'season') {
      // Scrape season
      const round = roundNumber ? parseInt(roundNumber) : null;
      addLog(`Fetching season page${round ? ` (Round ${round})` : ''}...`, 'info');
      
      try {
        addLog('Expanding season to match URLs...', 'info');
        // Pass log callback to scrapeSeason
        data = await scrapeSeason(url, round, 500, (msg, logType) => {
          addLog(msg, logType);
        });
        metadata.roundNumber = round;
        metadata.rowCount = data.length;
        
        // Extract year from URL for metadata
        const yearMatch = url.match(/\/seas\/(\d{4})\.html$/);
        if (yearMatch) {
          metadata.year = yearMatch[1];
        }
        
        addLog(`✅ Successfully scraped ${metadata.rowCount} rows from season`, 'success');
      } catch (error) {
        addLog(`❌ Error scraping season: ${error.message}`, 'error');
        addLog(`Error details: ${error.stack || error.toString()}`, 'error');
        if (error.message.includes('Cannot detect year')) {
          addLog('💡 Tip: Season URL should match pattern: /seas/YYYY.html', 'info');
        }
        if (error.message.includes('Round')) {
          addLog('💡 Tip: Check if the round number exists in the season page', 'info');
        }
        throw error;
      }
    } else {
      return res.status(400).json({ 
        error: 'Invalid type. Use "match" or "season"',
        logs: [{ timestamp: new Date().toISOString(), type: 'error', message: `Invalid type: ${type}` }]
      });
    }

    return res.status(200).json({
      success: true,
      data: data,
      metadata: metadata,
      count: data.length,
      logs: logs,
    });
  } catch (error) {
    addLog(`❌ Fatal error: ${error.message}`, 'error');
    addLog(`Error type: ${error.constructor.name}`, 'error');
    if (error.stack) {
      addLog(`Stack trace: ${error.stack}`, 'error');
    }
    
    console.error('Scraping error:', error);
    return res.status(500).json({
      error: 'Scraping failed',
      message: error.message,
      details: error.stack || error.toString(),
      logs: logs,
    });
  }
}

