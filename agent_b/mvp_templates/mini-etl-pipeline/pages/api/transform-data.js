// Transform step: Filter and aggregate data
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, filters, aggregations } = req.body;

    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    let transformed = [...data];

    // Apply filters
    if (filters && Array.isArray(filters)) {
      filters.forEach(filter => {
        if (filter.field && filter.operator && filter.value !== undefined) {
          transformed = transformed.filter(item => {
            const fieldValue = item[filter.field];
            switch (filter.operator) {
              case '>':
                return Number(fieldValue) > Number(filter.value);
              case '<':
                return Number(fieldValue) < Number(filter.value);
              case '===':
                return fieldValue === filter.value;
              case 'includes':
                return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
              default:
                return true;
            }
          });
        }
      });
    }

    // Apply aggregations
    if (aggregations && Array.isArray(aggregations)) {
      aggregations.forEach(agg => {
        if (agg.type === 'groupBy' && agg.field) {
          const grouped = {};
          transformed.forEach(item => {
            const key = item[agg.field] || 'unknown';
            if (!grouped[key]) {
              grouped[key] = [];
            }
            grouped[key].push(item);
          });
          transformed = Object.entries(grouped).map(([key, items]) => ({
            [agg.field]: key,
            count: items.length,
            items: items.slice(0, 10)
          }));
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: transformed,
      rowsProcessed: transformed.length,
      rowsIn: data.length,
      rowsOut: transformed.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

