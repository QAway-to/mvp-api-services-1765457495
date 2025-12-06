/**
 * Data processing utilities
 */

/**
 * Calculate comprehensive statistics for numeric columns
 */
export function calculateStatistics(data, column) {
  if (!data || data.length === 0) {
    return null;
  }

  const values = data
    .map(row => parseFloat(row[column]))
    .filter(val => !isNaN(val));

  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  
  // Median
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  // Standard deviation and variance
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Quartiles
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  // Percentiles
  const percentile = (arr, p) => {
    const index = Math.floor(arr.length * p);
    return arr[Math.min(index, arr.length - 1)];
  };

  // Mode (most frequent value)
  const frequency = {};
  values.forEach(v => {
    const rounded = Math.round(v * 100) / 100;
    frequency[rounded] = (frequency[rounded] || 0) + 1;
  });
  const mode = Object.entries(frequency).reduce((a, b) => 
    frequency[a[0]] > frequency[b[0]] ? a : b
  )[0];

  // Skewness (asymmetry)
  const skewness = n > 2 ? values.reduce((sum, val) => {
    return sum + Math.pow((val - mean) / stdDev, 3);
  }, 0) / n : 0;

  // Kurtosis (tailedness)
  const kurtosis = n > 3 ? values.reduce((sum, val) => {
    return sum + Math.pow((val - mean) / stdDev, 4);
  }, 0) / n - 3 : 0;

  return {
    column,
    count: n,
    mean: Math.round(mean * 1000) / 1000,
    median: Math.round(median * 1000) / 1000,
    mode: parseFloat(mode),
    min: Math.min(...values),
    max: Math.max(...values),
    sum: Math.round(sum * 1000) / 1000,
    stdDev: Math.round(stdDev * 1000) / 1000,
    variance: Math.round(variance * 1000) / 1000,
    q1: Math.round(q1 * 1000) / 1000,
    q3: Math.round(q3 * 1000) / 1000,
    iqr: Math.round(iqr * 1000) / 1000,
    p25: Math.round(percentile(sorted, 0.25) * 1000) / 1000,
    p75: Math.round(percentile(sorted, 0.75) * 1000) / 1000,
    p90: Math.round(percentile(sorted, 0.90) * 1000) / 1000,
    p95: Math.round(percentile(sorted, 0.95) * 1000) / 1000,
    p99: Math.round(percentile(sorted, 0.99) * 1000) / 1000,
    skewness: Math.round(skewness * 1000) / 1000,
    kurtosis: Math.round(kurtosis * 1000) / 1000
  };
}

/**
 * Find anomalies in numeric columns (values outside 2 standard deviations)
 */
export function findAnomalies(data, column) {
  if (!data || data.length === 0) {
    return [];
  }

  const values = data
    .map((row, idx) => ({ value: parseFloat(row[column]), index: idx }))
    .filter(item => !isNaN(item.value));

  if (values.length < 3) {
    return [];
  }

  const numbers = values.map(v => v.value);
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const variance = numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numbers.length;
  const stdDev = Math.sqrt(variance);

  const threshold = 2 * stdDev;
  const anomalies = values.filter(item => 
    Math.abs(item.value - mean) > threshold
  );

  return anomalies.map(anomaly => ({
    index: anomaly.index,
    value: anomaly.value,
    deviation: Math.round((anomaly.value - mean) / stdDev * 100) / 100
  }));
}

/**
 * Count missing values
 */
export function countMissingValues(data, columns) {
  const missing = {};
  columns.forEach(col => {
    const missingCount = data.filter(row => 
      row[col] === null || row[col] === undefined || row[col] === '' || row[col] === 'N/A'
    ).length;
    missing[col] = {
      count: missingCount,
      percentage: Math.round((missingCount / data.length) * 100 * 100) / 100
    };
  });
  return missing;
}

/**
 * Filter data based on conditions
 */
export function filterData(data, filters) {
  return data.filter(row => {
    return filters.every(filter => {
      const value = row[filter.column];
      const filterValue = filter.value;

      switch (filter.operator) {
        case 'equals':
          return String(value) === String(filterValue);
        case 'contains':
          return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
        case 'greater':
          return parseFloat(value) > parseFloat(filterValue);
        case 'less':
          return parseFloat(value) < parseFloat(filterValue);
        default:
          return true;
      }
    });
  });
}

/**
 * Group data by column
 */
export function groupBy(data, column) {
  const groups = {};
  data.forEach(row => {
    const key = String(row[column] || 'null');
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(row);
  });
  return groups;
}

/**
 * Aggregate grouped data
 */
export function aggregateGroups(groups, aggregateColumn, operation = 'sum') {
  const result = [];
  Object.entries(groups).forEach(([key, rows]) => {
    const values = rows.map(r => parseFloat(r[aggregateColumn])).filter(v => !isNaN(v));
    let aggregated;

    switch (operation) {
      case 'sum':
        aggregated = values.reduce((a, b) => a + b, 0);
        break;
      case 'avg':
      case 'mean':
        aggregated = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'count':
        aggregated = values.length;
        break;
      case 'min':
        aggregated = Math.min(...values);
        break;
      case 'max':
        aggregated = Math.max(...values);
        break;
      default:
        aggregated = values.length;
    }

    result.push({
      group: key,
      value: Math.round(aggregated * 100) / 100,
      count: rows.length
    });
  });

  return result;
}

/**
 * Detect data types for columns
 */
export function detectColumnTypes(data, columns) {
  const types = {};
  columns.forEach(col => {
    const sample = data.slice(0, 100).map(row => row[col]).filter(v => v != null && v !== '');
    
    if (sample.length === 0) {
      types[col] = 'unknown';
      return;
    }

    const isNumeric = sample.every(v => !isNaN(parseFloat(v)) && isFinite(v));
    const isDate = sample.some(v => !isNaN(Date.parse(v)));
    const isBoolean = sample.every(v => ['true', 'false', '1', '0', 'yes', 'no'].includes(String(v).toLowerCase()));

    if (isNumeric) {
      types[col] = 'number';
    } else if (isDate) {
      types[col] = 'date';
    } else if (isBoolean) {
      types[col] = 'boolean';
    } else {
      types[col] = 'string';
    }
  });

  return types;
}

/**
 * Calculate correlation matrix for numeric columns
 */
export function calculateCorrelations(data, numericColumns) {
  if (!data || data.length === 0 || !numericColumns || numericColumns.length < 2) {
    return null;
  }

  const matrix = {};
  
  // Initialize matrix
  numericColumns.forEach(col1 => {
    matrix[col1] = {};
    numericColumns.forEach(col2 => {
      matrix[col1][col2] = 0;
    });
  });

  // Calculate correlations
  numericColumns.forEach(col1 => {
    numericColumns.forEach(col2 => {
      if (col1 === col2) {
        matrix[col1][col2] = 1.0;
      } else {
        const values1 = data.map(row => parseFloat(row[col1])).filter(v => !isNaN(v));
        const values2 = data.map(row => parseFloat(row[col2])).filter(v => !isNaN(v));
        
        // Align values by index
        const pairs = [];
        for (let i = 0; i < data.length; i++) {
          const v1 = parseFloat(data[i][col1]);
          const v2 = parseFloat(data[i][col2]);
          if (!isNaN(v1) && !isNaN(v2)) {
            pairs.push({ x: v1, y: v2 });
          }
        }

        if (pairs.length < 2) {
          matrix[col1][col2] = 0;
        } else {
          matrix[col1][col2] = calculatePearsonCorrelation(pairs);
        }
      }
    });
  });

  return {
    matrix,
    columns: numericColumns
  };
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculatePearsonCorrelation(pairs) {
  const n = pairs.length;
  if (n < 2) return 0;

  const sumX = pairs.reduce((sum, p) => sum + p.x, 0);
  const sumY = pairs.reduce((sum, p) => sum + p.y, 0);
  const sumXY = pairs.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = pairs.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumY2 = pairs.reduce((sum, p) => sum + p.y * p.y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;

  const correlation = numerator / denominator;
  return Math.round(correlation * 1000) / 1000; // Round to 3 decimal places
}

/**
 * Advanced filter data with multiple conditions
 */
export function advancedFilterData(data, filterConditions) {
  if (!data || !filterConditions || filterConditions.length === 0) {
    return data;
  }

  return data.filter(row => {
    // Support AND/OR logic
    return filterConditions.every(condition => {
      const { column, operator, value, logic = 'AND' } = condition;
      const cellValue = row[column];

      if (cellValue === null || cellValue === undefined) {
        return operator === 'isNull' || operator === 'isEmpty';
      }

      switch (operator) {
        case 'equals':
          return String(cellValue).toLowerCase() === String(value).toLowerCase();
        case 'notEquals':
          return String(cellValue).toLowerCase() !== String(value).toLowerCase();
        case 'contains':
          return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
        case 'notContains':
          return !String(cellValue).toLowerCase().includes(String(value).toLowerCase());
        case 'startsWith':
          return String(cellValue).toLowerCase().startsWith(String(value).toLowerCase());
        case 'endsWith':
          return String(cellValue).toLowerCase().endsWith(String(value).toLowerCase());
        case 'greater':
          return parseFloat(cellValue) > parseFloat(value);
        case 'greaterOrEqual':
          return parseFloat(cellValue) >= parseFloat(value);
        case 'less':
          return parseFloat(cellValue) < parseFloat(value);
        case 'lessOrEqual':
          return parseFloat(cellValue) <= parseFloat(value);
        case 'between':
          const [min, max] = Array.isArray(value) ? value : [value, value];
          const numValue = parseFloat(cellValue);
          return numValue >= parseFloat(min) && numValue <= parseFloat(max);
        case 'in':
          const values = Array.isArray(value) ? value : [value];
          return values.some(v => String(cellValue).toLowerCase() === String(v).toLowerCase());
        case 'isNull':
          return cellValue === null || cellValue === undefined || cellValue === '';
        case 'isEmpty':
          return cellValue === null || cellValue === undefined || cellValue === '';
        default:
          return true;
      }
    });
  });
}

