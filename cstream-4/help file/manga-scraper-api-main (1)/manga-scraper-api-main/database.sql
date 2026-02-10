-- Manga Scraper Database Schema
-- Table for tracking manga titles and their latest chapters

CREATE TABLE IF NOT EXISTS mangas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source TEXT NOT NULL, -- e.g. 'demonicscans', 'asuracomics'
  url TEXT NOT NULL,     -- full URL to the manga's page
  latest_chapter INTEGER DEFAULT 0,
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Create unique constraint to prevent duplicates
  UNIQUE(title, source)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mangas_source ON mangas(source);
CREATE INDEX IF NOT EXISTS idx_mangas_title ON mangas(title);
CREATE INDEX IF NOT EXISTS idx_mangas_last_checked ON mangas(last_checked);

-- Insert initial manga titles for tracking
INSERT INTO mangas (title, source, url, latest_chapter)
VALUES
  ('Return of the Mount Hua Sect', 'demonicscans', 'https://demonicscans.org/manga/return-of-the-mount-hua-sect/', 0),
  ('Nano Machine', 'demonicscans', 'https://demonicscans.org/manga/Nano-Machine/', 0),
  ('Overgeared', 'demonicscans', 'https://demonicscans.org/manga/Overgeared/', 0),
  ('The Greatest Estate Developer', 'demonicscans', 'https://demonicscans.org/manga/The-Greatest-Estate-Developer/', 0),
ON CONFLICT (title, source) DO NOTHING;