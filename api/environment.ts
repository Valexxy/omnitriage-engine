import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAQService } from '../src/api/openaq-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const city = (req.query.city as string) || 'Global';
  const data = await OpenAQService.getAirQuality(city);
  return res.status(200).json(data);
}
