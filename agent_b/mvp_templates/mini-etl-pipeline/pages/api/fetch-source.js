export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiUrl = process.env.DUMMYJSON_API_URL || 'https://dummyjson.com/products?limit=100';
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const products = Array.isArray(data.products) ? data.products : [];

    return res.status(200).json({
      success: true,
      data: products,
      message: `Fetched ${products.length} products from DummyJSON`,
      preview: products.slice(0, 3),
      metadata: {
        source: apiUrl,
        total: products.length,
        fetchedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[fetch-source] Error:', error);
    
    // Return fallback data
    try {
      const fallback = require('../../../src/mock-data/fallback-products.json');
      return res.status(200).json({
        success: true,
        data: fallback.products || [],
        message: `Using fallback data (${error.message})`,
        preview: (fallback.products || []).slice(0, 3),
        metadata: {
          source: 'fallback',
          total: (fallback.products || []).length,
          fetchedAt: new Date().toISOString(),
          error: error.message
        }
      });
    } catch (fallbackError) {
      return res.status(500).json({
        success: false,
        error: `Failed to fetch data and fallback unavailable: ${error.message}`,
        data: []
      });
    }
  }
}

