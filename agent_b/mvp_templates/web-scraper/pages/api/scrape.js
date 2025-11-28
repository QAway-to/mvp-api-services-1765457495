// API endpoint for web scraping
import { scrapeMatch, scrapeSeason, Fetcher } from '../../src/lib/scraper_core.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, type, roundNumber } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    let data = [];
    let metadata = {
      url: url,
      type: type,
      timestamp: new Date().toISOString(),
    };

    if (type === 'match') {
      // Scrape single match
      const fetcher = new Fetcher();
      data = await scrapeMatch(url, fetcher);
      metadata.matchCount = 1;
      metadata.rowCount = data ? data.length : 0;
    } else if (type === 'season') {
      // Scrape season
      const round = roundNumber ? parseInt(roundNumber) : null;
      data = await scrapeSeason(url, round, 500);
      metadata.roundNumber = round;
      metadata.rowCount = data.length;
      
      // Extract year from URL for metadata
      const yearMatch = url.match(/\/seas\/(\d{4})\.html$/);
      if (yearMatch) {
        metadata.year = yearMatch[1];
      }
    } else {
      return res.status(400).json({ error: 'Invalid type. Use "match" or "season"' });
    }

    return res.status(200).json({
      success: true,
      data: data,
      metadata: metadata,
      count: data.length,
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return res.status(500).json({
      error: 'Scraping failed',
      message: error.message,
    });
  }
}

