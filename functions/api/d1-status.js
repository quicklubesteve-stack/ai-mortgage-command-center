/**
 * Cloudflare Pages Function: /api/d1-status
 * Inspects live Cloudflare D1 SQLite database connection & row counts
 */

export async function onRequestGet(context) {
  try {
    const db = context.env.DB || context.env.ai_mortgage_db;
    if (!db) {
      return new Response(
        JSON.stringify({
          success: false,
          status: 'UNBOUND',
          message: 'Cloudflare D1 database binding not present in this runtime context.',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const inquiriesCount = await db
      .prepare('SELECT COUNT(*) as count FROM mortgage_inquiries')
      .first();
    const demoCount = await db
      .prepare('SELECT COUNT(*) as count FROM demo_requests')
      .first();
    const auditCount = await db
      .prepare('SELECT COUNT(*) as count FROM audit_events')
      .first();

    const recentInquiries = await db
      .prepare(
        'SELECT id, reference_code, full_name, email, city, province, purpose, property_price, created_at FROM mortgage_inquiries ORDER BY created_at DESC LIMIT 10'
      )
      .all();

    return new Response(
      JSON.stringify({
        success: true,
        status: 'CONNECTED',
        databaseEngine: 'Cloudflare D1 (Serverless SQLite)',
        databaseName: 'ai-mortgage-db',
        region: 'ENAM',
        counts: {
          mortgageInquiries: inquiriesCount?.count || 0,
          demoRequests: demoCount?.count || 0,
          auditEvents: auditCount?.count || 0,
        },
        recentInquiries: recentInquiries.results,
        timestamp: new Date().toISOString(),
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

