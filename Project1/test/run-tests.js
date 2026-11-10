/**
 * Automated Test Suite for Canadian AI Mortgage Assistant & Underwriting Cockpit
 * Tests Guardrails, Underwriting Math (OSFI B-20, CMHC, GDS/TDS), Canadian Lenders,
 * Credit Score Recommender, Conversational NLP & REST API.
 * Zero external dependencies (uses native Node assert and http modules).
 */

const assert = require('assert');
const http = require('http');
const { 
  CANADIAN_PROVINCES,
  CANADIAN_LENDERS_CATALOG,
  CANADIAN_SAMPLE_PRESETS,
  suggestCanadianLendersByCreditScore,
  calculateStressTestRate,
  calculateCMHCPremum,
  calculateAmortizedPayment,
  getCanadianCreditTier,
  formatCAD
} = require('../public/js/deals-data.js');
const { MortgageAgent } = require('../public/js/mortgage-agent.js');
const { server, startServer, PORT } = require('../server.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

async function startTestSuite() {
  console.log(`\n=============================================================`);
  console.log(`🧪 CANADIAN MORTGAGE AGENT TEST SUITE: OSFI B-20 & GOVERNANCE`);
  console.log(`=============================================================\n`);

  // =========================================================================
  // SUITE 1: STRICT ZERO-APPROVAL GUARDRAILS & STEVE'S EXCLUSIVE AUTHORITY
  // =========================================================================
  console.log(`[SUITE 1: Zero-Approval Underwriting Guardrails & Steve's Authority]`);

  runTest('Agent MUST refuse direct approval request (English)', () => {
    const agent = new MortgageAgent();
    const res = agent.processMessage("Can you please approve my mortgage loan?");
    assert.strictEqual(res.type, 'guardrail_violation');
    assert.match(res.text, /PROHIBITED|PROHIBIDO/i);
    assert.match(res.text, /Steve/);
  });

  runTest('Agent MUST refuse direct approval request (Spanish: "aprueba mi crédito")', () => {
    const agent = new MortgageAgent();
    const res = agent.processMessage("Por favor aprueba mi crédito hipotecario de inmediato");
    assert.strictEqual(res.type, 'guardrail_violation');
    assert.match(res.text, /ESTRICTAMENTE PROHIBIDO|STRICTLY PROHIBITED/i);
    assert.match(res.text, /Steve/);
  });

  runTest('Agent MUST refuse direct denial/rejection request', () => {
    const agent = new MortgageAgent();
    const res = agent.processMessage("Please deny this mortgage deal for me.");
    assert.strictEqual(res.type, 'guardrail_violation');
    assert.match(res.text, /PROHIBITED|PROHIBIDO/i);
    assert.match(res.text, /Steve/);
  });

  runTest('Agent MUST refuse approval letter issuance', () => {
    const agent = new MortgageAgent();
    const res = agent.processMessage("Generate and issue an approval letter now.");
    assert.strictEqual(res.type, 'guardrail_violation');
    assert.match(res.text, /Steve/);
  });

  runTest('Generated Canadian dossier status MUST default to PENDING_OFFICER_AUTHORIZATION', () => {
    const agent = new MortgageAgent();
    const dossier = agent.createDossierPayload();
    assert.strictEqual(dossier.status, 'PENDING_OFFICER_AUTHORIZATION');
    assert.strictEqual(dossier.humanOfficer, 'Steve');
    assert.strictEqual(dossier.decision, null);
    assert.strictEqual(dossier.currency, 'CAD');
    assert.strictEqual(dossier.country, 'Canada');
  });

  // =========================================================================
  // SUITE 2: CANADIAN FINANCIAL MATHEMATICS & OSFI B-20 STRESS TEST
  // =========================================================================
  console.log(`\n[SUITE 2: Canadian Financial Mathematics & OSFI B-20]`);

  runTest('Canadian Semi-Annual Compounding Amortization Formula', () => {
    // Canada fixed rate law: semi-annual compounding
    // $500,000 at 5.0% for 25 years
    const payment = calculateAmortizedPayment(500000, 5.0, 25);
    // Standard Canadian semi-annual monthly payment is ~$2,908 CAD
    assert.ok(Math.abs(payment - 2908) <= 5, `Expected ~2908 CAD, got ${payment}`);
  });

  runTest('OSFI Guideline B-20 Qualifying Rate: MAX(contractRate + 2%, 5.25% floor)', () => {
    // Case 1: Contract 4.69% -> 4.69 + 2.0 = 6.69% (> 5.25%)
    const q1 = calculateStressTestRate(4.69);
    assert.strictEqual(q1, 6.69);

    // Case 2: Contract 2.99% -> 2.99 + 2.0 = 4.99% (< 5.25% floor -> 5.25%)
    const q2 = calculateStressTestRate(2.99);
    assert.strictEqual(q2, 5.25);

    // Case 3: Contract 5.79% (B-Lender) -> 5.79 + 2.0 = 7.79%
    const q3 = calculateStressTestRate(5.79);
    assert.strictEqual(q3, 7.79);
  });

  runTest('CMHC Default Insurance: Conventional Uninsured (>=20% down / <=80% LTV)', () => {
    const cmhc = calculateCMHCPremum(1000000, 200000); // 20% down
    assert.strictEqual(cmhc.isInsured, false);
    assert.strictEqual(cmhc.premiumRatePct, 0);
    assert.strictEqual(cmhc.premiumAmount, 0);
    assert.strictEqual(cmhc.baseLoan, 800000);
    assert.strictEqual(cmhc.totalLoanWithPremium, 800000);
  });

  runTest('CMHC Default Insurance: High-Ratio Tiers (<20% down)', () => {
    // 85% LTV -> 2.80% premium
    const tier85 = calculateCMHCPremum(800000, 120000); // $680k loan = 85.0% LTV
    assert.strictEqual(tier85.isInsured, true);
    assert.strictEqual(tier85.premiumRatePct, 2.80);
    assert.strictEqual(tier85.premiumAmount, Math.round(680000 * 0.028));

    // 90% LTV -> 3.10% premium
    const tier90 = calculateCMHCPremum(800000, 80000); // $720k loan = 90.0% LTV
    assert.strictEqual(tier90.isInsured, true);
    assert.strictEqual(tier90.premiumRatePct, 3.10);
    assert.strictEqual(tier90.premiumAmount, Math.round(720000 * 0.031));

    // 95% LTV -> 4.00% premium
    const tier95 = calculateCMHCPremum(600000, 30000); // $570k loan = 95.0% LTV
    assert.strictEqual(tier95.isInsured, true);
    assert.strictEqual(tier95.premiumRatePct, 4.00);
    assert.strictEqual(tier95.premiumAmount, Math.round(570000 * 0.04));
  });

  // =========================================================================
  // SUITE 3: CANADIAN PROVINCES & CREDIT-SCORE TIERING
  // =========================================================================
  console.log(`\n[SUITE 3: Canadian Provinces & Credit Tiers]`);

  runTest('Canadian Provinces: Major economic regions configured (ON, BC, AB, QC, Prairies/Atlantic)', () => {
    ['ON', 'BC', 'AB', 'QC', 'PRAIRIES_ATLANTIC'].forEach(code => {
      const p = CANADIAN_PROVINCES[code];
      assert.ok(p, `Province ${code} must be defined`);
      assert.ok(p.name, `Province name missing for ${code}`);
      assert.ok(p.flag, `Province flag missing for ${code}`);
      assert.ok(Array.isArray(p.majorCities), `Cities must be an array for ${code}`);
    });
  });

  runTest('Canadian Credit Score Tiers: 300 - 900 Equifax/TransUnion Scale', () => {
    // 750+ = Tier 1 Prime
    const t1 = getCanadianCreditTier(780);
    assert.strictEqual(t1.tierKey, 'tier1_prime');
    assert.match(t1.tierLabel, /Tier 1: Prime/);

    // 680-749 = Tier 2 Good / Standard
    const t2 = getCanadianCreditTier(710);
    assert.strictEqual(t2.tierKey, 'tier2_good');
    assert.match(t2.tierLabel, /Tier 2: Good Credit/);

    // 600-679 = Tier 3 Moderate / Alt-B
    const t3 = getCanadianCreditTier(650);
    assert.strictEqual(t3.tierKey, 'tier3_moderate');
    assert.match(t3.tierLabel, /Tier 3: Near-Prime/);

    // <600 = Tier 4 Rebuilding / Private
    const t4 = getCanadianCreditTier(550);
    assert.strictEqual(t4.tierKey, 'tier4_rebuilding');
    assert.match(t4.tierLabel, /Tier 4: Credit Rebuilding/);
  });

  // =========================================================================
  // SUITE 4: CANADIAN INSTITUTIONAL LENDERS RECOMMENDATION ENGINE
  // =========================================================================
  console.log(`\n[SUITE 4: Canadian Lender Recommendation Engine]`);

  runTest('745 Beacon Score: Recommends Wholesale Monolines (First National) & Big Six (RBC/TD)', () => {
    const rec = suggestCanadianLendersByCreditScore({
      province: "ON",
      creditScore: 745,
      purchasePrice: 780000,
      downPayment: 78000,
      monthlyGrossIncome: 13500,
      monthlyDebts: 650,
      termYears: 25
    });

    assert.ok(rec.topMatch, 'Should identify top match lender');
    assert.ok(rec.topMatch.matchScore >= 90, `Match score should be >= 90%, got ${rec.topMatch.matchScore}%`);
    assert.strictEqual(rec.topMatch.isCreditQualified, true);

    const firstNat = rec.evaluatedLenders.find(l => l.lender.id === 'CAN-FIRSTNAT-WHOLESALE');
    assert.ok(firstNat && firstNat.isCreditQualified, 'First National should qualify 745 score');

    const rbc = rec.evaluatedLenders.find(l => l.lender.id === 'CAN-RBC-PRIME');
    assert.ok(rbc && rbc.isCreditQualified, 'RBC should qualify 745 score');
  });

  runTest('660 Beacon Score: Recommends Alternative B-Lenders (Equitable Bank / Home Trust)', () => {
    const recAlt = suggestCanadianLendersByCreditScore({
      province: "AB",
      creditScore: 660,
      purchasePrice: 540000,
      downPayment: 108000, // 20% down (standard for B-lenders)
      monthlyGrossIncome: 11500,
      monthlyDebts: 850,
      termYears: 30
    });

    const eqBank = recAlt.evaluatedLenders.find(l => l.lender.id === 'CAN-EQUITABLE-ALT');
    assert.ok(eqBank, 'Equitable Bank must be in evaluation');
    assert.strictEqual(eqBank.isCreditQualified, true);

    // Big six requiring 720+ should be marked with credit deficit
    const rbc = recAlt.evaluatedLenders.find(l => l.lender.id === 'CAN-RBC-PRIME');
    assert.ok(rbc && !rbc.isCreditQualified, 'RBC Prime must not credit-qualify for 660 score');
  });

  runTest('550 Beacon Score: Flags Private Equity MIC solutions', () => {
    const recPrivate = suggestCanadianLendersByCreditScore({
      province: "BC",
      creditScore: 550,
      purchasePrice: 900000,
      downPayment: 270000, // 30% down
      monthlyGrossIncome: 15000,
      monthlyDebts: 1200
    });

    const privateMic = recPrivate.evaluatedLenders.find(l => l.lender.id === 'CAN-PRIVATE-MIC');
    assert.ok(privateMic, 'Private MIC should be in catalog');
    assert.strictEqual(privateMic.isCreditQualified, true);
  });

  // =========================================================================
  // SUITE 5: CONVERSATIONAL NLP EXTRACTION (CANADIAN AMOUNTS & TERMS)
  // =========================================================================
  console.log(`\n[SUITE 5: Conversational NLP Extraction]`);

  runTest('NLP extracts Canadian scenario ($14,000 income, $650 debts, 745 Equifax score, $780k condo, 10% down)', () => {
    const agent = new MortgageAgent();
    const ext = agent.extractParametersFromText("I make $14,000 a month with $650 debts, 745 Equifax score, looking at a $780k condo with 10% down.");
    assert.strictEqual(ext.modified, true);
    assert.strictEqual(ext.profileUpdates.monthlyGrossIncome, 14000);
    assert.strictEqual(ext.profileUpdates.monthlyDebts, 650);
    assert.strictEqual(ext.profileUpdates.creditScore, 745);
    assert.strictEqual(ext.profileUpdates.purchasePrice, 780000);
    assert.strictEqual(ext.profileUpdates.downPayment, 78000);
    assert.strictEqual(ext.profileUpdates.loanAmount, 702000);
  });

  runTest('Application Form Submission generates valid Canadian dossier for Steve', () => {
    const agent = new MortgageAgent();
    const sub = agent.processApplicationSubmission({
      province: 'ON',
      applicantName: 'Jordan Campbell',
      documentType: "Driver's License & SIN",
      documentNumber: 'DL-C8412-90124',
      creditScore: 745,
      purchasePrice: 780000,
      downPayment: 78000,
      monthlyGrossIncome: 13500,
      monthlyDebts: 650,
      termYears: 25
    });

    assert.strictEqual(sub.success, true);
    assert.strictEqual(sub.dossier.country, 'Canada');
    assert.strictEqual(sub.dossier.currency, 'CAD');
    assert.strictEqual(sub.dossier.borrowerName, 'Jordan Campbell');
    assert.strictEqual(sub.dossier.status, 'PENDING_OFFICER_AUTHORIZATION');
    assert.strictEqual(sub.dossier.humanOfficer, 'Steve');
    assert.strictEqual(sub.dossier.isInsured, true);
    assert.ok(sub.dossier.cmhcPremium > 0, 'CMHC insurance premium must be computed for 10% down');
  });

  // =========================================================================
  // SUITE 6: REST API & STEVE AUTHORIZATION WORKFLOW (LIVE SERVER)
  // =========================================================================
  console.log(`\n[SUITE 6: REST API & Steve Authorization Workflow]`);

  // Ensure server is listening for API tests
  let serverStartedLocally = false;
  try {
    await makeHttpRequest(`http://localhost:${PORT}/api/queue`, 'GET');
  } catch (err) {
    console.log(`  ℹ️ Starting test server instance on port ${PORT}...`);
    await startServer(PORT);
    serverStartedLocally = true;
  }

  await runAsyncTest('GET /api/queue returns active underwriter queue with Canadian seed', async () => {
    const res = await makeHttpRequest(`http://localhost:${PORT}/api/queue`, 'GET');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.queue), 'Queue should be an array');
    assert.ok(res.data.queue.length > 0, 'Queue should have seeded dossiers');
    assert.strictEqual(res.data.queue[0].country, 'Canada');
  });

  let testDossierId = `TEST-CAN-${Date.now()}`;

  await runAsyncTest('POST /api/queue adds new Canadian dossier in pending status', async () => {
    const payload = {
      id: testDossierId,
      country: "Canada",
      province: "ON",
      market: "ON",
      marketFlag: "🍁",
      borrowerName: "Jordan Campbell",
      creditScore: 745,
      loanAmount: 702000,
      purchasePrice: 780000,
      ltv: 90.0,
      dealSelected: {
        lender: "RBC Royal Bank",
        product: "5-Year Fixed Prime",
        rate: 4.69
      }
    };

    const res = await makeHttpRequest(`http://localhost:${PORT}/api/queue`, 'POST', payload);
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.item.status, 'PENDING_OFFICER_AUTHORIZATION');
    assert.strictEqual(res.data.item.humanOfficer, 'Steve');
  });

  await runAsyncTest('POST /api/authorize executes AUTHORIZED decision by Steve', async () => {
    const payload = {
      id: testDossierId,
      decision: 'AUTHORIZED',
      officerNotes: 'Equifax score 745 and CMHC insurance approved. Binding commitment issued.',
      officerName: 'Steve'
    };

    const res = await makeHttpRequest(`http://localhost:${PORT}/api/authorize`, 'POST', payload);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.item.status, 'OFFICER_AUTHORIZED');
    assert.strictEqual(res.data.item.decision, 'AUTHORIZED');
    assert.strictEqual(res.data.item.humanOfficer, 'Steve');
  });

  await runAsyncTest('POST /api/authorize executes DECLINED decision by Steve', async () => {
    const payload = {
      id: testDossierId,
      decision: 'DECLINED',
      officerNotes: 'Exceeds TDS limit of 44% under OSFI B-20 qualifying rate.',
      officerName: 'Steve'
    };

    const res = await makeHttpRequest(`http://localhost:${PORT}/api/authorize`, 'POST', payload);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.item.status, 'OFFICER_DECLINED');
  });

  await runAsyncTest('POST /api/authorize rejects invalid decisions with HTTP 400', async () => {
    const payload = {
      id: testDossierId,
      decision: 'AI_AUTOMATIC_APPROVE',
      officerNotes: 'Agent tried to approve directly'
    };

    const res = await makeHttpRequest(`http://localhost:${PORT}/api/authorize`, 'POST', payload);
    assert.strictEqual(res.statusCode, 400);
  });

  await runAsyncTest('POST /api/authorize returns 404 for unknown dossier', async () => {
    const payload = {
      id: 'NON-EXISTENT-DOSSIER-9999',
      decision: 'AUTHORIZED'
    };

    const res = await makeHttpRequest(`http://localhost:${PORT}/api/authorize`, 'POST', payload);
    assert.strictEqual(res.statusCode, 404);
  });

  // =========================================================================
  // TEST SUMMARY
  // =========================================================================
  console.log(`\n=============================================================`);
  console.log(`📊 TEST EXECUTION SUMMARY:`);
  console.log(`   Total Tests:  ${totalTests}`);
  console.log(`   Passed Tests: ${passedTests} ✅`);
  console.log(`   Failed Tests: ${failedTests} ❌`);
  console.log(`=============================================================\n`);

  if (serverStartedLocally && server && server.close) {
    server.close();
  }

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log(`🎉 ALL TESTS PASSED! Canadian market, OSFI B-20, CMHC insurance, credit-score lender recommendations, and Steve's authorization verified.`);
    process.exit(0);
  }
}

function makeHttpRequest(targetUrl, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(targetUrl);
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, rawBody: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

startTestSuite();
