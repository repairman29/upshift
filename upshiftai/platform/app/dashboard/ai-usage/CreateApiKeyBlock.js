'use client';

import { useState } from 'react';

export default function CreateApiKeyBlock() {
  const [key, setKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/me', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create key');
        return;
      }
      setKey(data.apiKey);
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (key) {
    return (
      <div>
        <div className="pre-block" style={{ wordBreak: 'break-all' }}>
          {key}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Copy this key now. It won&apos;t be shown again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={handleCreate} disabled={loading} className="btn btn-primary" style={{ marginBottom: '0.5rem' }}>
        {loading ? 'Creating…' : 'Create API key'}
      </button>
      {error && <p style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>{error}</p>}
    </div>
  );
}
