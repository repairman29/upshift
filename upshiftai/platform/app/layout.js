import './globals.css';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://upshiftai.dev';

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <header className="platform-header">
          <div className="platform-wrap">
            <Link href="/" className="platform-logo">
              UpshiftAI
            </Link>
            <nav className="platform-nav">
              <Link href="/dashboard">Dashboard</Link>
              {session && (
                <Link href="/dashboard/ai-usage">AI Usage</Link>
              )}
              <a href={`${SITE_URL}/pricing.html`} target="_blank" rel="noopener">
                Pricing
              </a>
              {session ? (
                <Link href="/api/auth/signout" className="nav-cta">Sign out</Link>
              ) : (
                <Link href="/api/auth/signin" className="nav-cta">Sign in</Link>
              )}
            </nav>
          </div>
        </header>
        <main className="platform-main">
          {children}
        </main>
        <footer className="platform-footer">
          <div className="platform-wrap">
            <p>
              <Link href="/">UpshiftAI</Link>
              {' — '}Your dependency health in one place.
              {' '}<a href={`${SITE_URL}/pricing.html`} target="_blank" rel="noopener">Pricing</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
