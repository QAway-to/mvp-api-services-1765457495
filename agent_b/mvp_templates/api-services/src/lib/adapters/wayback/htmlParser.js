// HTML Parser for spam detection
// Extracts text content from HTML and checks for stop words

/**
 * Extract text content from HTML (removes scripts, styles, etc.)
 */
export async function extractTextContent(html) {
  try {
    // Dynamic import for cheerio
    const cheerio = await import('cheerio');
    // Handle both ESM and CommonJS exports
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
    
    // Remove script, style, and other non-content elements
    $('script, style, noscript, iframe, embed, object').remove();
    
    // Extract text
    const text = $('body').text() || $('html').text();
    
    // Clean up whitespace
    return text.replace(/\s+/g, ' ').trim().toLowerCase();
  } catch (error) {
    // Fallback: basic text extraction without cheerio
    const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                     .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                     .replace(/<[^>]+>/g, ' ')
                     .replace(/\s+/g, ' ')
                     .trim()
                     .toLowerCase();
    return text;
  }
}

/**
 * Extract meta tags (description, keywords)
 */
export async function extractMetaTags(html) {
  try {
    const cheerio = await import('cheerio');
    // Handle both ESM and CommonJS exports
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
    
    return {
      title: $('title').text().trim() || '',
      description: $('meta[name="description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
    };
  } catch (error) {
    return { title: '', description: '', keywords: '' };
  }
}

/**
 * Check text for stop words
 * @param {string} text - Text to check
 * @param {Array<string>} stopWords - Array of stop words (lowercase)
 * @returns {Object} - { found: [], count: number, score: number }
 */
export function checkStopWords(text, stopWords) {
  if (!text || !stopWords || stopWords.length === 0) {
    return { found: [], count: 0, score: 0 };
  }
  
  const found = [];
  const textLower = text.toLowerCase();
  
  stopWords.forEach(word => {
    const wordLower = word.toLowerCase().trim();
    if (wordLower && textLower.includes(wordLower)) {
      // Count occurrences
      const regex = new RegExp(wordLower, 'gi');
      const matches = text.match(regex);
      const count = matches ? matches.length : 0;
      
      if (!found.find(item => item.word === wordLower)) {
        found.push({
          word: wordLower,
          count: count,
        });
      }
    }
  });
  
  // Calculate spam score (0-100) based on found words
  // Simple formula: (found_words / total_words) * 100
  const totalWords = text.split(/\s+/).length;
  const foundWordsCount = found.reduce((sum, item) => sum + item.count, 0);
  const score = totalWords > 0 ? Math.min(100, (foundWordsCount / totalWords) * 100) : 0;
  
  return {
    found: found,
    count: found.length,
    score: Math.round(score * 100) / 100, // Round to 2 decimals
  };
}

/**
 * Analyze HTML content for spam
 * @param {string} html - HTML content
 * @param {Array<string>} stopWords - Array of stop words
 * @returns {Promise<Object>} - Analysis result
 */
export async function analyzeHtmlForSpam(html, stopWords) {
  const textContent = await extractTextContent(html);
  const metaTags = await extractMetaTags(html);
  
  // Combine all text sources for analysis
  const allText = [
    textContent,
    metaTags.title,
    metaTags.description,
    metaTags.keywords,
  ].filter(Boolean).join(' ');
  
  const stopWordsCheck = checkStopWords(allText, stopWords);
  
  return {
    textLength: textContent.length,
    metaTags: metaTags,
    stopWords: stopWordsCheck,
    isSpam: stopWordsCheck.count > 0 || stopWordsCheck.score > 5, // Threshold: 5% or any stop word
    spamScore: stopWordsCheck.score,
  };
}

