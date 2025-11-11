// Extract step: Fetch data from DummyJSON API
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sourceUrl, limit } = req.body;
    const url = sourceUrl || 'https://dummyjson.com/products?limit=100';
    const apiUrl = limit ? `${url.split('?')[0]}?limit=${limit}` : url;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const products = Array.isArray(json.products) ? json.products : [];

    return res.status(200).json({
      success: true,
      data: products,
      rowsProcessed: products.length,
      sourceUrl: apiUrl,
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

