import { fetchProducts } from '../../../src/lib/dummyjson';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const products = await fetchProducts();
    return res.status(200).json({ 
      success: true,
      products,
      count: products.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Fetch error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch products'
    });
  }
}

