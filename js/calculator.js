// ─── CALCULATOR.JS — budget math & PPP ───────────────────────────────────────

/**
 * Build a monthly budget estimate from real price data + user profile.
 */
export function buildMonthlyBudget(prices, profile) {
  const { household, lifestyle } = profile;

  const hhMult = { '1': 1, '2': 1.55, '3': 1.9, '4': 2.3 }[household] || 1;

  // ── HOUSING ────────────────────────────────────────────────────────────────
  let housing;
  if (lifestyle.owner) {
    const base = household === '1' || household === '2'
      ? (prices.rent1br_center || prices.rent1br_outside * 1.2 || 1500)
      : (prices.rent3br_outside || prices.rent3br_center * 0.85 || 2200);
    housing = Math.round(base * 1.2);
  } else {
    const base = household === '1'
      ? (prices.rent1br_outside || prices.rent1br_center * 0.85 || 1200)
      : household === '2'
      ? (prices.rent1br_center || 1600)
      : (prices.rent3br_outside || prices.rent3br_center * 0.85 || 2000);
    housing = Math.round(base);
  }

  // ── FOOD ───────────────────────────────────────────────────────────────────
  let food;
  if (lifestyle.dining) {
    const diningCost = (prices.meal_cheap || 12) * 20 * (hhMult * 0.7);
    const groceryCost = estimateGroceries(prices) * hhMult * 0.4;
    food = Math.round(diningCost + groceryCost);
  } else {
    const groceryCost = estimateGroceries(prices) * hhMult;
    const diningCost = (prices.meal_cheap || 12) * 4 * (hhMult * 0.5);
    food = Math.round(groceryCost + diningCost);
  }

  // ── TRANSPORT ──────────────────────────────────────────────────────────────
  let transport;
  if (lifestyle.car) {
    const gasMonthly = (prices.gas_per_liter || 1.2) * 60;
    const carFixed = 400;
    transport = Math.round(gasMonthly + carFixed);
  } else {
    const pass = prices.transit_monthly || (prices.transit_ticket || 2.5) * 40;
    transport = Math.round(pass + (prices.taxi_start || 3) * 4);
  }

  // ── UTILITIES ──────────────────────────────────────────────────────────────
  const utilities = Math.round(
    (prices.utilities_basic || 150) * (hhMult > 1.5 ? 1.2 : 1) +
    (prices.internet || 50) +
    (prices.mobile || 30) * Math.min(hhMult, 2)
  );

  // ── MISC & PERSONAL ────────────────────────────────────────────────────────
  const miscBase = 300;
  const costLevel = estimateCostLevel(prices);
  const misc = Math.round(miscBase * costLevel * (hhMult > 1 ? 1.3 : 1));

  const total = housing + food + transport + utilities + misc;

  return { housing, food, transport, utilities, misc, total };
}

function estimateGroceries(prices) {
  const basket = [
    (prices.groceries_milk || 1.5) * 8,
    (prices.groceries_bread || 2) * 4,
    (prices.groceries_eggs || 3) * 4,
    (prices.groceries_chicken || 8) * 3,
    (prices.groceries_apples || 2) * 3,
  ];
  return basket.reduce((a, b) => a + b, 0) * 4;
}

function estimateCostLevel(prices) {
  const signals = [
    prices.meal_cheap ? prices.meal_cheap / 12 : null,
    prices.transit_ticket ? prices.transit_ticket / 2.5 : null,
    prices.groceries_milk ? prices.groceries_milk / 1.5 : null,
  ].filter(Boolean);

  if (!signals.length) return 1;
  return signals.reduce((a, b) => a + b, 0) / signals.length;
}

/**
 * Calculate the equivalent salary needed in destination to maintain lifestyle.
 */
export function calcEquivalentSalary(currentIncome, fromBudget, toBudget) {
  const ratio = toBudget.total / fromBudget.total;
  return Math.round(currentIncome * ratio);
}

/**
 * Calculate percent difference between two cities.
 */
export function calcDiff(fromBudget, toBudget) {
  const diff = toBudget.total - fromBudget.total;
  const pct = Math.round((diff / fromBudget.total) * 100);
  return { diff, pct, isMoreExpensive: diff > 0, isSimilar: Math.abs(pct) < 8 };
}

/**
 * Format a number as currency.
 */
export function fmt(n, currency = 'USD') {
  if (n == null || isNaN(n)) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return '$' + Math.round(n).toLocaleString();
  }
}
