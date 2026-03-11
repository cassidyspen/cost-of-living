export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type, city_name, country_name } = req.query;
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

  if (!RAPIDAPI_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const headers = {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': 'cost-of-living-and-prices.p.rapidapi.com'
  };

  try {
    if (type === 'cities') {
      const response = await fetch(
        'https://cost-of-living-and-prices.p.rapidapi.com/cities',
        { headers }
      );
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (type === 'prices') {
      if (!city_name || !country_name) {
        return res.status(400).json({ error: 'city_name and country_name required' });
      }
      const url = `https://cost-of-living-and-prices.p.rapidapi.com/prices?city_name=${encodeURIComponent(city_name)}&country_name=${encodeURIComponent(country_name)}`;
      const response = await fetch(url, { headers });
      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: 'Invalid type. Use "cities" or "prices"' });

  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
}
