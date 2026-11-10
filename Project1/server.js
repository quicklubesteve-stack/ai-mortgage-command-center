/**
 * Mortgage Deal Filtration Agent - Node.js Server
 * Zero external dependencies (uses built-in http, fs, path, url)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Native .env file loader in modern Node.js (zero external dependencies)
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (err) {
    // .env file is optional if variables are injected by container or host
  }
}

const PORT = process.env.PORT || 3000;
const HUMAN_OFFICER = process.env.HUMAN_OFFICER_NAME || 'Steve';
const PUBLIC_DIR = path.join(__dirname, 'public');

// In-Memory storage for dossiers and underwriting audit trail
let underwriterQueue = [
  {
    id: "MORT-CAN-1048",
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    country: "Canada",
    province: "ON",
    city: "Toronto",
    currency: "CAD",
    borrowerName: "Jordan Campbell",
    documentType: "Driver's License & SIN",
    documentNumber: "DL-C8412-90124",
    creditScore: 745,
    creditBureau: "Equifax & TransUnion Canada",
    grossMonthlyIncome: 13500,
    grossMonthlyIncomeFormatted: "$13,500 CAD",
    monthlyDebts: 650,
    monthlyDebtsFormatted: "$650 CAD",
    purchasePrice: 780000,
    purchasePriceFormatted: "$780,000 CAD",
    downPayment: 78000,
    downPaymentFormatted: "$78,000 CAD (10%)",
    loanAmount: 723762,
    loanAmountFormatted: "$723,762 CAD (incl. CMHC)",
    isInsured: true,
    cmhcPremium: 21762,
    propertyType: "Condo Apartment",
    ltv: 90.0,
    gds: 31.4,
    tds: 36.2,
    stressTestRate: 6.69,
    termYears: 25,
    dealSelected: {
      id: "CAN-RBC-PRIME",
      lender: "RBC Royal Bank",
      product: "RBC 5-Year Fixed Prime",
      rate: 4.69,
      rateLabel: "4.69% 5-Yr Fixed",
      monthlyPayment: 4085,
      monthlyPaymentFormatted: "$4,085 CAD / mo",
      stressRate: 6.69
    },
    status: "PENDING_OFFICER_AUTHORIZATION",
    agentNote: "High-Ratio CMHC Insured application (10% down). 745 Equifax score qualifies for RBC Prime. Stress test GDS=31.4% (max 39%), TDS=36.2% (max 44%). Routed to Steve for final authorization.",
    humanOfficer: "Steve",
    decision: null,
    decisionTimestamp: null,
    officerNotes: null
  },
  {
    id: "MORT-CAN-1022",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    country: "Canada",
    province: "BC",
    city: "Vancouver",
    currency: "CAD",
    borrowerName: "Dr. Evelyn Zhang",
    documentType: "Canadian Passport & SIN",
    documentNumber: "PASS-ZA891240",
    creditScore: 780,
    creditBureau: "Equifax & TransUnion Canada",
    grossMonthlyIncome: 24000,
    grossMonthlyIncomeFormatted: "$24,000 CAD",
    monthlyDebts: 1100,
    monthlyDebtsFormatted: "$1,100 CAD",
    purchasePrice: 1250000,
    purchasePriceFormatted: "$1,250,000 CAD",
    downPayment: 250000,
    downPaymentFormatted: "$250,000 CAD (20%)",
    loanAmount: 1000000,
    loanAmountFormatted: "$1,000,000 CAD",
    isInsured: false,
    cmhcPremium: 0,
    propertyType: "Townhouse",
    ltv: 80.0,
    gds: 25.8,
    tds: 30.4,
    stressTestRate: 6.85,
    termYears: 25,
    dealSelected: {
      id: "CAN-TD-FLEX",
      lender: "TD Canada Trust",
      product: "TD Flexible 5-Year Variable Prime",
      rate: 4.85,
      rateLabel: "4.85% Variable (Prime - 1.10%)",
      monthlyPayment: 5732,
      monthlyPaymentFormatted: "$5,732 CAD / mo",
      stressRate: 6.85
    },
    status: "PENDING_OFFICER_AUTHORIZATION",
    agentNote: "Conventional Uninsured mortgage (20% equity). Super-prime 780 Beacon score. Pristine debt service ratios. Awaiting Steve's underwriting determination.",
    humanOfficer: "Steve",
    decision: null,
    decisionTimestamp: null,
    officerNotes: null
  }
];

// Content Types map for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Routes
  if (pathname === '/api/queue' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, queue: underwriterQueue }));
    return;
  }

  if (pathname === '/api/queue' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const item = JSON.parse(body);
        item.id = item.id || `MORT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        item.timestamp = new Date().toISOString();
        item.status = "PENDING_OFFICER_AUTHORIZATION";
        item.humanOfficer = "Steve";
        underwriterQueue.unshift(item);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, item }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  if (pathname === '/api/authorize' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { id, decision, officerNotes, officerName } = JSON.parse(body);
        const item = underwriterQueue.find(q => q.id === id);
        if (!item) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Dossier not found' }));
          return;
        }

        // Only valid human actions
        if (!['AUTHORIZED', 'DECLINED', 'CONDITIONS_REQUESTED'].includes(decision)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid underwriter decision' }));
          return;
        }

        item.status = decision === 'AUTHORIZED' 
          ? 'OFFICER_AUTHORIZED' 
          : (decision === 'DECLINED' ? 'OFFICER_DECLINED' : 'CONDITIONS_PENDING');
        item.decision = decision;
        item.officerNotes = officerNotes || '';
        item.humanOfficer = officerName || 'Steve';
        item.decisionTimestamp = new Date().toISOString();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, item }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // Serve static files
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

function startServer(portToListen = PORT) {
  return new Promise((resolve, reject) => {
    if (server.listening) {
      const addr = server.address();
      const currentPort = typeof addr === 'object' && addr ? addr.port : portToListen;
      return resolve({ server, port: currentPort });
    }

    const errorHandler = (err) => {
      server.removeListener('error', errorHandler);
      if (err.code === 'EADDRINUSE' && portToListen < 3050) {
        console.log(`[Server] Port ${portToListen} in use, trying port ${portToListen + 1}...`);
        startServer(portToListen + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    };

    server.once('error', errorHandler);
    server.listen(portToListen, '127.0.0.1', () => {
      server.removeListener('error', errorHandler);
      const nmls = process.env.HUMAN_OFFICER_NMLS_ID ? ` (${process.env.HUMAN_OFFICER_NMLS_ID})` : '';
      console.log(`=======================================================`);
      console.log(`🍁 Canadian Mortgage Intelligence Platform`);
      console.log(`🔒 Guardrail: AI Agent is STRICTLY FORBIDDEN from approving/denying deals.`);
      console.log(`👤 Human Authorization Desk: ${HUMAN_OFFICER}${nmls}`);
      console.log(`🌐 Server running at: http://127.0.0.1:${portToListen}`);
      console.log(`=======================================================`);
      resolve({ server, port: portToListen });
    });
  });
}

if (require.main === module) {
  startServer(PORT);
}

module.exports = { server, startServer, PORT };

