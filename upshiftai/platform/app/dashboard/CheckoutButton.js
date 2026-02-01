'use client';

import { useState } from 'react';

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  };
  return (
    <button type="button" onClick={handleClick} disabled={loading} className="btn btn-primary">
      {loading ? '…' : 'Upgrade to Pro'}
    </button>
  );
}
