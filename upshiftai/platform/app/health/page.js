import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { hasPro, getSubscriptions } from '@/lib/store';
import { isSupabaseConfigured } from '@/lib/supabase';

export default async function HealthPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const pro = userId ? await hasPro(userId) : false;
  const allSubs = await getSubscriptions();
  const dbConfigured = isSupabaseConfigured();

  const debug = {
    db: dbConfigured ? 'Supabase' : 'in-memory',
    session: session
      ? {
          user: { id: session.user?.id, email: session.user?.email, name: session.user?.name },
          expires: session.expires,
        }
      : null,
    userId,
    hasPro: pro,
    subscriptionsSnapshot: allSubs,
  };

  return (
    <div className="platform-wrap" style={{ paddingTop: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Health / Debug</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
        Session and subscription state (for diagnosing Pro / dashboard).
      </p>
      <pre className="pre-block" style={{ fontSize: '13px', lineHeight: 1.5 }}>
        {JSON.stringify(debug, null, 2)}
      </pre>
    </div>
  );
}
