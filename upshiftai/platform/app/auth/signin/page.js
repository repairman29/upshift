'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="platform-wrap" style={{ paddingTop: '2rem', maxWidth: 400 }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Sign in</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
        Use any email + password <code>demo</code> to sign in.
      </p>
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
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary">Sign in</button>
      </form>
      <p style={{ color: 'var(--muted)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Or</p>
      <button
        type="button"
        onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
        className="btn btn-secondary"
      >
        Sign in with GitHub
      </button>
    </div>
  );
}
