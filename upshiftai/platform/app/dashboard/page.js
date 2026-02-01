import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { getReportsByUser, hasPro } from '@/lib/store';
import CheckoutButton from './CheckoutButton';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/api/auth/signin');
  }

  try {
    const userId = session.user?.id;
    const reports = (await getReportsByUser(userId)) || [];
    const pro = await hasPro(userId);

    return (
      <div className="container" style={{ padding: '40px 24px' }}>
        <div className="dash-header">
          <h1>Dashboard</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{session.user.email}</span>
            <Link href="/api/auth/signout" className="btn btn-secondary">Sign out</Link>
            {!pro && <CheckoutButton />}
          </div>
        </div>

        {!pro && (
          <div className="card" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'var(--accent-primary)', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', color: 'var(--accent-primary)', marginBottom: '4px' }}>Upgrade to Pro</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Get JARVIS integration, hosted reports, and priority support.</p>
              </div>
              <CheckoutButton />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '16px' }}>
          <h2>Reports</h2>
          {pro && (
            <Link href="/dashboard/ai-usage" className="btn btn-secondary" style={{ fontSize: '12px' }}>
              🤖 AI Usage & Keys
            </Link>
          )}
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {reports.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>📉</div>
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>No reports yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 24px' }}>
                Run an analysis from your terminal to see it here.
              </p>
              <div style={{ background: 'rgba(0,0,0,0.3)', display: 'inline-block', padding: '12px 16px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-dim)' }}>$</span> npx upshiftai-deps report . --upload
              </div>
            </div>
          ) : (
            <div>
              {reports.map((r) => (
                <div key={r.id} className="list-item">
                  <div>
                    <Link href={`/dashboard/reports/${r.id}`} style={{ fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                      {r.project_name || r.projectName || 'Untitled Project'}
                    </Link>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                      <span>{r.ecosystem || 'npm'}</span>
                      <span>•</span>
                      <span>{new Date(r.created_at || r.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link href={`/dashboard/reports/${r.id}`} className="btn btn-secondary" style={{ height: '32px', fontSize: '12px' }}>
                    View Report
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } catch (e) {
    return (
      <div className="container" style={{ padding: '40px' }}>
        <div className="card" style={{ borderColor: 'var(--danger)' }}>
          <h3 style={{ color: 'var(--danger)' }}>Dashboard Error</h3>
          <p style={{ color: 'var(--text-muted)' }}>{e.message}</p>
        </div>
      </div>
    );
  }
}