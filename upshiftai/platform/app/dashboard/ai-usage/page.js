import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import Link from 'next/link';
import { getAiUsage, hasPro } from '@/lib/store';
import CreateApiKeyBlock from './CreateApiKeyBlock';

export default async function AIUsagePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/signin');
  }

  const usage = await getAiUsage(session.user.id);
  const pro = await hasPro(session.user.id);
  const displayKey = `uai_${pro ? 'pro' : 'free'}_${(session.user.email || session.user.id).toString().replace('@', '_').replace(/\./g, '_')}`;
  const resetDate = new Date(usage.resetAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  const pct = usage.limit > 0 ? Math.min(100, (usage.count / usage.limit) * 100) : 0;

  return (
    <div className="platform-wrap" style={{ paddingTop: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🤖 AI Usage & API Keys</h1>

      <div className="card">
        <h2>🚀 {pro ? 'Pro' : 'Free'} Plan</h2>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Usage this month:</strong> {usage.count} / {usage.limit.toLocaleString()} AI queries
        </div>
        <div
          style={{
            background: 'var(--border)',
            height: '20px',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--accent)',
              height: '100%',
              width: `${pct}%`,
            }}
          />
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
          <strong>Remaining:</strong> {usage.remaining.toLocaleString()} queries | <strong>Resets:</strong> {resetDate}
        </div>
      </div>

      <div className="card">
        <h3>🔑 Your API Key</h3>
        <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
          Use a key to access AI features in JARVIS. Create a persistent key below, or use the display key for demo.
        </p>
        <CreateApiKeyBlock />
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '1rem' }}>
          Display key (session-based): <code style={{ wordBreak: 'break-all' }}>{displayKey}</code>
        </p>
      </div>

      <div className="card">
        <h3>⚙️ Setup Instructions</h3>
        <p><strong>Environment Variable:</strong></p>
        <div className="pre-block">
          export UPSHIFTAI_API_KEY=your_key_here
        </div>
        <p><strong>JARVIS Usage:</strong></p>
        <div className="pre-block" style={{ fontSize: '0.9rem' }}>
          # Now you can ask JARVIS:<br />
          &quot;Analyze my dependencies&quot;<br />
          &quot;Check for ancient packages&quot;<br />
          &quot;How&apos;s my dependency health?&quot;
        </div>
      </div>

      <div className="card" style={{ borderColor: 'var(--accent)', background: 'rgba(59, 130, 246, 0.08)' }}>
        <h3>🚀 {pro ? 'Pro' : 'Free'} Features</h3>
        <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>You have access to:</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem', color: 'var(--muted)' }}>
          <li>✅ {usage.limit.toLocaleString()} AI queries/month</li>
          <li>✅ JARVIS conversational analysis</li>
          <li>✅ Smart risk assessment</li>
          <li>✅ Predictive vulnerability scoring</li>
        </ul>
        <Link href="/dashboard" className="btn btn-primary">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
