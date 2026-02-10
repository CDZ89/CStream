import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuration for supported sources
const SOURCE_CONFIG = {
  'demonicscans': {
    baseUrl: 'https://demonicscans.org'
  }
  // Ready to add more sources:
  // 'asuracomics': {
  //   baseUrl: 'https://asuracomics.net'
  // }
};

// 1️⃣ Fetch homepage content from source using native fetch (Node.js 18+)
async function fetchHomepage(source) {
  const config = SOURCE_CONFIG[source];
  if (!config) {
    throw new Error(`Unsupported source: ${source}`);
  }

  const jinaUrl = `https://r.jina.ai/${config.baseUrl}`;
  console.log(`🌐 Fetching content from: ${jinaUrl}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    
    const response = await fetch(jinaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/plain, text/html, */*'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const text = await response.text();
      console.log(`   ✅ Success! Received ${text.length} characters from ${source}`);
      return text;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`   ❌ Fetch failed:`, error instanceof Error ? error.message : error);
    throw new Error(`Failed to fetch from ${source}`);
  }
}

// 2️⃣ Parse homepage text for title/chapter patterns
function parseChapters(text, source) {
  const results = [];
  const seenTitles = new Set(); // Avoid duplicates
  
  console.log(`🔍 Parsing content from ${source}`);

  // Split at "Latest Updates" section and take everything after it
  const latestUpdatesMarker = '[Latest Updates](https://demonicscans.org/#)';
  const parts = text.split(latestUpdatesMarker);
  
  if (parts.length < 2) {
    console.log(`❌ Could not find "Latest Updates" section`);
    return results;
  }
  
  console.log(`📍 Found "Latest Updates" section, parsing content...`);
  const latestUpdatesContent = parts[1];
  const lines = latestUpdatesContent.split('\n');
  
  console.log(`📄 Parsing ${lines.length} lines from Latest Updates section`);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for title pattern: [Title](url "Title")
    // More flexible - just needs [text](url)
    const titleMatch = line.match(/^\[([^\]]+)\]\(https?:\/\/demonicscans\.org\/manga\/[^\s)]+/);
    if (titleMatch) {
      let title = titleMatch[1].trim();
      title = cleanTitle(title);
      
      // Look ahead for chapter link in the next few lines
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].trim();
        const chapterMatch = nextLine.match(/^\[Chapter\s+(\d+(?:\.\d+)?)\]\((https?:\/\/[^\)]+)\)/);
        
        if (chapterMatch && !seenTitles.has(title)) {
          const chapter = parseFloat(chapterMatch[1]);
          const chapterUrl = chapterMatch[2];
          
          if (chapter > 0) {
            console.log(`🎯 Found: "${title}" Chapter ${chapter}`);
            results.push({ title, chapter, url: chapterUrl, source });
            seenTitles.add(title);
            break; // Move to next title
          }
        }
      }
    }
  }

  console.log(`📊 Found ${results.length} unique chapters from ${source}`);
  return results;
}

// Helper function to clean manga titles
function cleanTitle(title) {
  return title
    // Handle multiple title formats (e.g., "Title;;Alternative Title")
    .split(';;')[0] // Take first title if multiple
    .split(';')[0]  // Handle single semicolon too
    .trim();
}

// 3️⃣ Update manga record if new chapter is found
async function updateManga(scrapedChapter) {
  try {
    const { title, chapter, url, source } = scrapedChapter;
    
    // Find matching manga in database - direct title match only (case insensitive)
    const { data: mangas, error: fetchError } = await supabase
      .from('mangas')
      .select('id, title, latest_chapter, source')
      .eq('source', source)
      .ilike('title', title);

    if (fetchError) {
      console.error(`❌ Database error for "${title}":`, fetchError.message);
      return false;
    }

    if (!mangas || mangas.length === 0) {
    //   console.log(`ℹ️  No matching manga found for "${title}" from ${source}`);
      return false;
    }

    const manga = mangas[0]; // Take first match
    const updateData = {
      last_checked: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update if new chapter is higher
    if (chapter > manga.latest_chapter) {
      console.log(`📈 New chapter: "${manga.title}" ${manga.latest_chapter} → ${chapter}`);
      updateData.latest_chapter = chapter;
      updateData.chapter_url = url;
      
      const { error: updateError } = await supabase
        .from('mangas')
        .update(updateData)
        .eq('id', manga.id);
        
      if (updateError) {
        console.error(`❌ Failed to update "${title}":`, updateError.message);
        return false;
      }
      
      console.log(`✅ Updated "${manga.title}" to chapter ${chapter}`);
      console.log(`   Chapter URL: ${url}`);
      return true;
    } else {
      // Just update last_checked timestamp
      const { error: updateError } = await supabase
        .from('mangas')
        .update(updateData)
        .eq('id', manga.id);
        
      if (updateError) {
        console.error(`❌ Failed to update timestamp for "${title}":`, updateError.message);
      }
      
      console.log(`📊 "${manga.title}": Chapter ${chapter} ≤ ${manga.latest_chapter} (current)`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Unexpected error processing "${scrapedChapter.title}":`, error);
    return false;
  }
}

// 4️⃣ Main scraper function
export async function runScraper() {
  console.log('🚀 Starting manga scraper...');
  console.log(`⏰ Started at: ${new Date().toISOString()}`);

  const startTime = Date.now();
  const stats = {
    totalChaptersFound: 0,
    totalUpdates: 0,
    sourcesProcessed: 0
  };

  // Currently active sources
  const activeSources = ['demonicscans'];

  for (const source of activeSources) {
    console.log(`\n🔍 Processing source: ${source.toUpperCase()}`);
    
    try {
      const html = await fetchHomepage(source);
      const chapters = parseChapters(html, source);
      stats.totalChaptersFound += chapters.length;

      if (chapters.length === 0) {
        console.log(`⚠️  No chapters found for ${source}`);
        continue;
      }

      console.log(`📚 Checking ${chapters.length} chapters for updates...`);
      
      for (const chapter of chapters) {
        const wasUpdated = await updateManga(chapter);
        if (wasUpdated) {
          stats.totalUpdates++;
        }
        // Small delay to be respectful to database
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      stats.sourcesProcessed++;
      console.log(`✅ Completed ${source}`);
      
    } catch (error) {
      console.error(`❌ Error processing ${source}:`, error instanceof Error ? error.message : error);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n📊 SCRAPING SUMMARY:`);
  console.log(`   ⏱️  Duration: ${duration}s`);
  console.log(`   📚 Chapters found: ${stats.totalChaptersFound}`);
  console.log(`   📈 Updates made: ${stats.totalUpdates}`);
  console.log(`   🔄 Sources: ${stats.sourcesProcessed}/${activeSources.length}`);
  console.log(`   ⏰ Completed: ${new Date().toISOString()}`);
  console.log('✅ Scraper finished.');
}

// Helper function to test database connection
async function testDatabaseConnection() {
  try {
    console.log('🔧 Testing database connection...');
    const { error } = await supabase
      .from('mangas')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

// Main execution function
async function main() {
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.error('💥 Exiting due to database connection failure');
      process.exit(1);
    }

    // Run the scraper
    await runScraper();
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Execute when called directly or with 'run' argument
// In ES modules, we use import.meta.url to check if this is the main module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule || process.argv[2] === 'run') {
  main().catch(console.error);
}
