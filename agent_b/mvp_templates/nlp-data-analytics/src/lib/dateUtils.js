/**
 * Утилиты для работы с датами
 */

/**
 * Парсинг различных форматов дат
 */
export function parseDate(dateString) {
  if (!dateString) return null;
  
  // Попытка распарсить как ISO дату
  let date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Попытка распарсить форматы типа "YYYY-MM", "YYYY/MM/DD", "DD.MM.YYYY"
  const formats = [
    { regex: /^(\d{4})-(\d{2})-(\d{2})$/, handler: (m) => new Date(m[1], m[2] - 1, m[3]) }, // YYYY-MM-DD
    { regex: /^(\d{4})\/(\d{2})\/(\d{2})$/, handler: (m) => new Date(m[1], m[2] - 1, m[3]) }, // YYYY/MM/DD
    { regex: /^(\d{2})\.(\d{2})\.(\d{4})$/, handler: (m) => new Date(m[3], m[2] - 1, m[1]) }, // DD.MM.YYYY
    { regex: /^(\d{4})-(\d{2})$/, handler: (m) => new Date(m[1], m[2] - 1, 1) }, // YYYY-MM
    { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, handler: (m) => new Date(m[3], m[1] - 1, m[2]) }, // MM/DD/YYYY
  ];

  for (const format of formats) {
    const match = dateString.match(format.regex);
    if (match) {
      date = format.handler(match);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}

/**
 * Группировка данных по периодам
 */
export function groupByPeriod(data, dateColumn, period = 'day') {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {};
  }

  const groups = {};

  data.forEach((row, idx) => {
    const dateValue = row[dateColumn];
    if (!dateValue) return;

    const date = parseDate(dateValue);
    if (!date) return;

    let key;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (period) {
      case 'year':
        key = `${year}`;
        break;
      case 'month':
        key = `${year}-${month}`;
        break;
      case 'week':
        const week = getWeekNumber(date);
        key = `${year}-W${String(week).padStart(2, '0')}`;
        break;
      case 'day':
      default:
        key = `${year}-${month}-${day}`;
        break;
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(row);
  });

  return groups;
}

/**
 * Получить номер недели
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Обнаружение колонок с датами в данных
 */
export function detectDateColumns(data, columns) {
  const dateColumns = [];
  
  columns.forEach(col => {
    const sample = data.slice(0, 50).map(row => row[col]).filter(v => v != null && v !== '');
    if (sample.length === 0) return;

    const dateCount = sample.filter(v => {
      const parsed = parseDate(v);
      return parsed !== null;
    }).length;

    // Если больше 70% значений - это даты
    if (dateCount / sample.length > 0.7) {
      dateColumns.push(col);
    }
  });

  return dateColumns;
}

