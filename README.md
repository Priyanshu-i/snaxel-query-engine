# 🔍 Snaxel Query Engine

A robust, modular, and blazingly fast Node.js library for multimodal web content discovery. Built with Puppeteer and Cheerio, designed for the **Snaxel** meta-platform.

[![npm version](https://img.shields.io/npm/v/snaxel-query-engine.svg)](https://www.npmjs.com/package/snaxel-query-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🌐 **Web Search** - DuckDuckGo scraping with retry logic
- 🖼️ **Image Search** - Bing Images with metadata
- 🎥 **Video Search** - YouTube results with channel info
- 📰 **News Search** - Latest news from Bing News
- 📚 **Book Search** - Goodreads integration
- ⚡ **Parallel Execution** - Query all sources simultaneously
- 🛡️ **Anti-Detection** - Stealth mode for headless browsers
- 🔄 **Retry Logic** - Exponential backoff on failures
- 🚀 **Performance** - Resource blocking, browser reuse, concurrency control
- 📦 **Zero Config** - Works out of the box

---

## 📦 Installation

```bash
npm install snaxel-query-engine
```

Or with yarn:

```bash
yarn add snaxel-query-engine
```

---

## 🚀 Quick Start

### Basic Usage

```javascript
import { getWebResults, closeBrowser } from 'snaxel-query-engine';

const results = await getWebResults('artificial intelligence');
console.log(results);

// Always close browser when done
await closeBrowser();
```

### Query All Sources

```javascript
import { queryAllSources, summarizeResults, closeBrowser } from 'snaxel-query-engine';

const allResults = await queryAllSources('machine learning', { limit: 10 });
console.log(allResults);

// Get a summary
const summary = summarizeResults(allResults);
console.log(summary);

await closeBrowser();
```

---

## 📚 API Reference

### `getWebResults(query, options)`

Search the web for text-based results.

**Parameters:**
- `query` (string) - Search query
- `options` (object) - Optional configuration
  - `limit` (number) - Max results (default: 10)
  - `source` (string) - Search engine (default: 'duckduckgo')

**Returns:** Promise<Object>

```javascript
{
  source: 'duckduckgo',
  query: 'nodejs',
  results: [
    {
      title: 'Node.js',
      url: 'https://nodejs.org',
      snippet: 'Node.js® is a JavaScript runtime...',
      meta: { position: 1 }
    }
  ],
  timestamp: '2025-10-22T10:30:00.000Z'
}
```

---

### `getImageResults(query, options)`

Search for images with metadata.

**Parameters:**
- `query` (string) - Search query
- `options` (object)
  - `limit` (number) - Max results (default: 20)
  - `safeSearch` (boolean) - Enable safe search (default: true)

**Returns:** Promise<Object>

```javascript
{
  source: 'bing_images',
  query: 'sunset',
  results: [
    {
      title: 'Beautiful Sunset',
      url: 'https://example.com/image.jpg',
      thumbnail: 'https://example.com/thumb.jpg',
      snippet: '1920x1080',
      meta: {
        source: 'https://example.com',
        dimensions: { width: 1920, height: 1080 },
        position: 1
      }
    }
  ]
}
```

---

### `getVideoResults(query, options)`

Search YouTube for videos.

**Parameters:**
- `query` (string) - Search query
- `options` (object)
  - `limit` (number) - Max results (default: 10)

**Returns:** Promise<Object>

```javascript
{
  source: 'youtube',
  query: 'coding tutorial',
  results: [
    {
      title: 'JavaScript Tutorial for Beginners',
      url: 'https://youtube.com/watch?v=...',
      snippet: 'Channel: Code Academy',
      thumbnail: 'https://i.ytimg.com/...',
      meta: {
        channel: 'Code Academy',
        duration: '15:30',
        position: 1
      }
    }
  ]
}
```

---

### `getNewsResults(query, options)`

Search for news articles.

**Parameters:**
- `query` (string) - Search query
- `options` (object)
  - `limit` (number) - Max results (default: 10)
  - `recent` (boolean) - Prioritize recent news (default: true)

**Returns:** Promise<Object>

---

### `getBookResults(query, options)`

Search for books on Goodreads.

**Parameters:**
- `query` (string) - Search query
- `options` (object)
  - `limit` (number) - Max results (default: 10)

**Returns:** Promise<Object>

---

### `queryAllSources(query, options)`

Query all sources in parallel with concurrency control.

**Parameters:**
- `query` (string) - Search query
- `options` (object) - Options applied to all sources

**Returns:** Promise<Object>

```javascript
{
  query: 'artificial intelligence',
  timestamp: '2025-10-22T10:30:00.000Z',
  sources: {
    web: { source: 'duckduckgo', results: [...] },
    images: { source: 'bing_images', results: [...] },
    videos: { source: 'youtube', results: [...] },
    news: { source: 'bing_news', results: [...] },
    books: { source: 'goodreads', results: [...] }
  }
}
```

---

### `summarizeResults(queryResults)`

Generate a summary of query results.

**Parameters:**
- `queryResults` (object) - Results from `queryAllSources()`

**Returns:** Object

```javascript
{
  query: 'machine learning',
  totalResults: 47,
  topResults: [
    {
      source: 'web',
      top: [
        { title: '...', url: '...' },
        { title: '...', url: '...' },
        { title: '...', url: '...' }
      ]
    }
  ]
}
```

---

### `closeBrowser()`

Close the shared browser instance. Always call this when done.

```javascript
await closeBrowser();
```

---

## 🎯 CLI Usage

Install globally or use npx:

```bash
npx snaxel-query "your search query" [options]
```

### CLI Options

```bash
--web          Search web results only
--images       Search images only
--videos       Search videos only
--news         Search news only
--books        Search books only
--all          Search all sources (default)
--limit <n>    Limit results per source (default: 10)
--json         Output raw JSON
--summary      Show summary only
--help         Show help message
```

### CLI Examples

```bash
# Search all sources
npx snaxel-query "artificial intelligence"

# Search specific source
npx snaxel-query "cat videos" --videos --limit 5

# Get JSON output
npx snaxel-query "latest tech news" --news --json

# Get summary
npx snaxel-query "nodejs books" --all --summary
```

---

## 🔧 Advanced Configuration

### Custom Configuration

```javascript
import { CONFIG } from 'snaxel-query-engine';

// Modify global config
CONFIG.timeout = 60000; // 60 seconds
CONFIG.maxRetries = 5;
CONFIG.concurrency = 5;
CONFIG.userAgent = 'Custom User Agent';
```

### Integration with Next.js API Routes

```javascript
// pages/api/search.js
import { queryAllSources, closeBrowser } from 'snaxel-query-engine';

export default async function handler(req, res) {
  const { query, sources = ['web', 'images'], limit = 10 } = req.body;

  try {
    const results = await queryAllSources(query, { limit });
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    // Optional: close browser after each request
    // await closeBrowser();
  }
}
```

### React Component Example

```jsx
import { useState } from 'react';

export default function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, sources: ['web', 'images', 'videos'] })
      });
      const data = await response.json();
      setResults(data.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..." 
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      
      {results && (
        <div>
          <h3>Web Results: {results.sources.web?.results.length}</h3>
          <h3>Images: {results.sources.images?.results.length}</h3>
          <h3>Videos: {results.sources.videos?.results.length}</h3>
        </div>
      )}
    </div>
  );
}
```

---

## ⚙️ Performance Optimization

### Browser Reuse

The library automatically reuses browser instances across queries for better performance:

```javascript
// Good: Reuses browser
for (let i = 0; i < 10; i++) {
  await getWebResults(`query ${i}`);
}
await closeBrowser(); // Close once at the end

// Bad: Creates new browser each time
for (let i = 0; i < 10; i++) {
  await getWebResults(`query ${i}`);
  await closeBrowser(); // Don't do this in loops!
}
```

### Resource Blocking

Images, stylesheets, and fonts are automatically blocked for faster scraping. This is configurable:

```javascript
CONFIG.blockResources = ['image', 'stylesheet', 'font', 'media'];
```

### Concurrency Control

Parallel queries are limited to prevent overwhelming the system:

```javascript
CONFIG.concurrency = 3; // Max 3 concurrent scrapers
```

---

## 🛡️ Anti-Detection Features

- Custom user agent
- WebDriver flag removal
- Navigator properties spoofing
- Realistic viewport sizes
- Request interception
- Headless mode with stealth

---

## 🐛 Error Handling

All functions include retry logic with exponential backoff:

```javascript
try {
  const results = await getWebResults('query');
} catch (error) {
  console.error('Search failed after retries:', error.message);
}
```

Errors are gracefully handled in `queryAllSources()`:

```javascript
const results = await queryAllSources('query');

if (results.sources.web.error) {
  console.error('Web search failed:', results.sources.web.error);
}
```

---

## 📊 Example Output

```javascript
{
  "source": "duckduckgo",
  "query": "nodejs tutorial",
  "results": [
    {
      "title": "Node.js Tutorial - W3Schools",
      "url": "https://www.w3schools.com/nodejs/",
      "snippet": "Node.js is an open source server environment...",
      "meta": { "position": 1 }
    },
    {
      "title": "Introduction to Node.js",
      "url": "https://nodejs.dev/learn",
      "snippet": "Learn how to use Node.js to build apps...",
      "meta": { "position": 2 }
    }
  ],
  "timestamp": "2025-10-22T10:30:00.000Z"
}
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT © Snaxel Team

---

## 🔗 Links

- [Documentation](https://github.com/Priyanshu-i/snaxel-query-engine)
- [npm Package](https://www.npmjs.com/package/snaxel-query-engine)
- [Report Issues](https://github.com/Priyanshu-i/snaxel-query-engine/issues)

---

## ⚠️ Disclaimer

This library is for educational and research purposes. Always respect website terms of service and robots.txt files. Use responsibly and ethically.

---

## 🙏 Acknowledgments

- Built with [Puppeteer](https://pptr.dev/)
- Powered by [Cheerio](https://cheerio.js.org/)
- Concurrency by [p-limit](https://github.com/sindresorhus/p-limit)

---

**Made with ❤️ by the Snaxel Team**