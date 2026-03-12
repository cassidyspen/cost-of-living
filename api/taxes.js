import { readFileSync } from 'fs';
import { join } from 'path';

const taxes = JSON.parse(readFileSync(join(process.cwd(), 'data/taxes.json'), 'utf8'));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json(taxes);
}
