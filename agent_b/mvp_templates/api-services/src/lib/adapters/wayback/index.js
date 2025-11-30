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
   * Analyze domain for spam content in historical snapshots with status updates
   * @param {string} domain - Domain to analyze
   * @param {Array<string>} stopWords - List of spam keywords
   * @param {number} maxSnapshots - Max snapshots to check (default: 10)
   * @param {Function} progressCallback - Optional callback for progress updates
   * @param {Function} statusCallback - Optional callback for status updates: (status, data) => void
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeDomainForSpam(domain, stopWords = [], maxSnapshots = 10, progressCallback = null, statusCallback = null) {
    const log = (msg) => {
      if (progressCallback) progressCallback(msg);
    };
    
    const updateStatus = (status, data = {}) => {
      if (statusCallback) {
        statusCallback({
          domain,
          status,
          ...data,
        });
      }
    };

    try {
      // Initial status: FETCHING_SNAPSHOTS
      updateStatus('FETCHING_SNAPSHOTS', { lastMessage: 'Fetching snapshots from CDX API...' });
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
      let snapshots;
      try {
        snapshots = await this.getSnapshots(domain, maxSnapshots);
      } catch (error) {
        const errorMsg = error.message || String(error);
        log(`❌ Error fetching snapshots: ${errorMsg}`);
        updateStatus('UNAVAILABLE', { 
          lastMessage: `CDX API error: ${errorMsg}`,
          error: errorMsg,
          snapshotsFound: 0,
        });
        return {
          domain: domain,
          status: 'UNAVAILABLE',
          snapshotsFound: 0,
          snapshotsAnalyzed: 0,
          error: errorMsg,
          lastMessage: `CDX API error: ${errorMsg}`,
        };
      }
      
      if (snapshots.length === 0) {
        updateStatus('NO_SNAPSHOTS', { 
          lastMessage: 'No snapshots found in Wayback Machine',
          snapshotsFound: 0,
        });
        return {
          domain: domain,
          status: 'NO_SNAPSHOTS',
          snapshotsFound: 0,
          snapshotsAnalyzed: 0,
          lastMessage: 'No snapshots found in Wayback Machine',
        };
      }

      log(`Found ${snapshots.length} snapshots, analyzing...`);
      updateStatus('ANALYZING', { 
        lastMessage: `Found ${snapshots.length} snapshot(s), analyzing...`,
        snapshotsFound: snapshots.length,
        snapshotsAnalyzed: 0,
      });
      
      let spamSnapshots = 0;
      let totalSpamScore = 0;
      let maxSpamScore = 0;
      let successfullyAnalyzed = 0;
      let failedSnapshots = 0;
      const allFoundStopWords = new Map();
      let firstSpamDate = null;
      const snapshotErrors = [];

      // Analyze each snapshot
      for (let i = 0; i < snapshots.length; i++) {
        const snapshot = snapshots[i];
        try {
          const originalUrlDisplay = snapshot.originalUrl || 'unknown';
          log(`[${i + 1}/${snapshots.length}] Checking snapshot ${originalUrlDisplay} (${snapshot.timestamp})...`);
          
          const htmlResult = await this.getSnapshotHtml(snapshot);
          
          if (!htmlResult || !htmlResult.html) {
            throw new Error('Empty HTML result from snapshot');
          }
          
          log(`[${i + 1}/${snapshots.length}] HTML fetched: ${htmlResult.length} bytes`);
          
          const analysis = await analyzeHtmlForSpam(htmlResult.html, stopWords, domainName);
          
          successfullyAnalyzed++;
          
          // Update max spam score
          if (analysis.spamScore > maxSpamScore) {
            maxSpamScore = analysis.spamScore;
          }
          
          log(`[${i + 1}/${snapshots.length}] Analysis complete: spam=${analysis.isSpam}, score=${analysis.spamScore}, found=${analysis.stopWords.count} stop words`);
          
          if (analysis.isSpam) {
            spamSnapshots++;
            totalSpamScore += analysis.spamScore;
            
            analysis.stopWords.found.forEach(item => {
              const current = allFoundStopWords.get(item.word) || 0;
              allFoundStopWords.set(item.word, current + item.count);
            });
            
            log(`[${i + 1}/${snapshots.length}] ⚠️ SPAM DETECTED: ${analysis.stopWords.found.map(s => s.word).join(', ')}`);
            
            if (!firstSpamDate) {
              firstSpamDate = snapshot.timestamp;
            }
          }
          
          // Update status with progress
          updateStatus('ANALYZING', {
            lastMessage: `Analyzed ${successfullyAnalyzed}/${snapshots.length} snapshots...`,
            snapshotsFound: snapshots.length,
            snapshotsAnalyzed: successfullyAnalyzed,
            maxSpamScore: maxSpamScore,
          });
          
          // Delay between snapshot requests
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
          });
        }
      }

      // Calculate overall spam score
      const avgSpamScore = spamSnapshots > 0 ? totalSpamScore / spamSnapshots : 0;

      // Convert stop words map to array
      const stopWordsFound = Array.from(allFoundStopWords.entries())
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count);

      // Determine status based on maxSpamScore (0-10 scale)
      let finalStatus;
      if (successfullyAnalyzed === 0) {
        finalStatus = 'UNAVAILABLE';
      } else if (maxSpamScore >= 8) {
        finalStatus = 'SPAM';
      } else if (maxSpamScore >= 5) {
        finalStatus = 'SUSPICIOUS';
      } else {
        finalStatus = 'CLEAN';
      }

      const result = {
        domain: domain,
        status: finalStatus,
        snapshotsFound: snapshots.length,
        snapshotsAnalyzed: successfullyAnalyzed,
        failedSnapshots: failedSnapshots,
        spamSnapshots: spamSnapshots,
        maxSpamScore: Math.round(maxSpamScore * 10) / 10,
        avgSpamScore: Math.round(avgSpamScore * 10) / 10,
        spamDetected: spamSnapshots > 0,
        totalStopWordsFound: allFoundStopWords.size,
        stopWordsFound: stopWordsFound,
        firstSpamDate: firstSpamDate,
        lastMessage: finalStatus === 'UNAVAILABLE' 
          ? `Failed to analyze any snapshots. ${failedSnapshots} errors occurred.`
          : `Analysis complete: ${finalStatus}. Max spam score: ${maxSpamScore.toFixed(1)}/10`,
      };
      
      if (snapshotErrors.length > 0) {
        result.snapshotErrors = snapshotErrors;
        if (successfullyAnalyzed === 0) {
          result.error = `Failed to analyze any snapshots. ${failedSnapshots} errors occurred.`;
        }
      }
      
      // Final status update
      updateStatus(finalStatus, result);
      
      return result;
    } catch (error) {
      const errorMsg = error.message || String(error);
      log(`❌ Domain analysis failed: ${errorMsg}`);
      updateStatus('UNAVAILABLE', {
        lastMessage: `Analysis failed: ${errorMsg}`,
        error: errorMsg,
        snapshotsFound: 0,
        snapshotsAnalyzed: 0,
      });
      return {
        domain: domain,
        status: 'UNAVAILABLE',
        snapshotsFound: 0,
        snapshotsAnalyzed: 0,
        error: errorMsg,
        lastMessage: `Analysis failed: ${errorMsg}`,
      };
    }
  }

  /**
   * Analyze multiple domains for spam with parallel processing
   * @param {Array<string>} domains - Array of domains to analyze
   * @param {Array<string>} stopWords - List of spam keywords
   * @param {number} maxSnapshots - Max snapshots per domain
   * @param {Function} progressCallback - Optional callback for progress updates
   * @param {Function} statusCallback - Optional callback for domain status updates: (domainStatus) => void
   * @param {number} maxConcurrent - Max concurrent domain analyses (default: 3)
   * @returns {Promise<Array<Object>>} Array of analysis results
   */
  async analyzeDomainsForSpam(domains, stopWords = [], maxSnapshots = 10, progressCallback = null, statusCallback = null, maxConcurrent = 3) {
    const results = [];
    const domainStatuses = new Map(); // Track status for each domain
    
    // Initialize all domains as QUEUED
    domains.forEach(domain => {
      const trimmed = domain.trim();
      if (!trimmed) return;
      const initialStatus = {
        domain: trimmed,
        status: 'QUEUED',
        lastMessage: 'Waiting to start...',
        snapshotsFound: 0,
        snapshotsAnalyzed: 0,
      };
      domainStatuses.set(trimmed, initialStatus);
      if (statusCallback) {
        statusCallback(initialStatus);
      }
    });
    
    // Process domains in parallel with concurrency limit
    const domainList = domains.map(d => d.trim()).filter(d => d.length > 0);
    const queue = [...domainList];
    const active = new Set();
    const promises = [];
    
    const processDomain = async (domain) => {
      active.add(domain);
      
      const log = (msg) => {
        if (progressCallback) {
          const index = domainList.indexOf(domain) + 1;
          progressCallback(`[${index}/${domainList.length}] ${domain}: ${msg}`);
        }
      };
      
      const statusUpdate = (statusData) => {
        domainStatuses.set(domain, statusData);
        if (statusCallback) {
          statusCallback(statusData);
        }
      };
      
      try {
        const result = await this.analyzeDomainForSpam(domain, stopWords, maxSnapshots, log, statusUpdate);
        results.push(result);
      } catch (error) {
        log(`❌ Error: ${error.message}`);
        const errorResult = {
          domain: domain,
          status: 'UNAVAILABLE',
          error: error.message,
          lastMessage: `Analysis failed: ${error.message}`,
          snapshotsFound: 0,
          snapshotsAnalyzed: 0,
        };
        results.push(errorResult);
        statusUpdate(errorResult);
      } finally {
        active.delete(domain);
        
        // Process next domain from queue
        if (queue.length > 0) {
          const nextDomain = queue.shift();
          promises.push(processDomain(nextDomain));
        }
      }
    };
    
    // Start initial batch
    for (let i = 0; i < Math.min(maxConcurrent, domainList.length); i++) {
      const domain = queue.shift();
      if (domain) {
        promises.push(processDomain(domain));
      }
    }
    
    // Wait for all to complete
    await Promise.all(promises);
    
    // Sort results to match input order
    const sortedResults = domainList.map(domain => {
      return results.find(r => r.domain === domain) || {
        domain: domain,
        status: 'UNAVAILABLE',
        error: 'Analysis not completed',
        snapshotsFound: 0,
        snapshotsAnalyzed: 0,
      };
    });
    
    return sortedResults;
  }
}

// Export singleton instance
export const waybackAdapter = new WaybackMachineAdapter();

