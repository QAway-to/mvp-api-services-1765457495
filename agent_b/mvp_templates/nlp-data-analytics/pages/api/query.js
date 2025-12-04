import { processNLQuery } from '../../src/lib/gemini.js';
import {
  calculateStatistics,
  findAnomalies,
  filterData,
  groupBy,
  aggregateGroups,
  detectColumnTypes
} from '../../src/lib/dataProcessor.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, data, columns } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Data is required' });
    }

    // Detect column types
    const columnTypes = detectColumnTypes(data, columns);
    const numericColumns = columns.filter(col => columnTypes[col] === 'number');

    // Get schema from sample data
    const sampleData = data.slice(0, 10);
    const schema = columns;

    // Process query through Gemini
    const geminiResponse = await processNLQuery(query, schema, sampleData);

    let result = {
      type: geminiResponse.type || 'text',
      message: geminiResponse.message || 'Запрос обработан',
      description: geminiResponse.description || '',
      table: null,
      chart: null,
      statistics: null
    };

    // Process based on Gemini response type
    if (geminiResponse.type === 'statistics') {
      // Calculate statistics for numeric columns
      const stats = {};
      numericColumns.forEach(col => {
        const stat = calculateStatistics(data, col);
        if (stat) {
          stats[col] = stat;
        }
      });

      result.statistics = stats;
      result.table = Object.entries(stats).map(([col, stat]) => ({
        column: col,
        mean: stat.mean,
        median: stat.median,
        min: stat.min,
        max: stat.max,
        count: stat.count
      }));

      // Create bar chart for means
      if (Object.keys(stats).length > 0) {
        result.chart = {
          type: 'bar',
          data: Object.entries(stats).map(([col, stat]) => ({
            name: col,
            value: stat.mean
          })),
          xKey: 'name',
          yKey: 'value'
        };
      }
    } else if (geminiResponse.type === 'visualization') {
      // Generate visualization
      const viz = geminiResponse.visualization || {};
      const chartType = viz.chartType || 'line';
      const xAxis = viz.xAxis || columns[0];
      const yAxis = viz.yAxis || numericColumns[0];

      if (chartType === 'line' || chartType === 'bar') {
        // Group by xAxis and aggregate yAxis
        const groups = groupBy(data, xAxis);
        const aggregated = aggregateGroups(groups, yAxis, 'mean');
        
        result.chart = {
          type: chartType,
          data: aggregated.map(item => ({
            [xAxis]: item.group,
            [yAxis]: item.value
          })),
          xKey: xAxis,
          yKey: yAxis
        };
      }
    } else if (geminiResponse.type === 'sql' || geminiResponse.sql) {
      // Simple SQL-like operations (not full SQL parser, but basic operations)
      // For MVP, we'll do basic filtering/grouping based on query intent
      const queryLower = query.toLowerCase();
      
      if (queryLower.includes('аномал') || queryLower.includes('аномаль')) {
        // Find anomalies
        const anomalies = {};
        numericColumns.forEach(col => {
          const anom = findAnomalies(data, col);
          if (anom.length > 0) {
            anomalies[col] = anom;
          }
        });

        result.table = Object.entries(anomalies).flatMap(([col, anom]) =>
          anom.map(a => ({
            column: col,
            row_index: a.index,
            value: a.value,
            deviation: a.deviation
          }))
        );
      } else {
        // Default: return sample of data
        result.table = data.slice(0, 50);
      }
    } else {
      // Text response - return sample data
      result.table = data.slice(0, 20);
    }

    // If no specific visualization but we have numeric data, create default chart
    if (!result.chart && numericColumns.length > 0) {
      const firstNumeric = numericColumns[0];
      const stats = calculateStatistics(data, firstNumeric);
      if (stats) {
        result.chart = {
          type: 'bar',
          data: [{ name: firstNumeric, value: stats.mean }],
          xKey: 'name',
          yKey: 'value'
        };
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Query processing error:', error);
    return res.status(500).json({
      error: 'Error processing query',
      message: error.message
    });
  }
}

