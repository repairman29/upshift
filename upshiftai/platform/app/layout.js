export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui', margin: 0, background: '#0d0d0d', color: '#e6e6e6' }}>
        {children}
      </body>
    </html>
  );
}
