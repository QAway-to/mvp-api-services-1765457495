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
      let successfullyAnalyzed = 0; // Счётчик успешно проанализированных снапшотов
      let failedSnapshots = 0; // Счётчик неудачных попыток
      const allFoundStopWords = new Map(); // word -> count
      let firstSpamDate = null;
      const snapshotErrors = []; // Детальные ошибки для каждого снапшота

      // Analyze each snapshot
      for (let i = 0; i < snapshots.length; i++) {
        const snapshot = snapshots[i];
        try {
          // Log original URL properly formatted
          const originalUrlDisplay = snapshot.originalUrl || 'unknown';
          log(`[${i + 1}/${snapshots.length}] Checking snapshot ${originalUrlDisplay} (${snapshot.timestamp})...`);
          
          // DEBUG: Log details for first snapshot
          if (i === 0) {
            log(`[DEBUG] First snapshot - originalUrl: ${snapshot.originalUrl}, timestamp: ${snapshot.timestamp}`);
          }
          
          const htmlResult = await this.getSnapshotHtml(snapshot);
          
          if (!htmlResult || !htmlResult.html) {
            throw new Error('Empty HTML result from snapshot');
          }
          
          // DEBUG: Log HTML preview for first snapshot
          if (i === 0) {
            const htmlPreview = htmlResult.html.substring(0, 200).replace(/\s+/g, ' ');
            log(`[DEBUG] First snapshot HTML preview (${htmlResult.html.length} bytes): ${htmlPreview}...`);
            log(`[DEBUG] First snapshot rawUrl: https://web.archive.org/web/${snapshot.timestamp}id_/${snapshot.originalUrl}`);
            log(`[DEBUG] First snapshot wrapperUrl: https://web.archive.org/web/${snapshot.timestamp}/${snapshot.originalUrl}`);
          }
          
          log(`[${i + 1}/${snapshots.length}] HTML fetched: ${htmlResult.length} bytes`);
          
          // ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ: проверяем что передаётся в анализ
          log(`[${i + 1}/${snapshots.length}] Domain to ignore: ${domainName}, Stop words: ${stopWords.slice(0, 5).join(', ')}${stopWords.length > 5 ? '...' : ''}`);
          
          // ПЕРЕДАЁМ domainName для исключения из поиска стоп-слов
          const analysis = await analyzeHtmlForSpam(htmlResult.html, stopWords, domainName);
          
          successfullyAnalyzed++;
          
          // ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ: что было найдено
          log(`[${i + 1}/${snapshots.length}] Text extracted: ${analysis.textLength} chars, Meta: title=${analysis.metaTags.title ? analysis.metaTags.title.substring(0, 50) : 'none'}`);
          log(`[${i + 1}/${snapshots.length}] Analysis complete: spam=${analysis.isSpam}, score=${analysis.spamScore}, found=${analysis.stopWords.count} stop words`);
          
          // Если стоп-слов не найдено, но должны были быть - выводим предупреждение
          if (analysis.stopWords.count === 0 && stopWords.length > 0 && analysis.textLength > 100) {
            log(`[${i + 1}/${snapshots.length}] ⚠️ WARNING: No stop words found but text length is ${analysis.textLength} chars. Possible issues: domain filtering too aggressive or text extraction failed.`);
          }
          
          if (analysis.isSpam) {
            spamSnapshots++;
            totalSpamScore += analysis.spamScore;
            
            // Track stop words
            analysis.stopWords.found.forEach(item => {
              const current = allFoundStopWords.get(item.word) || 0;
              allFoundStopWords.set(item.word, current + item.count);
            });
            
            log(`[${i + 1}/${snapshots.length}] ⚠️ SPAM DETECTED: ${analysis.stopWords.found.map(s => s.word).join(', ')}`);
            
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
          failedSnapshots++;
          const errorMsg = error.message || String(error);
          log(`❌ Error analyzing snapshot ${snapshot.timestamp}: ${errorMsg}`);
          snapshotErrors.push({
            timestamp: snapshot.timestamp,
            originalUrl: snapshot.originalUrl,
            error: errorMsg,
            stack: error.stack || null
          });
          // Continue with next snapshot
        }
      }

      // Calculate overall spam score (percentage of SUCCESSFULLY ANALYZED snapshots with spam)
      // ИСПРАВЛЕНО: используем successfullyAnalyzed вместо snapshots.length
      const spamPercentage = successfullyAnalyzed > 0 
        ? (spamSnapshots / successfullyAnalyzed) * 100 
        : 0;
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

      // Добавляем детальную информацию об ошибках
      const result = {
        domain: domain,
        snapshotsChecked: snapshots.length,
        successfullyAnalyzed: successfullyAnalyzed,
        failedSnapshots: failedSnapshots,
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
      
      // Добавляем детальные ошибки если есть
      if (snapshotErrors.length > 0) {
        result.snapshotErrors = snapshotErrors;
        log(`⚠️ ${failedSnapshots} snapshot(s) failed to analyze out of ${snapshots.length} total`);
      }
      
      if (successfullyAnalyzed === 0) {
        log(`❌ CRITICAL: No snapshots were successfully analyzed! All ${snapshots.length} attempts failed.`);
        result.status = 'error';
        result.error = `Failed to analyze any snapshots. ${failedSnapshots} errors occurred.`;
      } else if (successfullyAnalyzed < snapshots.length) {
        log(`⚠️ Only ${successfullyAnalyzed} out of ${snapshots.length} snapshots were successfully analyzed`);
      }
      
      return result;
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

