// HTML Parsers - Based on AFL Scraper parsers
// Extracts structured data from HTML tables

/**
 * Parse match statistics from HTML
 * Extracts player-level statistics from "Match Statistics" tables
 * Returns array of objects suitable for CSV export
 */
export async function parseMatchClean(html, url) {
  const cheerio = await import('cheerio');
  // Handle both ESM and CommonJS exports - cheerio v1.0.0-rc.12 uses default export
  let cheerioModule;
  if (typeof cheerio === 'function') {
    cheerioModule = cheerio;
  } else if (cheerio.default && typeof cheerio.default === 'function') {
    cheerioModule = cheerio.default;
  } else if (cheerio.load) {
    cheerioModule = cheerio;
  } else {
    throw new Error('Cannot load cheerio module');
  }
  const $ = cheerioModule.load(html);
  const results = [];

  // Find all sortable tables
  $('table.sortable').each((i, table) => {
    const $table = $(table);
    
    // Find header cell with colspan (contains "Match Statistics")
    const headerCell = $table.find('thead th[colspan]').first();
    if (headerCell.length === 0) {
      return;
    }

    const headerText = headerCell.text().trim();
    if (!headerText.includes('Match Statistics')) {
      return;
    }

    // Extract team name (text before "Match Statistics")
    const teamName = headerText.split('Match Statistics')[0].trim();

    // Get column headers (second <tr> in <thead>)
    const headerRows = $table.find('thead tr');
    if (headerRows.length < 2) {
      return;
    }

    const columns = [];
    headerRows.eq(1).find('th').each((i, th) => {
      columns.push($(th).text().trim());
    });

    // Extract body rows
    $table.find('tbody tr').each((i, row) => {
      const $row = $(row);
      const text = $row.text();
      
      // Skip totals and opposition rows
      if (text.includes('Totals') || text.includes('Opposition')) {
        return;
      }

      const cells = [];
      $row.find('td').each((i, td) => {
        let cellText = $(td).text().trim().replace(/\u00A0/g, ''); // Remove non-breaking spaces
        // Clean player number (first cell)
        if (i === 0) {
          cellText = cellText.replace(/[^\d]/g, '');
        }
        cells.push(cellText);
      });

      if (cells.length === columns.length) {
        const entry = {};
        columns.forEach((col, idx) => {
          entry[col] = cells[idx];
        });
        entry['Team'] = teamName;
        entry['SourceURL'] = url;
        results.push(entry);
      }
    });
  });

  // Convert numeric columns
  if (results.length > 0) {
    const numericColumns = Object.keys(results[0]).filter(
      col => !['#', 'Player', 'Team', 'SourceURL'].includes(col)
    );

    results.forEach(row => {
      numericColumns.forEach(col => {
        const value = row[col];
        if (value !== undefined && value !== '') {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            row[col] = num;
          }
        }
      });
    });
  }

  return results;
}

/**
 * Parse player details from HTML
 * Extracts "Player Details" tables (age, career stats, etc.)
 */
export async function parsePlayerDetails(html, url) {
  const cheerio = await import('cheerio');
  // Handle both ESM and CommonJS exports - cheerio v1.0.0-rc.12 uses default export
  let cheerioModule;
  if (typeof cheerio === 'function') {
    cheerioModule = cheerio;
  } else if (cheerio.default && typeof cheerio.default === 'function') {
    cheerioModule = cheerio.default;
  } else if (cheerio.load) {
    cheerioModule = cheerio;
  } else {
    throw new Error('Cannot load cheerio module');
  }
  const $ = cheerioModule.load(html);
  const results = [];

  $('table.sortable').each((i, table) => {
    const $table = $(table);
    
    const headerCell = $table.find('thead th[colspan]').first();
    if (headerCell.length === 0) {
      return;
    }

    const headerText = headerCell.text().trim();
    if (!headerText.includes('Player Details')) {
      return;
    }

    const teamName = headerText.split('Player Details')[0].trim();
    const headerRows = $table.find('thead tr');
    if (headerRows.length < 2) {
      return;
    }

    const columns = [];
    headerRows.eq(1).find('th').each((i, th) => {
      columns.push($(th).text().trim());
    });

    const rows = [];
    $table.find('tbody tr').each((i, row) => {
      const $row = $(row);
      const text = $row.text();
      
      if (text.includes('Totals') || text.includes('Coach')) {
        return;
      }

      const cells = [];
      $row.find('td').each((i, td) => {
        let cellText = $(td).text().trim().replace(/\u00A0/g, '');
        if (i === 0) {
          cellText = cellText.replace(/[^\d]/g, '');
        }
        cells.push(cellText);
      });

      if (cells.length === columns.length) {
        const entry = {};
        columns.forEach((col, idx) => {
          entry[col] = cells[idx];
        });
        entry['Team'] = teamName;
        entry['SourceURL'] = url;
        rows.push(entry);
      }
    });

    results.push(...rows);
  });

  // Convert numeric columns
  if (results.length > 0) {
    const numericColumns = Object.keys(results[0]).filter(
      col => !['#', 'Player', 'Team', 'SourceURL'].includes(col)
    );

    results.forEach(row => {
      numericColumns.forEach(col => {
        const value = row[col];
        if (value !== undefined && value !== '') {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            row[col] = num;
          }
        }
      });
    });
  }

  return results;
}

