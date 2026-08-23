import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OmniTriageController, ComprehensivePatientInput } from '../src/core/omni-triage-controller';

const controller = new OmniTriageController(30);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'POST') {
    try {
      const input: ComprehensivePatientInput = req.body;
      const report = controller.runFullTriage(input);
      return res.status(200).json(report);
    } catch (err: any) {
      return res.status(400).json({ error: 'Invalid patient input payload', details: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
