'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      router.push('/dashboard');
      router.refresh(); // Refresh layout to update sidebar state
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Nur Afiq Recycling</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Business Management System</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Username</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#64748b' }}>
                <User size={18} />
              </div>
              <input 
                type="text" 
                className="form-input" 
                style={{ paddingLeft: '44px' }}
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#64748b' }}>
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                className="form-input" 
                style={{ paddingLeft: '44px' }}
                placeholder="Enter password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '8px' }}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
