import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export default async function HealthPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  let status = 'unknown';
  let error = null;
  let userCount = null;

  try {
    if (!url || !key) {
      throw new Error(`Missing env vars: URL=${!!url}, KEY=${!!key}`);
    }

    const supabase = createClient(url, key);
    const { count, error: dbError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (dbError) throw dbError;
    
    status = 'connected';
    userCount = count;
  } catch (e) {
    status = 'error';
    error = e.message;
  }

  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1>System Health</h1>
      <div>Status: <strong>{status}</strong></div>
      {userCount !== null && <div>User Count: {userCount}</div>}
      {error && <div style={{ color: 'red', marginTop: 20 }}>Error: {error}</div>}
      <div style={{ marginTop: 20, color: '#666' }}>
        Env Check:<br/>
        URL: {url ? 'Set' : 'Missing'}<br/>
        Key: {key ? 'Set' : 'Missing'}
      </div>
    </div>
  );
}