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
  const userId = session.user?.id;
  const reports = await getReportsByUser(userId);
  const pro = await hasPro(userId);

  return (
    <div className="platform-wrap" style={{ paddingTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Dashboard</h1>
        {!pro && <CheckoutButton />}
      </div>

      {!pro && (
        <div className="card">
          <p style={{ margin: 0, color: 'var(--muted)' }}>Pro: $19/mo — centralized reports, higher AI quotas, and priority support so your team ships with confidence.</p>
        </div>
      )}

      <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Reports</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>🤖 <strong style={{ color: 'var(--text)' }}>AI-powered analysis:</strong> Set <code>UPSHIFTAI_API_KEY</code> to enable JARVIS conversational dependency intelligence. <Link href="/dashboard/ai-usage" style={{ color: 'var(--accent)' }}>Get your API key →</Link></p>
      {reports.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No reports yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {reports.map((r) => (
            <li key={r.id} style={{ borderBottom: '1px solid var(--border)', padding: '0.75rem 0' }}>
              <Link href={`/dashboard/reports/${r.id}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{r.projectName}</Link>
              <span style={{ color: 'var(--muted)', marginLeft: '0.5rem' }}>{r.ecosystem} · {new Date(r.createdAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
