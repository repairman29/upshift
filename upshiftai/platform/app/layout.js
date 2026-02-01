import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <header style={{ borderBottom: '1px solid var(--border)', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: '18px' }}>UpshiftAI <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Platform</span></div>
          </header>
          <main style={{ flex: 1 }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
