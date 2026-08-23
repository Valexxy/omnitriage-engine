import type { VercelRequest, VercelResponse } from '@vercel/node';
import { WHOGHOService } from '../src/api/who-gho-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const region = (req.query.region as string) || 'AFRO';
  const data = await WHOGHOService.getRegionalMortalityBaseline(region);
  return res.status(200).json(data);
}
