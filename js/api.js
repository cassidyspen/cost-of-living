// ─── API.JS — all external data fetching ─────────────────────────────────────

const BASE = '/api/compare';

// Cache to avoid repeat calls
const _cache = {};
function cached(key, fn) {
  if (_cache[key]) return Promise.resolve(_cache[key]);
  return fn().then(d => { _cache[key] = d; return d; });
}

// ─── TravelTables (via our serverless proxy) ──────────────────────────────────

export async function fetchAllCities() {
  return cached('all_cities', async () => {
    const res = await fetch(`${BASE}?type=cities`);
    if (!res.ok) throw new Error('Failed to load cities');
    const data = await res.json();
    return data.cities || [];
  });
}

export async function fetchCityPrices(cityName, countryName) {
  const key = `prices_${cityName}_${countryName}`;
  return cached(key, async () => {
    const res = await fetch(
      `${BASE}?type=prices&city_name=${encodeURIComponent(cityName)}&country_name=${encodeURIComponent(countryName)}`
    );
    if (!res.ok) throw new Error(`Failed to load prices for ${cityName}`);
    return res.json();
  });
}

// ─── Teleport — quality of life scores ───────────────────────────────────────

export async function fetchTeleportQoL(cityName) {
  return cached(`teleport_${cityName}`, async () => {
    try {
      // Step 1: find the city slug
      const searchRes = await fetch(
        `https://api.teleport.org/api/cities/?search=${encodeURIComponent(cityName)}&limit=1`
      );
      const searchData = await searchRes.json();
      const embedded = searchData?._embedded?.['city:search-results'];
      if (!embedded?.length) return null;

      const cityUrl = embedded[0]?._links?.['city:item']?.href;
      if (!cityUrl) return null;

      // Step 2: get urban area link
      const cityRes = await fetch(cityUrl);
      const cityData = await cityRes.json();
      const uaUrl = cityData?._links?.['city:urban_area']?.href;
      if (!uaUrl) return null;

      // Step 3: get scores
      const scoresRes = await fetch(`${uaUrl}scores/`);
      const scoresData = await scoresRes.json();
      const categories = scoresData?.categories || [];

      const scores = {};
      categories.forEach(c => {
        scores[c.name] = Math.round(c.score_out_of_10 * 10);
      });
      return scores;
    } catch {
      return null;
    }
  });
}

// ─── Parse TravelTables response into structured data ────────────────────────

export function parsePrices(data) {
  if (!data?.prices) return null;

  const get = (name) => {
    const item = data.prices.find(p =>
      p.item_name.toLowerCase().includes(name.toLowerCase())
    );
    return item ? item.avg : null;
  };

  const currency = data.prices[0]?.currency_code || 'USD';

  return {
    currency,
    city: data.city_name,
    country: data.country_name,

    // Housing
    rent1br_center: get('1 bedroom apartment in city centre') || get('1 bedroom') || null,
    rent1br_outside: get('1 bedroom apartment outside') || null,
    rent3br_center: get('3 bedrooms apartment in city centre') || get('3 bedroom') || null,
    rent3br_outside: get('3 bedrooms apartment outside') || null,

    // Food
    meal_cheap: get('inexpensive restaurant') || get('meal, inexpensive') || null,
    meal_midrange: get('mid-range restaurant') || get('meal for 2') || null,
    groceries_milk: get('milk') || null,
    groceries_bread: get('bread') || null,
    groceries_eggs: get('eggs') || null,
    groceries_chicken: get('chicken') || null,
    groceries_apples: get('apples') || null,

    // Transport
    transit_ticket: get('one-way ticket') || get('local transport') || null,
    transit_monthly: get('monthly pass') || null,
    taxi_start: get('taxi start') || null,
    taxi_per_km: get('taxi 1km') || null,
    gas_per_liter: get('gasoline') || get('gas') || null,

    // Utilities
    utilities_basic: get('basic (electricity') || get('utilities') || null,
    internet: get('internet') || null,
    mobile: get('mobile') || get('prepaid') || null,

    // Salary
    avg_net_salary: get('average monthly net salary') || get('net salary') || null,

    // Raw
    raw: data.prices,
  };
}
