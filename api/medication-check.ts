import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenFDAService } from '../src/api/openfda-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const drug = (req.query.drug as string) || '';
  const alert = await OpenFDAService.checkMedication(drug);
  return res.status(200).json(alert);
}
