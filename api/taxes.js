import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let taxes = null;
try {
  taxes = JSON.parse(readFileSync(join(__dirname, '../data/taxes.json'), 'utf8'));
} catch(e) {
  console.error('Failed to load taxes.json:', e);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!taxes) {
    return res.status(500).json({ error: 'Tax data unavailable' });
  }

  res.setHeader('Cache-Control', 'public, max-age=86400');
  return res.status(200).json(taxes);
}
