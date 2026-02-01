import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) {
    return (
      <div style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
        <p>Signed in as {session.user?.email ?? session.user?.name}.</p>
        <Link href="/dashboard" style={{ color: '#3b82f6' }}>Go to dashboard</Link>
      </div>
    );
  }
  return (
    <div style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>UpshiftAI Platform</h1>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>Hosted dashboard, approval queue, and billing. We charge because we can.</p>
      <Link href="/api/auth/signin" style={{ display: 'inline-block', padding: '0.6rem 1.25rem', background: '#3b82f6', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>Sign in</Link>
    </div>
  );
}
