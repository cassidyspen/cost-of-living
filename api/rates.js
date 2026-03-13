export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!r.ok) {
      console.error('Exchange rate API error:', r.status, await r.text());
      return res.status(502).json({ error: 'Exchange rate fetch failed', status: r.status });
    }
    const data = await r.json();
    if (!data.rates) {
      console.error('Exchange rate API unexpected shape:', JSON.stringify(data));
      return res.status(502).json({ error: 'Unexpected API response' });
    }
    return res.status(200).json(data.rates);
  } catch (err) {
    console.error('Exchange rate fetch exception:', err.message);
    return res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
}
