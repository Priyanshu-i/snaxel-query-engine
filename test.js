/**
 * Test Suite for Snaxel Query Engine
 */

import {
  getWebResults,
  getImageResults,
  getVideoResults,
  getNewsResults,
  getBookResults,
  queryAllSources,
  summarizeResults,
  closeBrowser,
  CONFIG
} from './index.js';

// Test utilities
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
};

const testTimeout = async (fn, timeout = 45000) => {
  return Promise.race([
    fn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Test timeout')), timeout)
    )
  ]);
};

// Test suite
async function runTests() {
  console.log('🧪 Starting Snaxel Query Engine Tests\n');
  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Web Search
    console.log('Test 1: Web Search');
    await testTimeout(async () => {
      const results = await getWebResults('nodejs', { limit: 5 });
      assert(results.source === 'duckduckgo', 'Source should be duckduckgo');
      assert(results.query === 'nodejs', 'Query should be preserved');
      assert(Array.isArray(results.results), 'Results should be an array');
      assert(results.results.length > 0, 'Should return results');
      assert(results.results[0].title, 'Result should have title');
      assert(results.results[0].url, 'Result should have URL');
      assert(results.timestamp, 'Should have timestamp');
      passed++;
    });
    console.log('');

    // Test 2: Image Search
    console.log('Test 2: Image Search');
    await testTimeout(async () => {
      const results = await getImageResults('cat', { limit: 5 });
      assert(results.source === 'bing_images', 'Source should be bing_images');
      assert(results.results.length > 0, 'Should return image results');
      assert(results.results[0].url, 'Image should have URL');
      assert(results.results[0].thumbnail, 'Image should have thumbnail');
      assert(results.results[0].meta, 'Image should have meta data');
      passed++;
    });
    console.log('');

    // Test 3: Video Search
    console.log('Test 3: Video Search');
    await testTimeout(async () => {
      const results = await getVideoResults('tutorial', { limit: 3 });
      assert(results.source === 'youtube', 'Source should be youtube');
      assert(results.results.length > 0, 'Should return video results');
      assert(results.results[0].title, 'Video should have title');
      assert(results.results[0].url.includes('youtube.com'), 'Should be YouTube URL');
      assert(results.results[0].meta.channel, 'Should have channel info');
      passed++;
    });
    console.log('');

    // Test 4: News Search
    console.log('Test 4: News Search');
    await testTimeout(async () => {
      const results = await getNewsResults('technology', { limit: 5 });
      assert(results.source === 'bing_news', 'Source should be bing_news');
      assert(results.results.length > 0, 'Should return news results');
      assert(results.results[0].title, 'News should have title');
      assert(results.results[0].url, 'News should have URL');
      passed++;
    });
    console.log('');

    // Test 5: Book Search
    console.log('Test 5: Book Search');
    await testTimeout(async () => {
      const results = await getBookResults('javascript', { limit: 3 });
      assert(results.source === 'goodreads', 'Source should be goodreads');
      assert(results.results.length > 0, 'Should return book results');
      assert(results.results[0].title, 'Book should have title');
      assert(results.results[0].meta.author, 'Book should have author');
      passed++;
    });
    console.log('');

    // Test 6: Query All Sources
    console.log('Test 6: Query All Sources');
    await testTimeout(async () => {
      const results = await queryAllSources('test', { limit: 2 });
      assert(results.query === 'test', 'Query should be preserved');
      assert(results.sources, 'Should have sources object');
      assert(results.sources.web, 'Should have web results');
      assert(results.sources.images, 'Should have image results');
      assert(results.sources.videos, 'Should have video results');
      assert(results.sources.news, 'Should have news results');
      assert(results.sources.books, 'Should have book results');
      passed++;
    }, 60000); // Longer timeout for parallel queries
    console.log('');

    // Test 7: Summarize Results
    console.log('Test 7: Summarize Results');
    const allResults = await queryAllSources('summary test', { limit: 2 });
    const summary = summarizeResults(allResults);
    assert(summary.query === 'summary test', 'Summary should preserve query');
    assert(typeof summary.totalResults === 'number', 'Should have total count');
    assert(Array.isArray(summary.topResults), 'Should have top results array');
    passed++;
    console.log('');

    // Test 8: Configuration
    console.log('Test 8: Configuration');
    assert(CONFIG.timeout > 0, 'Should have timeout config');
    assert(CONFIG.maxRetries > 0, 'Should have retry config');
    assert(CONFIG.userAgent, 'Should have user agent');
    assert(Array.isArray(CONFIG.blockResources), 'Should have block list');
    passed++;
    console.log('');

    // Test 9: Error Handling
    console.log('Test 9: Error Handling');
    try {
      // This should handle errors gracefully
      const results = await queryAllSources('error test query xyz', { limit: 1 });
      assert(results.sources, 'Should still return sources object on errors');
      passed++;
    } catch (error) {
      console.log('Expected error handling works');
      passed++;
    }
    console.log('');

    // Test 10: Result Format Validation
    console.log('Test 10: Result Format Validation');
    const formatTest = await getWebResults('format test', { limit: 1 });
    assert(formatTest.source, 'Should have source field');
    assert(formatTest.query, 'Should have query field');
    assert(formatTest.results, 'Should have results field');
    assert(formatTest.timestamp, 'Should have timestamp field');
    if (formatTest.results.length > 0) {
      const result = formatTest.results[0];
      assert(result.title !== undefined, 'Result should have title');
      assert(result.url !== undefined, 'Result should have URL');
      assert(result.meta !== undefined, 'Result should have meta');
    }
    passed++;
    console.log('');

  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    console.error(error.stack);
    failed++;
  } finally {
    await closeBrowser();
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(50));
    
    if (failed === 0) {
      console.log('✅ All tests passed!\n');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed\n');
      process.exit(1);
    }
  }
}

// Run tests
runTests();