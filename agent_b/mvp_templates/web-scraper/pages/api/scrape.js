// API endpoint for web scraping
import { scrapeMatch, scrapeSeason } from '../../../src/lib/scraper_core';

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

    if (type === 'match') {
      // Scrape single match
      const { Fetcher } = await import('../../../src/lib/scraper_core');
      const fetcher = new Fetcher();
      data = await scrapeMatch(url, fetcher);
    } else if (type === 'season') {
      // Scrape season
      data = await scrapeSeason(url, roundNumber || null);
    } else {
      return res.status(400).json({ error: 'Invalid type. Use "match" or "season"' });
    }

    return res.status(200).json({
      success: true,
      data: data,
      count: data.length,
      url: url,
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return res.status(500).json({
      error: 'Scraping failed',
      message: error.message,
    });
  }
}

