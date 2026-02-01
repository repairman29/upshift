import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import Link from 'next/link';

export default async function AIUsagePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/api/auth/signin');
  }

  // For demo, generate API key from email
  const demoApiKey = `uai_pro_${session.user.email?.replace('@', '_').replace('.', '_')}`;
  
  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h1>🤖 AI Usage & API Keys</h1>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        border: '1px solid #e9ecef'
      }}>
        <h2>🚀 Pro Plan</h2>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Usage this month:</strong> 45 / 1,000 AI queries
        </div>
        
        <div style={{
          background: '#e9ecef',
          height: '20px',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}>
          <div style={{
            background: '#28a745',
            height: '100%',
            width: '4.5%',
          }} />
        </div>
        
        <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
          <strong>Remaining:</strong> 955 queries | <strong>Resets:</strong> March 1, 2026
        </div>
      </div>

      <div style={{
        background: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        border: '1px solid #e9ecef'
      }}>
        <h3>🔑 Your API Key</h3>
        <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
          Use this key to access AI features in JARVIS:
        </p>
        <div style={{
          background: '#1a1a1a',
          padding: '1rem',
          borderRadius: '4px',
          fontFamily: 'monospace',
          color: '#f8f9fa',
          marginBottom: '1rem',
          wordBreak: 'break-all'
        }}>
          {demoApiKey}
        </div>
      </div>

      <div style={{
        background: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        border: '1px solid #e9ecef'
      }}>
        <h3>⚙️ Setup Instructions</h3>
        <p><strong>Environment Variable:</strong></p>
        <div style={{
          background: '#1a1a1a',
          padding: '1rem',
          borderRadius: '4px',
          fontFamily: 'monospace',
          color: '#f8f9fa',
          marginBottom: '1rem'
        }}>
          export UPSHIFTAI_API_KEY={demoApiKey}
        </div>
        
        <p><strong>JARVIS Usage:</strong></p>
        <div style={{
          background: '#1a1a1a',
          padding: '1rem',
          borderRadius: '4px',
          fontFamily: 'monospace',
          color: '#f8f9fa',
          fontSize: '0.9rem'
        }}>
          # Now you can ask JARVIS:<br/>
          "Analyze my dependencies"<br/>
          "Check for ancient packages"<br/>
          "How's my dependency health?"
        </div>
      </div>

      <div style={{
        background: '#fff3cd',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #ffeaa7'
      }}>
        <h3>🚀 Pro Features Unlocked</h3>
        <p>You have access to:</p>
        <div style={{ marginBottom: '1rem' }}>
          <strong>✅ 1,000 AI queries/month</strong><br/>
          <strong>✅ JARVIS conversational analysis</strong><br/>
          <strong>✅ Smart risk assessment</strong><br/>
          <strong>✅ Predictive vulnerability scoring</strong>
        </div>
        <Link 
          href="/dashboard" 
          style={{
            background: '#007bff',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}