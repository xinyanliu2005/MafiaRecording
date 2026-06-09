// ═══════════════════════════════════════════
//  SUPABASE CONFIGURATION — supabase.js
//
//  Replace the two values below with your own
//  from: Supabase Dashboard → Project Settings → API
// ═══════════════════════════════════════════

const SUPABASE_URL    = 'https://jtwnlehftinpduhldxdh.supabase.co';       // e.g. https://xyzxyz.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0d25sZWhmdGlucGR1aGxkeGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTk0ODMsImV4cCI6MjA5NjU3NTQ4M30.ndF-6i7YbaQNZL-4xG_cgg2FKEdLere2UmeB83_Jdfo'; // long string starting with "eyJ..."

// ─── Thin REST wrapper (no npm needed) ───────
const sb = {

  async select(table, options = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
    if (options.order)  url += `&order=${options.order}`;
    if (options.filter) url += `&${options.filter}`;
    const res = await fetch(url, { headers: sbHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async insert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...sbHeaders(), 'Prefer': 'return=representation' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async update(table, match, data) {
    const params = Object.entries(match).map(([k,v]) => `${k}=eq.${v}`).join('&');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      method: 'PATCH',
      headers: { ...sbHeaders(), 'Prefer': 'return=representation' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async delete(table, match) {
    const params = Object.entries(match).map(([k,v]) => `${k}=eq.${v}`).join('&');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      method: 'DELETE',
      headers: sbHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  },
};

function sbHeaders() {
  return {
    'Content-Type':  'application/json',
    'apikey':         SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };
}

// ─── Check if Supabase is configured ─────────
function isSupabaseConfigured() {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}
