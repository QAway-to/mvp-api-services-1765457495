// Wayback Machine HTTP client
// Handles CDX API requests and snapshot HTML fetching

export class WaybackClient {
  constructor(timeout = 120000) {
    // УВЕЛИЧЕНО: 120 секунд (2 минуты) timeout для обработки медленных запросов
    // Расчет: 10 snapshots × 3s delay = 30s + запросы ~2-5s каждый = 50-80s минимум
    this.timeout = timeout;
    this.cdxBaseUrl = 'https://web.archive.org/cdx/search/cdx';
    this.webBaseUrl = 'https://web.archive.org/web';
  }

  /**
   * Normalize target URL/domain for CDX API
   */
  normalizeTarget(target) {
    // Remove protocol if present
    let normalized = target.trim();
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      try {
        const url = new URL(normalized);
        normalized = url.hostname + url.pathname;
      } catch (e) {
        // Invalid URL, return as is after trimming
        normalized = normalized.replace(/^https?:\/\//, '');
      }
    }
    // Remove trailing slash for consistency
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  }

  /**
   * Fetch snapshots from CDX API with retry logic for rate limiting
   */
  async getSnapshots(target, limit = 10, retryCount = 0, maxRetries = 3) {
    const normalizedTarget = this.normalizeTarget(target);
    
    const params = new URLSearchParams({
      url: normalizedTarget,
      output: 'json',
      filter: 'statuscode:200',
      limit: limit.toString(),
    });

    const url = `${this.cdxBaseUrl}?${params.toString()}`;

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
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Handle rate limiting (429) with retry and exponential backoff
      if (response && response.status === 429) {
        if (retryCount < maxRetries) {
          const waitTime = Math.pow(2, retryCount) * 2000; // Exponential backoff: 2s, 4s, 8s
          console.log(`Rate limited (429). Waiting ${waitTime/1000}s before retry ${retryCount + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return await this.getSnapshots(target, limit, retryCount + 1, maxRetries);
        } else {
          throw new Error(`CDX API rate limit exceeded after ${maxRetries} retries. Please try again later.`);
        }
      }

      if (!response || !response.ok) {
        const status = response ? response.status : 'Unknown';
        throw new Error(`CDX API returned HTTP ${status}`);
      }

      const data = await response.json();

      // CDX API returns array of arrays
      // First row is headers: [timestamp, original, ...]
      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }

      // Skip header row if it exists
      const rows = data.slice(1);

      return rows.map(row => {
        // CDX format: [timestamp, original, mimetype, statuscode, digest, length, ...]
        const timestamp = row[0] || '';
        const originalUrl = row[1] || '';
        const statusCode = row[3] ? parseInt(row[3], 10) : null;

        return {
          timestamp: timestamp,
          originalUrl: originalUrl,
          statusCode: statusCode,
        };
      }).filter(snapshot => snapshot.timestamp && snapshot.originalUrl);
    } catch (error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw new Error(`Failed to fetch snapshots: ${error.message}`);
    }
  }

  /**
   * Build Wayback Machine snapshot URL
   */
  buildSnapshotUrl(timestamp, originalUrl) {
    // Ensure originalUrl doesn't start with protocol for Wayback URL construction
    let urlPath = originalUrl;
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
      try {
        const url = new URL(urlPath);
        urlPath = url.hostname + url.pathname;
      } catch (e) {
        // Keep original if URL parsing fails
      }
    }
    
    return `${this.webBaseUrl}/${timestamp}/${originalUrl}`;
  }

  /**
   * Fetch HTML for a specific snapshot with retry logic for rate limiting
   */
  async getSnapshotHtml(snapshot, retryCount = 0, maxRetries = 3) {
    const { timestamp, originalUrl } = snapshot;
    
    if (!timestamp || !originalUrl) {
      throw new Error('Snapshot must have timestamp and originalUrl');
    }

    const snapshotUrl = this.buildSnapshotUrl(timestamp, originalUrl);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, this.timeout);

      let response;
      try {
        response = await fetch(snapshotUrl, {
          headers: {
            'User-Agent': 'WebScraper-MVP/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Handle rate limiting (429) with retry and exponential backoff
      if (response && response.status === 429) {
        if (retryCount < maxRetries) {
          const waitTime = Math.pow(2, retryCount) * 2000; // Exponential backoff: 2s, 4s, 8s
          console.log(`Rate limited (429) fetching snapshot. Waiting ${waitTime/1000}s before retry ${retryCount + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return await this.getSnapshotHtml(snapshot, retryCount + 1, maxRetries);
        } else {
          throw new Error(`Rate limit exceeded after ${maxRetries} retries. Please try again later.`);
        }
      }

      if (!response || !response.ok) {
        const status = response ? response.status : 'Unknown';
        throw new Error(`Failed to fetch snapshot HTML: HTTP ${status}`);
      }

      const html = await response.text();
      const length = html.length;

      return {
        html: html,
        length: length,
        snapshotUrl: snapshotUrl,
      };
    } catch (error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw new Error(`Failed to fetch snapshot HTML: ${error.message}`);
    }
  }
}

