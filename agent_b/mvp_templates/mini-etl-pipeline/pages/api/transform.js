import { transformProducts } from '../../../src/lib/dummyjson';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid products array' });
    }

    const transformed = transformProducts(products);
    
    return res.status(200).json({ 
      success: true,
      products: transformed,
      count: transformed.length,
      originalCount: products.length,
      removed: products.length - transformed.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Transform error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to transform products'
    });
  }
}

