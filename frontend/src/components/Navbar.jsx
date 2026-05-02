import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav>
      <div className="container nav-inner">
        <Link to="/" className="nav-logo">LIFT<span>LOG</span></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{user?.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign out</button>
        </div>
      </div>
    </nav>
  );
}
