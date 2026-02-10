# Manga Scraper API

A modern JavaScript-based manga scraper that monitors manga chapters from various sources and tracks updates in a Supabase database. Built with Node.js v18+ using native ES modules and fetch API.

## Features

- 🚀 **Pure JavaScript**: Simple, no build step required - just run it!
- 📚 **Database Integration**: Tracks manga and chapter updates in Supabase
- 🔄 **Automated Checking**: Monitors for new chapters and updates automatically
- 🛡️ **Error Handling**: Robust error handling and retry mechanisms
- 📊 **Detailed Logging**: Comprehensive logging for monitoring and debugging
- ⚡ **ES Modules**: Modern ES module architecture
- 🌐 **Native Fetch**: Uses built-in fetch API (Node.js 18+)

## Requirements

- **Node.js v18.0.0 or higher** (for native fetch API and ES modules)
- npm or yarn package manager

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create a `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_key
   ```

3. **Database Setup:**
   Run the SQL schema in your Supabase database:
   ```bash
   # Copy contents of database.sql to your Supabase SQL editor
   ```

## Usage

### Run the scraper
```bash
npm run scrape
```

### Run in development mode
```bash
npm run dev
```

### Start the scraper
```bash
npm start
```

## Currently Monitored Manga

- Return of the Mount Hua Sect
- Nano Machine  
- Overgeared
- The Greatest Estate Developer
- The Regressed Mercenary's Machinations
- Standard of Reincarnation

## Sources

### Active Sources
- **DemonicScans** (demonicscans.org)

### Ready to Add
- AsuraComics (commented out, ready to enable)
- Additional sources can be easily added to the `SOURCE_CONFIG`

## Architecture

### Core Components

- **`fetchHomepage()`**: Retrieves content from manga sources using Jina AI reader
- **`parseChapters()`**: Parses text content for chapter information using regex patterns
- **`updateManga()`**: Updates database records when new chapters are found
- **`runScraper()`**: Main orchestration function

### Data Structures

The scraper uses simple JavaScript objects:

**Manga Record (from database):**
```javascript
{
  id: 'uuid',
  title: 'Manga Title',
  source: 'demonicscans',
  url: 'https://...',
  latest_chapter: 123,
  last_checked: '2025-11-01T...',
  created_at: '2025-11-01T...',
  updated_at: '2025-11-01T...'
}
```

**Scraped Chapter:**
```javascript
{
  title: 'Manga Title',
  chapter: 123,
  source: 'demonicscans',
  url: 'https://...' // optional
}
```

### Database Schema

```sql
CREATE TABLE mangas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL,
  latest_chapter INTEGER DEFAULT 0,
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(title, source)
);
```

## Adding New Sources

1. Add source configuration to `SOURCE_CONFIG` in `src/scraper.js`:
   ```javascript
   'newsource': {
     baseUrl: 'https://newsource.com',
   }
   ```

2. Add to active sources in `runScraper()`:
   ```javascript
   const activeSources = ['demonicscans', 'newsource'];
   ```

## GitHub Actions

The project includes a GitHub Actions workflow that runs the scraper automatically every 6 hours.

## Scripts

- `npm run scrape`: Run scraper directly
- `npm run dev`: Run scraper in development mode  
- `npm start`: Start the scraper

## Why JavaScript (not TypeScript)?

This project uses pure JavaScript for simplicity and to take advantage of modern Node.js features:

- ✅ **No Build Step**: Run your code directly without compilation
- ✅ **Simpler Setup**: No TypeScript configuration or type definitions needed
- ✅ **Faster Development**: Instant feedback, no compilation wait time
- ✅ **Native ES Modules**: Full ES6+ support out of the box
- ✅ **Modern Node.js**: Leverages Node.js 18+ native fetch and ESM support
- ✅ **Easy Deployment**: Just copy files and run - no build process required

The code is clean, well-commented, and uses modern JavaScript patterns. If you prefer type safety, you can add JSDoc comments for editor autocomplete.