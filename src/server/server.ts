/**
 * OmniTriage Server & FHIR Sync Gateway
 * Express + TypeScript REST API providing clinical triage calculation,
 * HL7 FHIR v4 synchronization, and Live OpenAQ / OpenFDA caching.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { OmniTriageController, ComprehensivePatientInput } from '../core/omni-triage-controller';
import { OpenAQService } from '../api/openaq-service';
import { OpenFDAService } from '../api/openfda-service';
import { WHOGHOService } from '../api/who-gho-service';

const PORT = process.env.PORT || 3000;
const controller = new OmniTriageController(30);

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  // 1. API: Multi-Biomarker Triage Endpoint
  if (req.method === 'POST' && url.pathname === '/api/triage') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const input: ComprehensivePatientInput = JSON.parse(body);
        const report = controller.runFullTriage(input);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(report));
      } catch (err: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid patient input payload', details: err.message }));
      }
    });
    return;
  }

  // 2. API: Live Environmental Air Quality (OpenAQ)
  if (req.method === 'GET' && url.pathname === '/api/environment') {
    const city = url.searchParams.get('city') || 'Global';
    const data = await OpenAQService.getAirQuality(city);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  // 3. API: Medication Safety Check (OpenFDA)
  if (req.method === 'GET' && url.pathname === '/api/medication-check') {
    const drug = url.searchParams.get('drug') || '';
    const alert = OpenFDAService.checkMedication(drug);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(alert));
    return;
  }

  // 4. API: Regional Disease Baselines (WHO GHO)
  if (req.method === 'GET' && url.pathname === '/api/who-baseline') {
    const region = url.searchParams.get('region') || 'AFRO';
    const baseline = WHOGHOService.getRegionalMortalityBaseline(region);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(baseline));
    return;
  }

  // 5. Static File Server for Dashboard
  let filePath = path.join(__dirname, '../../dashboard', url.pathname === '/' ? 'index.html' : url.pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    if (ext === '.css') contentType = 'text/css';
    if (ext === '.js') contentType = 'application/javascript';
    if (ext === '.json') contentType = 'application/json';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint or file not found' }));
});

server.listen(PORT, () => {
  console.log(`[OmniTriage Engine] Production Server & Dashboard running at http://localhost:${PORT}`);
});
