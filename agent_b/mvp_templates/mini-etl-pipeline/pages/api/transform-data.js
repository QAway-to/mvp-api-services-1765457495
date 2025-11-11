export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, config = {} } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Data must be an array' });
    }

    let transformed = [...data];

    // Apply filters
    if (config.filters) {
      Object.entries(config.filters).forEach(([field, value]) => {
        if (value !== '' && value != null) {
          transformed = transformed.filter(item => {
            const itemValue = getNestedValue(item, field);
            return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
          });
        }
      });
    }

    // Apply sorting
    if (config.sortBy) {
      const direction = config.sortDirection || 'asc';
      transformed.sort((a, b) => {
        const aVal = getNestedValue(a, config.sortBy);
        const bVal = getNestedValue(b, config.sortBy);
        if (aVal === bVal) return 0;
        const comparison = aVal > bVal ? 1 : -1;
        return direction === 'asc' ? comparison : -comparison;
      });
    }

    // Apply field selection
    if (config.fields && Array.isArray(config.fields)) {
      transformed = transformed.map(item => {
        const selected = {};
        config.fields.forEach(field => {
          selected[field] = getNestedValue(item, field);
        });
        return selected;
      });
    }

    // Remove duplicates if specified
    if (config.deduplicate) {
      const seen = new Set();
      transformed = transformed.filter(item => {
        const key = config.deduplicateKey 
          ? getNestedValue(item, config.deduplicateKey)
          : JSON.stringify(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return res.status(200).json({
      success: true,
      data: transformed,
      message: `Transformed ${data.length} records to ${transformed.length} records`,
      preview: transformed.slice(0, 3),
      metadata: {
        inputCount: data.length,
        outputCount: transformed.length,
        removedCount: data.length - transformed.length
      }
    });
  } catch (error) {
    console.error('[transform-data] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
}

function getNestedValue(obj, path) {
  if (!obj || !path) return null;
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value == null) return null;
    value = value[key];
  }
  return value;
}

