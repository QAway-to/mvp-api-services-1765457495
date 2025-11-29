// Universal Web Scraper Core - Based on AFL Scraper functionality
// Adapted for Next.js server-side execution

/**
 * Fetcher class - HTTP client for fetching web pages
 */
export class Fetcher {
  constructor(timeout = 30000) {
    this.timeout = timeout;
  }

  async get(url) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, this.timeout);

      let response;
      try {
        response = await fetch(url, {
          headers: {
            'User-Agent': 'WebScraper-MVP/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response || !response.ok) {
        const status = response ? response.status : 'Unknown';
        const statusText = response ? response.statusText : 'No response';
        throw new Error(`HTTP ${status}: ${statusText}`);
      }

      const text = await response.text();
      return text;
    } catch (error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
  }
}

/**
 * Extract year from season URL
 * Example: /seas/2024.html -> 2024
 */
export function extractYearFromSeasonUrl(url) {
  const match = url.match(/\/seas\/(\d{4})\.html$/);
  return match ? match[1] : null;
}

/**
 * Collect all match links from season HTML
 * Finds all /stats/games/<year>/... links
 */
export async function collectAllMatchLinksFromSeason(html, seasonUrl, year) {
  const cheerio = await import('cheerio');
  // Handle both ESM and CommonJS exports - cheerio v1.0.0-rc.12 uses default export
  let cheerioModule;
  if (typeof cheerio === 'function') {
    cheerioModule = cheerio;
  } else if (cheerio.default && typeof cheerio.default === 'function') {
    cheerioModule = cheerio.default;
  } else if (cheerio.load) {
    cheerioModule = cheerio;
  } else {
    throw new Error('Cannot load cheerio module');
  }
  const $ = cheerioModule.load(html);
  const links = [];
  const seen = new Set();

  $(`a[href*="/stats/games/${year}/"]`).each((i, elem) => {
    const href = $(elem).attr('href');
    if (href && href.match(new RegExp(`/stats/games/${year}/[A-Za-z0-9]+\\.html$`))) {
      const absoluteUrl = new URL(href, seasonUrl).href;
      if (!seen.has(absoluteUrl)) {
        links.push(absoluteUrl);
        seen.add(absoluteUrl);
      }
    }
  });

  return links;
}

/**
 * Collect match links for a specific round from season HTML
 * Finds <a name="{round_number}"> anchor and collects links until next anchor
 */
export async function collectRoundMatchLinksFromSeason(html, seasonUrl, roundNumber) {
  const cheerio = await import('cheerio');
  // Handle both ESM and CommonJS exports - cheerio v1.0.0-rc.12 uses default export
  let cheerioModule;
  if (typeof cheerio === 'function') {
    cheerioModule = cheerio;
  } else if (cheerio.default && typeof cheerio.default === 'function') {
    cheerioModule = cheerio.default;
  } else if (cheerio.load) {
    cheerioModule = cheerio;
  } else {
    throw new Error('Cannot load cheerio module');
  }
  const $ = cheerioModule.load(html);
  const links = [];
  const seen = new Set();

  // Find the anchor for this round
  const anchor = $(`a[name="${roundNumber}"]`);
  if (anchor.length === 0) {
    return [];
  }

  // Collect all "Match stats" links after this anchor until next anchor
  let collecting = false;
  anchor.parent().nextAll().addBack().find('a').each((i, elem) => {
    const $elem = $(elem);
    const name = $elem.attr('name');
    
    // Stop if we hit another anchor
    if (name && name !== String(roundNumber)) {
      return false; // break
    }

    // Start collecting after our anchor
    if (name === String(roundNumber)) {
      collecting = true;
      return;
    }

    if (collecting) {
      const text = $elem.text().trim();
      if (text === 'Match stats') {
        const href = $elem.attr('href');
        if (href && href.includes('/stats/games/')) {
          const absoluteUrl = new URL(href, seasonUrl).href;
          if (!seen.has(absoluteUrl)) {
            links.push(absoluteUrl);
            seen.add(absoluteUrl);
          }
        }
      }
    }
  });

  return links;
}

/**
 * Expand season URL to list of match URLs
 * If roundNumber is provided, only returns matches for that round
 */
export async function expandSeasonToMatchUrls(seasonUrl, fetcher, roundNumber = null) {
  const html = await fetcher.get(seasonUrl);
  const year = extractYearFromSeasonUrl(seasonUrl);
  
  if (!year) {
    throw new Error(`Cannot detect year from ${seasonUrl}`);
  }

  if (roundNumber !== null) {
    const urls = await collectRoundMatchLinksFromSeason(html, seasonUrl, roundNumber);
    if (urls.length === 0) {
      throw new Error(`Round ${roundNumber} not found in ${seasonUrl}`);
    }
    return urls;
  }

  return await collectAllMatchLinksFromSeason(html, seasonUrl, year);
}

/**
 * Scrape a single match
 */
export async function scrapeMatch(url, fetcher) {
  try {
    const html = await fetcher.get(url);
    const { parseMatchClean } = await import('./parsers.js');
    const rows = await parseMatchClean(html, url);
    return rows;
  } catch (error) {
    console.error(`Error scraping match ${url}:`, error);
    throw error;
  }
}

/**
 * Scrape a season (all matches or specific round)
 * @param {Function} logCallback - Optional callback for logging progress
 */
export async function scrapeSeason(seasonUrl, roundNumber = null, sleepBetween = 500, logCallback = null) {
  const log = (msg, type = 'info') => {
    if (logCallback) logCallback(msg, type);
    else console.log(`[${type}] ${msg}`);
  };

  const fetcher = new Fetcher();
  try {
    log(`Fetching season page: ${seasonUrl}`, 'info');
    const matchUrls = await expandSeasonToMatchUrls(seasonUrl, fetcher, roundNumber);
    
    if (matchUrls.length === 0) {
      log('No match URLs found in season page', 'warning');
      return [];
    }

    log(`Found ${matchUrls.length} match URLs to scrape`, 'info');
    const allRows = [];
    let successCount = 0;

    for (let i = 0; i < matchUrls.length; i++) {
      const matchUrl = matchUrls[i];
      log(`[${i + 1}/${matchUrls.length}] Scraping: ${matchUrl}`, 'info');
      try {
        const rows = await scrapeMatch(matchUrl, fetcher);
        if (rows && rows.length > 0) {
          allRows.push(...rows);
          successCount++;
          log(`✅ Successfully scraped ${rows.length} rows from match ${i + 1}`, 'success');
        } else {
          log(`⚠️ No data extracted from match ${i + 1}`, 'warning');
        }
        
        // Sleep between requests to be polite
        if (i < matchUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, sleepBetween));
        }
      } catch (error) {
        log(`❌ Error processing match ${i + 1}: ${error.message}`, 'error');
        console.error(`Error processing ${matchUrl}:`, error);
      }
    }

    log(`✅ Season scraping complete: ${successCount}/${matchUrls.length} matches successful, ${allRows.length} total rows`, 'success');
    return allRows;
  } catch (error) {
    log(`❌ Fatal error scraping season: ${error.message}`, 'error');
    console.error(`Error scraping season ${seasonUrl}:`, error);
    throw error;
  }
}

