// ─── UI.JS — all DOM rendering ───────────────────────────────────────────────
import { fmt, calcDiff, calcEquivalentSalary } from ‘./calculator.js’;

/**

- Render the full results section.
  */
  export function renderResults({
  fromCity, toCity,
  fromPrices, toPrices,
  fromBudget, toBudget,
  income,
  fromQoL, toQoL,
  }) {
  const diff = calcDiff(fromBudget, toBudget);
  const equivSalary = calcEquivalentSalary(income, fromBudget, toBudget);

const fromName = fromCity.city_name;
const toName = toCity.city_name;
const fromCountry = fromCity.country_name;
const toCountry = toCity.country_name;

// Determine currency for display
const toCurrency = toPrices?.currency || ‘USD’;

let verdictClass, verdictText;
if (diff.isSimilar) {
verdictClass = ‘verdict-similar’;
verdictText = ‘Similar cost of living’;
} else if (diff.isMoreExpensive) {
verdictClass = ‘verdict-pricier’;
verdictText = `${diff.pct}% more expensive`;
} else {
verdictClass = ‘verdict-cheaper’;
verdictText = `${Math.abs(diff.pct)}% cheaper`;
}

const categories = [
{ label: ‘Housing’, icon: ‘🏠’, from: fromBudget.housing, to: toBudget.housing },
{ label: ‘Food & Dining’, icon: ‘🛒’, from: fromBudget.food, to: toBudget.food },
{ label: ‘Transportation’, icon: ‘🚗’, from: fromBudget.transport, to: toBudget.transport },
{ label: ‘Utilities’, icon: ‘⚡’, from: fromBudget.utilities, to: toBudget.utilities },
{ label: ‘Misc & Personal’, icon: ‘🛍️’, from: fromBudget.misc, to: toBudget.misc },
];

const salaryInsight = buildSalaryInsight({
fromName, toName, fromCountry, toCountry,
fromBudget, toBudget, diff,
income, equivSalary,
toAvgSalary: toPrices?.avg_net_salary,
toCurrency,
});

const qolSection = buildQoLSection(toName, toQoL);

const detailRows = buildDetailRows(fromPrices, toPrices);

const html = `
<div class="results-header">
<div class="results-title">${fromName} → ${toName}</div>
<div class="verdict-badge ${verdictClass}">${verdictText}</div>
</div>

```
<div class="cost-headline">
  <div class="cost-city">
    <div class="cost-city-name">${fromName}</div>
    <div class="cost-city-country">${fromCountry}</div>
    <div class="cost-amount from">${fmt(fromBudget.total)}</div>
    <div class="cost-sub">estimated / month</div>
  </div>
  <div class="cost-arrow-col">
    <div class="cost-arrow">→</div>
    <div class="diff-label" style="color:${diff.isSimilar ? 'var(--yellow)' : diff.isMoreExpensive ? 'var(--red)' : 'var(--accent)'}">
      ${diff.isMoreExpensive ? '+' : ''}${fmt(diff.diff)}/mo
    </div>
  </div>
  <div class="cost-city">
    <div class="cost-city-name">${toName}</div>
    <div class="cost-city-country">${toCountry}</div>
    <div class="cost-amount to">${fmt(toBudget.total)}</div>
    <div class="cost-sub">estimated / month</div>
  </div>
</div>

<div class="breakdown-grid">
  <div class="breakdown-card">
    <div class="breakdown-label"><span class="icon">📊</span> Monthly breakdown</div>
    <div class="breakdown-header-row">
      <span></span>
      <div class="breakdown-cols">
        <span class="col-header">${fromName.split(' ')[0]}</span>
        <span class="col-header">${toName.split(' ')[0]}</span>
      </div>
    </div>
    ${categories.map(c => {
      const d = c.to - c.from;
      const cls = Math.abs(d) < c.from * 0.05 ? '' : d > 0 ? 'up' : 'down';
      const arrow = Math.abs(d) < c.from * 0.05 ? '' : d > 0 ? '↑' : '↓';
      return `<div class="breakdown-row">
        <span class="item">${c.icon} ${c.label}</span>
        <div class="values">
          <span class="from-val">${fmt(c.from)}</span>
          <span class="to-val ${cls}">${arrow}${fmt(c.to)}</span>
        </div>
      </div>`;
    }).join('')}
    <div class="breakdown-row total-row">
      <span class="item">Total</span>
      <div class="values">
        <span class="from-val">${fmt(fromBudget.total)}</span>
        <span class="to-val" style="color:var(--text); font-weight:600">${fmt(toBudget.total)}</span>
      </div>
    </div>
  </div>

  <div class="breakdown-card">
    <div class="breakdown-label"><span class="icon">🔍</span> Real price samples</div>
    ${detailRows}
  </div>
</div>

${salaryInsight}

${qolSection}

<div class="share-row">
  <button class="share-btn" onclick="copyResult('${fromName}','${toName}',${fromBudget.total},${toBudget.total},${diff.pct})">
    📋 Copy results
  </button>
  <a class="share-btn" href="https://www.glassdoor.com/Salaries/index.htm" target="_blank" rel="noopener">
    💼 Check salaries on Glassdoor ↗
  </a>
  <button class="share-btn" onclick="window.scrollTo({top:0,behavior:'smooth'})">
    ↩ New comparison
  </button>
</div>
```

`;

const el = document.getElementById(‘results’);
el.innerHTML = html;
el.style.display = ‘block’;
el.scrollIntoView({ behavior: ‘smooth’, block: ‘start’ });
}

function buildSalaryInsight({ fromName, toName, fromCountry, toCountry, fromBudget, toBudget, diff, income, equivSalary, toAvgSalary, toCurrency }) {
const annualEquiv = fmt(equivSalary);
const monthlyEquiv = fmt(Math.round(equivSalary / 12));

let avgSalaryNote = ‘’;
if (toAvgSalary) {
const annualAvg = fmt(toAvgSalary * 12, toCurrency);
avgSalaryNote = `The average net salary in <strong>${toName}</strong> is about <strong>${annualAvg}/yr</strong> (${fmt(toAvgSalary, toCurrency)}/mo).`;
}

const mainText = diff.isMoreExpensive
? `To maintain your current lifestyle in <strong>${toName}</strong>, you'd need to earn at least <strong>${annualEquiv}/yr</strong> (${monthlyEquiv}/mo). ${avgSalaryNote}`
: diff.isSimilar
? `Your cost of living would be roughly the same in <strong>${toName}</strong>. Your current salary of <strong>${fmt(income)}/yr</strong> should cover a similar lifestyle. ${avgSalaryNote}`
: `Good news — <strong>${toName}</strong> is cheaper. You'd only need <strong>${annualEquiv}/yr</strong> to maintain your current lifestyle, potentially freeing up <strong>${fmt(income - equivSalary)}/yr</strong>. ${avgSalaryNote}`;

return `<div class="salary-insight"> <div class="insight-icon">💼</div> <div class="insight-body"> <div class="insight-title">Salary reality check</div> <div class="insight-text">${mainText}</div> <a class="insight-link" href="https://www.glassdoor.com/Salaries/index.htm" target="_blank" rel="noopener"> See salaries by job title on Glassdoor ↗ </a> </div> </div>`;
}

function buildQoLSection(cityName, qol) {
if (!qol || !Object.keys(qol).length) return ‘’;

const scoreMap = {
‘Housing’: { icon: ‘🏠’ },
‘Cost of Living’: { icon: ‘💰’ },
‘Commute’: { icon: ‘🚇’ },
‘Business Freedom’: { icon: ‘💼’ },
‘Safety’: { icon: ‘🛡️’ },
‘Healthcare’: { icon: ‘🏥’ },
‘Education’: { icon: ‘🎓’ },
‘Environmental Quality’: { icon: ‘🌿’ },
‘Economy’: { icon: ‘📈’ },
‘Taxation’: { icon: ‘🧾’ },
‘Internet Access’: { icon: ‘📡’ },
‘Leisure & Culture’: { icon: ‘🎭’ },
‘Tolerance’: { icon: ‘🤝’ },
‘Outdoors’: { icon: ‘🌲’ },
};

const pills = Object.entries(qol)
.filter(([, score]) => score != null)
.slice(0, 10)
.map(([name, score]) => {
const cls = score >= 70 ? ‘dot-green’ : score >= 45 ? ‘dot-yellow’ : ‘dot-red’;
const icon = scoreMap[name]?.icon || ‘✦’;
return `<div class="qol-pill"> <span class="dot ${cls}"></span> ${icon} ${name}: ${score}/100 </div>`;
}).join(’’);

if (!pills) return ‘’;

return `<div class="breakdown-label" style="margin-bottom:10px"> <span class="icon">✦</span>&nbsp; Quality of life in ${cityName} </div> <div class="qol-row">${pills}</div>`;
}

function buildDetailRows(fromPrices, toPrices) {
if (!fromPrices || !toPrices) return ‘<p style="color:var(--text3); font-size:13px">Price details unavailable.</p>’;

const items = [
{ label: ‘🍽️ Cheap meal’, from: fromPrices.meal_cheap, to: toPrices.meal_cheap },
{ label: ‘🥛 Milk (1L)’, from: fromPrices.groceries_milk, to: toPrices.groceries_milk },
{ label: ‘🍞 Bread (500g)’, from: fromPrices.groceries_bread, to: toPrices.groceries_bread },
{ label: ‘🥚 Eggs (12)’, from: fromPrices.groceries_eggs, to: toPrices.groceries_eggs },
{ label: ‘🚌 Transit ticket’, from: fromPrices.transit_ticket, to: toPrices.transit_ticket },
{ label: ‘🚌 Monthly pass’, from: fromPrices.transit_monthly, to: toPrices.transit_monthly },
{ label: ‘⛽ Gas (1L)’, from: fromPrices.gas_per_liter, to: toPrices.gas_per_liter },
{ label: ‘🌐 Internet/mo’, from: fromPrices.internet, to: toPrices.internet },
].filter(i => i.from != null && i.to != null);

if (!items.length) return ‘<p style="color:var(--text3); font-size:13px">Price details unavailable.</p>’;

return items.map(item => {
const d = item.to - item.from;
const cls = Math.abs(d) < item.from * 0.05 ? ‘’ : d > 0 ? ‘up’ : ‘down’;
return `<div class="breakdown-row"> <span class="item">${item.label}</span> <div class="values"> <span class="from-val">${fmt(item.from)}</span> <span class="to-val ${cls}">${fmt(item.to)}</span> </div> </div>`;
}).join(’’);
}

/**

- Show an error inside results area.
  */
  export function renderError(message) {
  const el = document.getElementById(‘results’);
  el.innerHTML = `
  
   <div class="error-card">
     <div class="error-icon">⚠️</div>
     <div class="error-title">Something went wrong</div>
     <div class="error-text">${message}</div>
   </div>

`;
el.style.display = ‘block’;
}

/**

- Copy result to clipboard.
  */
  window.copyResult = function(from, to, fromAmt, toAmt, pct) {
  const sign = pct > 0 ? ‘+’ : ‘’;
  const text = `Cost of living: ${from} → ${to}\nFrom: ${fmt(fromAmt)}/mo → To: ${fmt(toAmt)}/mo (${sign}${pct}%)\nCalculated at re-locate.app`;
  navigator.clipboard.writeText(text).then(() => {
  alert(‘Copied to clipboard!’);
  });
  };
