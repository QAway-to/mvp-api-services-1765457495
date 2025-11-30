// Wayback Machine adapter
import { WaybackClient } from './waybackClient.js';
import { analyzeHtmlForSpam } from './htmlParser.js';

export class WaybackMachineAdapter {
  constructor() {
    this.client = new WaybackClient();
  }

  getName() {
    return 'wayback';
  }

  /**
   * Check if target is valid for Wayback Machine
   */
  canHandle(target) {
    // Wayback Machine can handle any domain/URL
    return typeof target === 'string' && target.trim().length > 0;
  }

  /**
   * Get snapshots from CDX API
   */
  async getSnapshots(target, limit = 10) {
    return await this.client.getSnapshots(target, limit);
  }

  /**
   * Get HTML for a specific snapshot
   */
  async getSnapshotHtml(snapshot) {
    return await this.client.getSnapshotHtml(snapshot);
  }

  /**
   * Test method - fetch snapshots and get first snapshot HTML
   */
  async testWayback(target) {
    try {
      // Get snapshots
      const snapshots = await this.getSnapshots(target, 5);

      if (snapshots.length === 0) {
        return {
          target: target,
          snapshotsCount: 0,
        };
      }

      // Get first snapshot HTML
      const firstSnapshot = snapshots[0];
      const htmlResult = await this.getSnapshotHtml(firstSnapshot);

      return {
        target: target,
        snapshotsCount: snapshots.length,
        firstSnapshotTimestamp: firstSnapshot.timestamp,
        firstSnapshotUrl: firstSnapshot.originalUrl,
        firstSnapshotHtmlLength: htmlResult.length,
        firstSnapshotWaybackUrl: htmlResult.snapshotUrl, // Wayback URL
      };
    } catch (error) {
      throw new Error(`Wayback test failed: ${error.message}`);
    }
  }

  /**
   * Analyze domain for spam content in historical snapshots
   * @param {string} domain - Domain to analyze
   * @param {Array<string>} stopWords - List of spam keywords
   * @param {number} maxSnapshots - Max snapshots to check (default: 10)
   * @param {Function} progressCallback - Optional callback for progress updates
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeDomainForSpam(domain, stopWords = [], maxSnapshots = 10, progressCallback = null) {
    const log = (msg) => {
      if (progressCallback) progressCallback(msg);
    };

    try {
      log(`Analyzing domain: ${domain}`);
      
      // Extract domain name for exclusion from stop word matching
      let domainName = domain;
      try {
        const url = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
        domainName = url.hostname;
      } catch (e) {
        // Use domain as-is
        domainName = domain.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
      }
      
      // Get snapshots
      const snapshots = await this.getSnapshots(domain, maxSnapshots);
      
      if (snapshots.length === 0) {
        return {
          domain: domain,
          snapshotsChecked: 0,
          spamDetected: false,
          spamScore: 0,
          totalStopWordsFound: 0,
          stopWordsFound: [],
          firstSpamDate: null,
          status: 'no_snapshots',
        };
      }

      log(`Found ${snapshots.length} snapshots, analyzing...`);
      
      let spamSnapshots = 0;
      let totalSpamScore = 0;
      const allFoundStopWords = new Map(); // word -> count
      let firstSpamDate = null;

      // Analyze each snapshot
      for (let i = 0; i < snapshots.length; i++) {
        const snapshot = snapshots[i];
        try {
          log(`[${i + 1}/${snapshots.length}] Checking snapshot ${snapshot.timestamp}...`);
          
          const htmlResult = await this.getSnapshotHtml(snapshot);
          // ПЕРЕДАЁМ domainName для исключения из поиска стоп-слов
          const analysis = await analyzeHtmlForSpam(htmlResult.html, stopWords, domainName);
          
          if (analysis.isSpam) {
            spamSnapshots++;
            totalSpamScore += analysis.spamScore;
            
            // Track stop words
            analysis.stopWords.found.forEach(item => {
              const current = allFoundStopWords.get(item.word) || 0;
              allFoundStopWords.set(item.word, current + item.count);
            });
            
            // Track first spam date
            if (!firstSpamDate) {
              firstSpamDate = snapshot.timestamp;
            }
          }
          
          // Delay between snapshot requests to avoid rate limiting
          // УВЕЛИЧЕНО: 3 секунды между snapshot-ами (для 10 snapshots = 30 секунд только на задержки)
          if (i < snapshots.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } catch (error) {
          log(`⚠️ Error analyzing snapshot ${snapshot.timestamp}: ${error.message}`);
          // Continue with next snapshot
        }
      }

      // Calculate overall spam score (percentage of snapshots with spam)
      const spamPercentage = (spamSnapshots / snapshots.length) * 100;
      const avgSpamScore = spamSnapshots > 0 ? totalSpamScore / spamSnapshots : 0;

      // Convert stop words map to array
      const stopWordsFound = Array.from(allFoundStopWords.entries())
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count);

      // Determine status
      let status = 'clean';
      if (spamPercentage >= 50) {
        status = 'spam';
      } else if (spamPercentage > 0) {
        status = 'suspicious';
      }

      // Calculate domain spam score (0-10) as average of spam snapshot scores
      const domainSpamScore = spamSnapshots > 0 ? Math.round((totalSpamScore / spamSnapshots) * 10) / 10 : 0;

      return {
        domain: domain,
        snapshotsChecked: snapshots.length,
        spamSnapshots: spamSnapshots,
        spamPercentage: Math.round(spamPercentage * 100) / 100,
        avgSpamScore: Math.round(avgSpamScore * 100) / 100,
        domainSpamScore: domainSpamScore, // Добавлено: агрегированный score домена (0-10)
        spamDetected: spamSnapshots > 0,
        totalStopWordsFound: allFoundStopWords.size,
        stopWordsFound: stopWordsFound,
        firstSpamDate: firstSpamDate,
        status: status,
      };
    } catch (error) {
      throw new Error(`Domain analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze multiple domains for spam
   * @param {Array<string>} domains - Array of domains to analyze
   * @param {Array<string>} stopWords - List of spam keywords
   * @param {number} maxSnapshots - Max snapshots per domain
   * @param {Function} progressCallback - Optional callback for progress updates
   * @returns {Promise<Array<Object>>} Array of analysis results
   */
  async analyzeDomainsForSpam(domains, stopWords = [], maxSnapshots = 10, progressCallback = null) {
    const results = [];
    
    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i].trim();
      if (!domain) continue;
      
      const log = (msg) => {
        if (progressCallback) progressCallback(`[${i + 1}/${domains.length}] ${domain}: ${msg}`);
      };
      
      try {
        const result = await this.analyzeDomainForSpam(domain, stopWords, maxSnapshots, log);
        results.push(result);
      } catch (error) {
        log(`❌ Error: ${error.message}`);
        results.push({
          domain: domain,
          error: error.message,
          status: 'error',
        });
      }
      
      // Delay between domains to avoid rate limiting
      // УВЕЛИЧЕНО: 5 секунд между доменами для надёжности
      if (i < domains.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const waybackAdapter = new WaybackMachineAdapter();

