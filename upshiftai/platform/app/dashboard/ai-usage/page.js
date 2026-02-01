import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import Link from 'next/link';

export default async function AIUsagePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/api/auth/signin');
  }

  // Demo data (in production this would fetch from DB)
  const demoApiKey = `uai_pro_${session.user.email?.replace('@', '_').replace('.', '_')}`;
  const usage = 45;
  const limit = 1000;
  const percent = (usage / limit) * 100;
  
  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
          ← Back to Dashboard
        </Link>
        <h1>AI Usage & API Keys</h1>
      </div>
      
      <div className="card" style={{ marginBottom: '32px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Usage</h3>
          <span className="badge badge-pro">PRO PLAN</span>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span>Monthly Quota</span>
            <span style={{ fontWeight: 600 }}>{usage} / {limit} queries</span>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-body)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${percent}%`, background: 'var(--success)', height: '100%' }} />
          </div>
        </div>
        
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Resets on <strong>March 1, 2026</strong>. Need more? <a href="mailto:support@upshiftai.dev" style={{ color: 'var(--accent-primary)' }}>Contact us</a>.
        </div>
      </div>

      <div className="card" style={{ marginBottom: '32px' }}>
        <div className="card-header">
          <h3>Your API Key</h3>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Use this key to authenticate JARVIS skills and CI integrations.
        </p>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <code style={{ flex: 1, padding: '12px', fontSize: '14px', background: '#000', border: '1px solid var(--border)', display: 'block' }}>
            {demoApiKey}
          </code>
          <button className="btn btn-secondary">Copy</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Setup Instructions</h3>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>1. Local Environment</h4>
          <code style={{ display: 'block', padding: '12px', background: '#000', fontSize: '13px' }}>
            export UPSHIFTAI_API_KEY={demoApiKey}
          </code>
        </div>

        <div>
          <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>2. Ask JARVIS</h4>
          <code style={{ display: 'block', padding: '12px', background: '#000', fontSize: '13px', color: 'var(--text-muted)' }}>
            "Analyze my dependencies"<br/>
            "Check for ancient packages"<br/>
            "How's my dependency health?"
          </code>
        </div>
      </div>
    </div>
  );
}