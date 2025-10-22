/**
 * Example Usage of Snaxel Query Engine
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
} from '../index.js'; // Ensure this path to your main library file is correct

// --- Core Example Function ---
async function runExamples() {
    console.log('🚀 Snaxel Query Engine Examples\n');

    try {
        // Example 1: Web Search
        console.log('1️⃣ Searching web for "Node.js best practices"...');
        const webResults = await getWebResults('Node.js best practices', { limit: 5 });
        console.log(`Found ${webResults.results.length} results`);
        console.log('Top result:', webResults.results[0]?.title);
        console.log('----------------------------------------');

        // Example 2: Image Search
        console.log('2️⃣ Searching images for "sunset mountains"...');
        const imageResults = await getImageResults('sunset mountains', { limit: 5 });
        console.log(`Found ${imageResults.results.length} images`);
        console.log('First image URL:', imageResults.results[0]?.url);
        console.log('----------------------------------------');

        // Example 3: Video Search
        console.log('3️⃣ Searching videos for "javascript tutorial"...');
        const videoResults = await getVideoResults('javascript tutorial', { limit: 3 });
        console.log(`Found ${videoResults.results.length} videos`);
        console.log('Top video:', videoResults.results[0]?.title);
        console.log('Channel:', videoResults.results[0]?.meta?.channel);
        console.log('----------------------------------------');

        // Example 4: News Search
        console.log('4️⃣ Searching news for "artificial intelligence"...');
        const newsResults = await getNewsResults('artificial intelligence', { limit: 5 });
        console.log(`Found ${newsResults.results.length} articles`);
        console.log('Latest:', newsResults.results[0]?.title);
        console.log('----------------------------------------');

        // Example 5: Book Search
        console.log('5️⃣ Searching books for "clean code"...');
        const bookResults = await getBookResults('clean code', { limit: 3 });
        console.log(`Found ${bookResults.results.length} books`);
        console.log('Top book:', bookResults.results[0]?.title);
        console.log('Author:', bookResults.results[0]?.meta?.author);
        console.log('----------------------------------------');

        // Example 6: Query All Sources
        console.log('6️⃣ Querying all sources for "machine learning"...');
        const allResults = await queryAllSources('machine learning', { limit: 3 });
        console.log('\nSummary:');
        const summary = summarizeResults(allResults);
        console.log(JSON.stringify(summary, null, 2));
        console.log('----------------------------------------');

        console.log('✅ All examples completed successfully!');
    } catch (error) {
        // Log the error and also ensure the browser is closed in case of a crash before 'finally'
        console.error('❌ An error occurred during examples:', error.message);
    } finally {
        // Always close the browser, regardless of success or failure
        await closeBrowser();
        console.log('\n🔒 Browser closed');
    }
}

// --- Next.js/Server-side Integration Example (Exported, but not run directly) ---
/**
 * Integration example for a server route (e.g., Express or Next.js API).
 * This part is correctly structured as an export and is NOT executed when you run basic.js.
 */
export async function handleSnaxelQuery(req, res) {
    // This is utility code that would be used in a different context (server)
    const { query, sources = ['web'], limit = 10 } = req.body;
    // ... (rest of server handling logic remains the same)
    // Note: The logic for closing the browser should be managed at the application level 
    // when using an exported function in a long-running server.
}

// --- Direct Execution Check (The Fix) ---
/**
 * Standard Node.js way to check if a file is executed directly 
 * vs. imported as a module in an ES Module (type: "module") environment.
 */
if (process.argv[1] === new URL(import.meta.url).pathname) {
    runExamples();
}
// Note: Your original check `if (import.meta.url === `file://${process.argv[1]}`)` is 
// generally correct but can be less reliable on Windows where path formats differ. 
// The use of `new URL()` and `.pathname` is the most robust way in ES Modules.