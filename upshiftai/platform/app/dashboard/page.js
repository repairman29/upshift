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
  const reports = getReportsByUser(userId);
  const pro = hasPro(userId);

  return (
    <div style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/api/auth/signout" style={{ color: '#888', textDecoration: 'none' }}>Sign out</Link>
          {!pro && (
            <CheckoutButton />
          )}
        </div>
      </div>

      {!pro && (
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, color: '#888' }}>Pro: $19/mo — hosted reports, approval queue, priority support. We charge because we can.</p>
        </div>
      )}

      <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Reports</h2>
      <p style={{ color: '#888', marginBottom: '1rem' }}>🤖 <strong>AI-powered analysis:</strong> Set <code style={{ background: '#1a1a1a', padding: '0.2rem 0.4rem', borderRadius: 4, color: '#f8f9fa' }}>UPSHIFTAI_API_KEY</code> to enable JARVIS conversational dependency intelligence. <Link href="/dashboard/ai-usage" style={{ color: '#007bff' }}>Get your API key →</Link></p>
      {reports.length === 0 ? (
        <p style={{ color: '#888' }}>No reports yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {reports.map((r) => (
            <li key={r.id} style={{ borderBottom: '1px solid #2a2a2a', padding: '0.75rem 0' }}>
              <Link href={`/dashboard/reports/${r.id}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{r.projectName}</Link>
              <span style={{ color: '#888', marginLeft: '0.5rem' }}>{r.ecosystem} · {new Date(r.createdAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
