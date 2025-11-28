# Universal Web Scraper MVP

Universal web scraper based on AFL Scraper functionality. Extracts structured data from web pages and exports to CSV.

## Features

- **Single Page Scraping**: Extract data from individual pages
- **Season/Multi-page Scraping**: Scrape multiple pages from a season/index page
- **Round Filtering**: Optionally filter by round number for season scraping
- **CSV Export**: Export scraped data to CSV format
- **Data Table View**: View scraped data in a paginated table
- **Statistics**: View scraping statistics and metadata

## Technology Stack

- Next.js 14
- React 18
- Tailwind CSS
- Cheerio (HTML parsing)
- Server-side rendering for scraping operations

## Usage

1. Enter a target URL
2. Select scrape type (Match/Page or Season/Multiple Pages)
3. Optionally specify round number for season scraping
4. Click "Start Scraping"
5. View results and export to CSV

## API Endpoints

- `POST /api/scrape` - Scrape a URL
  - Body: `{ url: string, type: 'match' | 'season', roundNumber?: number }`
  - Returns: `{ success: boolean, data: array, metadata: object, count: number }`

