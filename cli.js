#!/usr/bin/env node

/**
 * Snaxel Query Engine CLI
 * Usage: npx snaxel-query "your search query" [options]
 */

import {
  getWebResults,
  getImageResults,
  getVideoResults,
  getNewsResults,
  getBookResults,
  queryAllSources,
  summarizeResults,
  closeBrowser
} from './index.js';

const args = process.argv.slice(2);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function printHelp() {
  console.log(`
${colors.bright}Snaxel Query Engine CLI${colors.reset}

${colors.cyan}Usage:${colors.reset}
  npx snaxel-query <query> [options]

${colors.cyan}Options:${colors.reset}
  --web          Search web results only
  --images       Search images only
  --videos       Search videos only
  --news         Search news only
  --books        Search books only
  --all          Search all sources (default)
  --limit <n>    Limit results per source (default: 10)
  --json         Output raw JSON
  --summary      Show summary only
  --help         Show this help message

${colors.cyan}Examples:${colors.reset}
  npx snaxel-query "artificial intelligence"
  npx snaxel-query "cat videos" --videos --limit 5
  npx snaxel-query "latest tech news" --news --json
  npx snaxel-query "nodejs books" --all --summary
  `);
}

function formatResults(data, type) {
  console.log(`\n${colors.bright}${colors.cyan}━━━ ${type.toUpperCase()} RESULTS ━━━${colors.reset}\n`);
  
  if (data.error) {
    console.log(`${colors.yellow}Error: ${data.error}${colors.reset}`);
    return;
  }

  if (!data.results || data.results.length === 0) {
    console.log(`${colors.yellow}No results found${colors.reset}`);
    return;
  }

  data.results.forEach((result, i) => {
    console.log(`${colors.bright}${i + 1}. ${result.title}${colors.reset}`);
    console.log(`   ${colors.blue}${result.url}${colors.reset}`);
    if (result.snippet) {
      console.log(`   ${colors.reset}${result.snippet.substring(0, 100)}${colors.reset}`);
    }
    if (result.meta) {
      const metaStr = Object.entries(result.meta)
        .filter(([k]) => k !== 'position')
        .map(([k, v]) => `${k}: ${v}`)
        .join(' • ');
      if (metaStr) {
        console.log(`   ${colors.magenta}${metaStr}${colors.reset}`);
      }
    }
    console.log('');
  });
}

async function main() {
  if (args.length === 0 || args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  // Parse arguments
  const query = args.find(arg => !arg.startsWith('--'));
  const options = {
    limit: parseInt(args[args.indexOf('--limit') + 1]) || 10
  };

  if (!query) {
    console.error(`${colors.yellow}Error: Please provide a search query${colors.reset}`);
    printHelp();
    process.exit(1);
  }

  const jsonOutput = args.includes('--json');
  const summaryOnly = args.includes('--summary');
  const searchWeb = args.includes('--web');
  const searchImages = args.includes('--images');
  const searchVideos = args.includes('--videos');
  const searchNews = args.includes('--news');
  const searchBooks = args.includes('--books');
  const searchAll = args.includes('--all') || 
    (!searchWeb && !searchImages && !searchVideos && !searchNews && !searchBooks);

  console.log(`${colors.bright}${colors.green}🔍 Searching for: "${query}"${colors.reset}\n`);

  try {
    let results;

    if (searchAll) {
      results = await queryAllSources(query, options);
      
      if (jsonOutput) {
        console.log(JSON.stringify(results, null, 2));
      } else if (summaryOnly) {
        const summary = summarizeResults(results);
        console.log(JSON.stringify(summary, null, 2));
      } else {
        formatResults(results.sources.web, 'web');
        formatResults(results.sources.images, 'images');
        formatResults(results.sources.videos, 'videos');
        formatResults(results.sources.news, 'news');
        formatResults(results.sources.books, 'books');
      }
    } else {
      // Execute individual searches
      const tasks = [];
      
      if (searchWeb) tasks.push({ fn: getWebResults, name: 'web' });
      if (searchImages) tasks.push({ fn: getImageResults, name: 'images' });
      if (searchVideos) tasks.push({ fn: getVideoResults, name: 'videos' });
      if (searchNews) tasks.push({ fn: getNewsResults, name: 'news' });
      if (searchBooks) tasks.push({ fn: getBookResults, name: 'books' });

      for (const task of tasks) {
        const result = await task.fn(query, options);
        
        if (jsonOutput) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          formatResults(result, task.name);
        }
      }
    }

    console.log(`${colors.green}✓ Search completed${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.yellow}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  } finally {
    await closeBrowser();
  }
}

main();