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

const controller = new OmniTriageController(30);

export function createOmniTriageServer() {
  return http.createServer(async (req, res) => {
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

    // 5. Static File Server for Dashboard / PWA
    const relFile = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '');
    const possiblePaths = [
      path.resolve(process.cwd(), 'dashboard', relFile),
      path.resolve(__dirname, '../../../dashboard', relFile),
      path.resolve(__dirname, '../../dashboard', relFile)
    ];

    let filePath = possiblePaths.find(p => fs.existsSync(p) && fs.statSync(p).isFile());

    if (filePath) {
      const ext = path.extname(filePath);
      let contentType = 'text/html';
      if (ext === '.css') contentType = 'text/css';
      if (ext === '.js') contentType = 'application/javascript';
      if (ext === '.json') contentType = 'application/json';
      if (ext === '.svg') contentType = 'image/svg+xml';

      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint or file not found', requested: url.pathname }));
  });
}

const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

function tryListen(port: number) {
  const srv = createOmniTriageServer();
  srv.listen(port, () => {
    console.log(`[OmniTriage Engine] Server & App running at: http://localhost:${port}`);
  });
  srv.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      tryListen(port + 1);
    } else {
      console.error(err);
    }
  });
}

tryListen(DEFAULT_PORT);
