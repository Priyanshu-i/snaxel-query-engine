/**
 * Snaxel Query Engine
 * A robust, modular web scraping library for multimodal content discovery
 */

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';

// Configuration
const CONFIG = {
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  concurrency: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  viewport: { width: 1920, height: 1080 },
  blockResources: ['image', 'stylesheet', 'font', 'media']
};

// Browser instance management
let browserInstance = null;

/**
 * Get or create a shared browser instance
 */
async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled'
      ]
    });
  }
  return browserInstance;
}

/**
 * Close the browser instance
 */
export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Utility: Sleep function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Utility: Exponential backoff retry
 */
async function retry(fn, retries = CONFIG.maxRetries) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      const delay = CONFIG.retryDelay * Math.pow(2, i);
      console.warn(`Retry ${i + 1}/${retries} after ${delay}ms:`, error.message);
      await sleep(delay);
    }
  }
}

/**
 * Utility: Create a new page with optimizations
 */
async function createOptimizedPage(browser) {
  const page = await browser.newPage();
  
  await page.setUserAgent(CONFIG.userAgent);
  await page.setViewport(CONFIG.viewport);
  
  // Block unnecessary resources
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (CONFIG.blockResources.includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  // Stealth mode
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });

  return page;
}

/**
 * 1. Get Web Search Results
 */
export async function getWebResults(query, options = {}) {
  const { limit = 10, source = 'duckduckgo' } = options;
  
  return retry(async () => {
    const browser = await getBrowser();
    const page = await createOptimizedPage(browser);
    
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2', 
        timeout: CONFIG.timeout 
      });

      const content = await page.content();
      const $ = cheerio.load(content);
      
      const results = [];
      $('.result').slice(0, limit).each((i, elem) => {
        const $elem = $(elem);
        const title = $elem.find('.result__title').text().trim();
        const url = $elem.find('.result__url').attr('href') || '';
        const snippet = $elem.find('.result__snippet').text().trim();
        
        if (title && url) {
          results.push({
            title,
            url: url.startsWith('http') ? url : `https://${url}`,
            snippet,
            meta: { position: i + 1 }
          });
        }
      });

      return {
        source: 'duckduckgo',
        query,
        results,
        timestamp: new Date().toISOString()
      };
    } finally {
      await page.close();
    }
  });
}

/**
 * 2. Get Image Search Results
 */
export async function getImageResults(query, options = {}) {
  const { limit = 20, safeSearch = true } = options;
  
  return retry(async () => {
    const browser = await getBrowser();
    const page = await createOptimizedPage(browser);
    
    // Re-enable images for this page
    await page.setRequestInterception(false);
    
    try {
      const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&first=1`;
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2', 
        timeout: CONFIG.timeout 
      });

      await sleep(2000); // Allow dynamic content to load

      const images = await page.evaluate((limit) => {
        const results = [];
        const imgElements = document.querySelectorAll('.iusc');
        
        for (let i = 0; i < Math.min(imgElements.length, limit); i++) {
          const elem = imgElements[i];
          const m = elem.getAttribute('m');
          
          if (m) {
            try {
              const data = JSON.parse(m);
              results.push({
                url: data.murl || data.turl,
                thumbnail: data.turl,
                title: data.t || '',
                source: data.purl || '',
                width: data.mw,
                height: data.mh
              });
            } catch (e) {
              // Skip malformed data
            }
          }
        }
        return results;
      }, limit);

      return {
        source: 'bing_images',
        query,
        results: images.map((img, i) => ({
          title: img.title,
          url: img.url,
          thumbnail: img.thumbnail,
          snippet: `${img.width}x${img.height}`,
          meta: { 
            source: img.source,
            dimensions: { width: img.width, height: img.height },
            position: i + 1
          }
        })),
        timestamp: new Date().toISOString()
      };
    } finally {
      await page.close();
    }
  });
}

/**
 * 3. Get Video Search Results (YouTube)
 */
export async function getVideoResults(query, options = {}) {
  const { limit = 10 } = options;
  
  return retry(async () => {
    const browser = await getBrowser();
    const page = await createOptimizedPage(browser);
    
    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2', 
        timeout: CONFIG.timeout 
      });

      await sleep(2000);

      const videos = await page.evaluate((limit) => {
        const results = [];
        const videoElements = document.querySelectorAll('ytd-video-renderer');
        
        for (let i = 0; i < Math.min(videoElements.length, limit); i++) {
          const elem = videoElements[i];
          
          const titleElem = elem.querySelector('#video-title');
          const channelElem = elem.querySelector('#channel-name a');
          const thumbnailElem = elem.querySelector('img');
          const durationElem = elem.querySelector('span.style-scope.ytd-thumbnail-overlay-time-status-renderer');
          
          if (titleElem) {
            results.push({
              title: titleElem.getAttribute('title') || titleElem.textContent.trim(),
              url: 'https://www.youtube.com' + titleElem.getAttribute('href'),
              channel: channelElem ? channelElem.textContent.trim() : '',
              thumbnail: thumbnailElem ? thumbnailElem.src : '',
              duration: durationElem ? durationElem.textContent.trim() : ''
            });
          }
        }
        return results;
      }, limit);

      return {
        source: 'youtube',
        query,
        results: videos.map((video, i) => ({
          title: video.title,
          url: video.url,
          snippet: `Channel: ${video.channel}`,
          thumbnail: video.thumbnail,
          meta: { 
            channel: video.channel,
            duration: video.duration,
            position: i + 1
          }
        })),
        timestamp: new Date().toISOString()
      };
    } finally {
      await page.close();
    }
  });
}

/**
 * 4. Get News Search Results
 */
export async function getNewsResults(query, options = {}) {
  const { limit = 10, recent = true } = options;
  
  return retry(async () => {
    const browser = await getBrowser();
    const page = await createOptimizedPage(browser);
    
    try {
      const searchUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}`;
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2', 
        timeout: CONFIG.timeout 
      });

      const content = await page.content();
      const $ = cheerio.load(content);
      
      const results = [];
      $('.news-card').slice(0, limit).each((i, elem) => {
        const $elem = $(elem);
        const title = $elem.find('.title').text().trim();
        const url = $elem.find('a.title').attr('href') || '';
        const snippet = $elem.find('.snippet').text().trim();
        const source = $elem.find('.source').text().trim();
        const timestamp = $elem.find('.source span').last().text().trim();
        
        if (title && url) {
          results.push({
            title,
            url: url.startsWith('http') ? url : `https://www.bing.com${url}`,
            snippet,
            meta: { 
              source,
              timestamp,
              position: i + 1
            }
          });
        }
      });

      return {
        source: 'bing_news',
        query,
        results,
        timestamp: new Date().toISOString()
      };
    } finally {
      await page.close();
    }
  });
}

/**
 * 5. Get Book Search Results
 */
export async function getBookResults(query, options = {}) {
  const { limit = 10 } = options;
  
  return retry(async () => {
    const browser = await getBrowser();
    const page = await createOptimizedPage(browser);
    
    try {
      const searchUrl = `https://www.goodreads.com/search?q=${encodeURIComponent(query)}`;
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2', 
        timeout: CONFIG.timeout 
      });

      const content = await page.content();
      const $ = cheerio.load(content);
      
      const results = [];
      $('tr[itemtype="http://schema.org/Book"]').slice(0, limit).each((i, elem) => {
        const $elem = $(elem);
        const title = $elem.find('.bookTitle span').text().trim();
        const url = 'https://www.goodreads.com' + $elem.find('.bookTitle').attr('href');
        const author = $elem.find('.authorName span').text().trim();
        const rating = $elem.find('.minirating').text().trim();
        const cover = $elem.find('img.bookCover').attr('src') || '';
        
        if (title) {
          results.push({
            title,
            url,
            snippet: `By ${author} • ${rating}`,
            thumbnail: cover,
            meta: { 
              author,
              rating,
              position: i + 1
            }
          });
        }
      });

      return {
        source: 'goodreads',
        query,
        results,
        timestamp: new Date().toISOString()
      };
    } finally {
      await page.close();
    }
  });
}

/**
 * BONUS: Query All Sources in Parallel
 */
export async function queryAllSources(query, options = {}) {
  const limit = pLimit(CONFIG.concurrency);
  
  const tasks = [
    limit(() => getWebResults(query, options)),
    limit(() => getImageResults(query, options)),
    limit(() => getVideoResults(query, options)),
    limit(() => getNewsResults(query, options)),
    limit(() => getBookResults(query, options))
  ];

  const results = await Promise.allSettled(tasks);
  
  return {
    query,
    timestamp: new Date().toISOString(),
    sources: {
      web: results[0].status === 'fulfilled' ? results[0].value : { error: results[0].reason?.message },
      images: results[1].status === 'fulfilled' ? results[1].value : { error: results[1].reason?.message },
      videos: results[2].status === 'fulfilled' ? results[2].value : { error: results[2].reason?.message },
      news: results[3].status === 'fulfilled' ? results[3].value : { error: results[3].reason?.message },
      books: results[4].status === 'fulfilled' ? results[4].value : { error: results[4].reason?.message }
    }
  };
}

/**
 * BONUS: Summarize Top Results
 */
export function summarizeResults(queryResults) {
  const summary = {
    query: queryResults.query,
    totalResults: 0,
    topResults: []
  };

  Object.entries(queryResults.sources).forEach(([source, data]) => {
    if (data.results) {
      summary.totalResults += data.results.length;
      summary.topResults.push({
        source,
        top: data.results.slice(0, 3).map(r => ({ title: r.title, url: r.url }))
      });
    }
  });

  return summary;
}

// Export configuration for advanced users
export { CONFIG };