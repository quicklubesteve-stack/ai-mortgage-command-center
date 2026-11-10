/**
 * Cloudflare Pages Function: /api/demo-requests
 * Connects directly to Cloudflare D1 SQLite Database binding (env.DB)
 */

export async function onRequestPost(context) {
  try {
    const db = context.env.DB || context.env.ai_mortgage_db;
    const body = await context.request.json();
    const id = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (db) {
      await db.prepare(`
        INSERT INTO demo_requests (
          id, full_name, work_email, organization_name, organization_type, province, team_size, message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        body.fullName || 'Demo Visitor',
        body.workEmail || 'visitor@demo.ca',
        body.organizationName || 'Demo Org',
        body.organizationType || 'MORTGAGE_BROKERAGE',
        body.province || 'ON',
        body.teamSize || '5-20 brokers',
        body.message || ''
      ).run();

      await db.prepare(`
        INSERT INTO audit_events (id, actor_name, actor_role, event_type, summary)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        `aud-${Date.now()}`,
        body.fullName || 'Demo Visitor',
        'PUBLIC_VISITOR',
        'DEMO_BOOKING_D1',
        `Saved demo request into Cloudflare D1 SQLite for ${body.organizationName} (${body.province}).`
      ).run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        savedTo: db ? 'CLOUDFLARE_D1_SQLITE' : 'LOCAL_EDGE_SIMULATION',
        id,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestGet(context) {
  try {
    const db = context.env.DB || context.env.ai_mortgage_db;
    if (!db) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cloudflare D1 DB binding not found' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { results } = await db.prepare(
      `SELECT * FROM demo_requests ORDER BY created_at DESC LIMIT 50`
    ).all();

    return new Response(
      JSON.stringify({ success: true, count: results.length, requests: results }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

