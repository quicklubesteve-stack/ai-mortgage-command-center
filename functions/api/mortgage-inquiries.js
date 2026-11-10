/**
 * Cloudflare Pages Function: /api/mortgage-inquiries
 * Connects directly to Cloudflare D1 SQLite Database binding (env.DB)
 */

// Canadian Semi-Annual Compounding Payment Calculation
function calculateCanadianMonthlyPayment(principal, annualRatePct, amortYears) {
  const r = annualRatePct / 100;
  // Canadian semi-annual compounding effective monthly rate: (1 + r/2)^(2/12) - 1
  const monthlyRate = Math.pow(1 + r / 2, 2 / 12) - 1;
  const numPayments = amortYears * 12;
  const factor = Math.pow(1 + monthlyRate, numPayments);
  const payment = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(payment * 100) / 100;
}

export async function onRequestPost(context) {
  try {
    const db = context.env.DB || context.env.ai_mortgage_db;
    const body = await context.request.json();

    const price = Math.max(Number(body.propertyPriceOrValue) || 750000, 50000);
    const down = Math.min(
      Math.max(Number(body.downPaymentOrEquity) || 75000, 0),
      price * 0.95
    );
    const baseLoan = Math.max(price - down, 50000);
    const downPct = Math.round((down / price) * 1000) / 10;
    const insuranceRequired = downPct < 20 ? 1 : 0;

    // CMHC premium estimate if high-ratio (<20% down)
    let totalLoan = baseLoan;
    if (insuranceRequired) {
      let premiumPct = 0.04;
      if (downPct >= 15) premiumPct = 0.028;
      else if (downPct >= 10) premiumPct = 0.031;
      totalLoan = Math.round(baseLoan * (1 + premiumPct));
    }

    const estPayment = calculateCanadianMonthlyPayment(totalLoan, 4.79, 25);
    const stressPayment = calculateCanadianMonthlyPayment(totalLoan, 6.79, 25);
    const refCode = `CAN-D1-INQ-${Math.floor(1000 + Math.random() * 8999)}`;
    const id = `inq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (db) {
      // 1. Insert into Cloudflare D1 SQLite table: mortgage_inquiries
      await db.prepare(`
        INSERT INTO mortgage_inquiries (
          id, reference_code, full_name, email, phone, preferred_contact,
          province, city, purpose, is_first_time_buyer, property_price,
          down_payment, requested_loan, gross_annual_income, employment_type,
          credit_score_estimate, timeline, notes, estimated_monthly_payment,
          qualifying_rate_pct, contract_rate_pct, down_payment_pct, insurance_required,
          status, source_page
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        refCode,
        body.fullName || 'Anonymous Borrower',
        body.email || 'borrower@inquiry.ca',
        body.phone || '(416) 555-0199',
        body.preferredContact || 'EMAIL',
        body.province || 'ON',
        body.city || 'Toronto',
        body.purpose || 'PURCHASE',
        body.isFirstTimeBuyer ? 1 : 0,
        price,
        down,
        totalLoan,
        Number(body.grossAnnualIncome) || 140000,
        body.employmentType || 'SALARIED_FULL_TIME',
        Number(body.creditScoreEstimate) || 720,
        body.timeline || 'Within 60 Days',
        body.notes || '',
        estPayment,
        6.79,
        4.79,
        downPct,
        insuranceRequired,
        'NEW_BORROWER_INQUIRY',
        body.sourcePage || 'contact_page'
      ).run();

      // 2. Insert into D1 audit_events
      await db.prepare(`
        INSERT INTO audit_events (id, actor_name, actor_role, event_type, summary)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        `aud-${Date.now()}`,
        body.fullName || 'Prospective Borrower',
        'PUBLIC_BORROWER',
        'NEW_BORROWER_INQUIRY_D1',
        `Successfully saved mortgage inquiry ${refCode} into Cloudflare D1 SQLite database ($${price.toLocaleString()} CAD ${body.purpose || 'PURCHASE'} in ${body.city || 'Toronto'}, ${body.province || 'ON'}).`
      ).run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        savedTo: db ? 'CLOUDFLARE_D1_SQLITE' : 'LOCAL_EDGE_SIMULATION',
        database: 'ai-mortgage-db (Cloudflare D1)',
        inquiryRef: refCode,
        applicationId: id,
        loanAmount: totalLoan,
        estimatedPayment: estPayment,
        stressPayment: stressPayment,
        qualifyingRatePct: 6.79,
        contractRatePct: 4.79,
        downPaymentPct: downPct,
        insuranceRequired: Boolean(insuranceRequired),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to persist inquiry in Cloudflare D1',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestGet(context) {
  try {
    const db = context.env.DB || context.env.ai_mortgage_db;
    if (!db) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cloudflare D1 binding (DB) not found in environment context',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { results } = await db.prepare(
      `SELECT * FROM mortgage_inquiries ORDER BY created_at DESC LIMIT 50`
    ).all();

    return new Response(
      JSON.stringify({
        success: true,
        database: 'ai-mortgage-db (Cloudflare D1 SQLite)',
        count: results.length,
        inquiries: results,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

