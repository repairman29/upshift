'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Sign in</h1>
      <p style={{ color: '#888', marginBottom: '1rem' }}>MVP: use any email + password <code>demo</code> to sign in.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          signIn('credentials', { email, password, callbackUrl: '/dashboard' });
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#e6e6e6' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#e6e6e6' }}
        />
        <button type="submit" style={{ padding: '0.6rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6 }}>Sign in</button>
      </form>
    </div>
  );
}
