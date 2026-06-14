export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const apiKey = process.env.FOOTBALL_API_KEY || process.env.VITE_FOOTBALL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: 'Missing FOOTBALL_API_KEY' });
  }

  try {
    const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: {
        'X-Auth-Token': apiKey,
      },
    });

    const body = await response.text();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    return res.status(response.status).send(body);
  } catch (error) {
    return res.status(502).json({
      message: 'football-data.org request failed',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
