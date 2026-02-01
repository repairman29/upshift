import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    return (
      <div className="platform-wrap" style={{ paddingTop: '1rem' }}>
        <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
          Signed in as <strong style={{ color: 'var(--text)' }}>{session.user?.email ?? session.user?.name}</strong>.
        </p>
        <Link href="/dashboard" className="btn btn-primary">Go to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="platform-wrap platform-hero">
      <h1>Your dependency health in one place</h1>
      <p className="platform-hero-lead">
        Centralized reports, team visibility, and priority AI support. Sign in to your dashboard or upgrade to Pro for higher quotas and JARVIS conversational analysis.
      </p>
      <div className="platform-hero-actions">
        <Link href="/api/auth/signin" className="btn btn-primary">Sign in</Link>
        <a href="https://upshiftai.dev" className="btn btn-secondary" target="_blank" rel="noopener">
          Learn more
        </a>
      </div>
    </div>
  );
}
