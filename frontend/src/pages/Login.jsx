import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup' && !fullName.trim()) {
      return setError('Please enter your name.');
    }
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) return setError(error.message);
      navigate('/');
    } else {
      const { error } = await signUp(email, password, fullName.trim());
      setLoading(false);
      if (error) return setError(error.message);
      setError('Account created! Please sign in.');
      setMode('login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: '2.5rem', fontWeight: 800 }}>
            <span style={{ color: 'var(--accent)' }}>GYM</span>IQ
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {mode === 'login' ? 'Welcome back. Let\'s get to work.' : 'Join GYMIQ. Start tracking today.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', marginBottom: '1.5rem', background: 'var(--surface2)', borderRadius: '8px', padding: '4px' }}>
          {['login', 'signup'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
                fontFamily: 'Syne', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#000' : 'var(--muted)',
                transition: 'all 0.15s'
              }}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Name field only on signup */}
            {mode === 'signup' && (
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Ridhima Agrawal"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p style={{ color: error.includes('created') ? 'var(--accent)' : 'var(--danger)', fontSize: '0.85rem' }}>
                {error}
              </p>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center', padding: '0.75rem' }}
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.82rem', color: 'var(--muted)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
