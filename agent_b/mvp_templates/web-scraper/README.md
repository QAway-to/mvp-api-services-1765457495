# Web Scraper MVP

Universal web scraper template based on final_scraper architecture.

## Features

- 🌐 Scrape single pages or entire seasons/collections
- 📊 View scraped data in interactive table
- 📥 Export data to CSV
- 🔄 Real-time scraping with progress tracking
- 🎯 Simple, clean UI

## Structure

- `src/lib/scraper_core.js` - Core scraping logic (based on final_scraper)
- `pages/api/scrape.js` - API endpoint for scraping
- `components/` - React components for UI
- `pages/index.js` - Main dashboard page

## Usage

1. Enter target URL
2. Select scrape type (match/page or season/collection)
3. Click "Start Scraping"
4. View results and export to CSV

## Based on

- final_scraper architecture
- AFLTables scraper structure
- Universal design for any web scraping task

