export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid products array' });
    }

    // Simulate loading (in production, this would save to database, export to file, etc.)
    const loaded = products.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category
    }));

    return res.status(200).json({ 
      success: true,
      result: loaded,
      count: loaded.length,
      message: `Successfully loaded ${loaded.length} products`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Load error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to load products'
    });
  }
}

