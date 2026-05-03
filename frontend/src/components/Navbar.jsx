import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { firstName, user, signOut } = useAuth();

  return (
    <nav>
      <div className="container nav-inner">
        <Link to="/" className="nav-logo">GYM<span>IQ</span></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {firstName && (
  <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontFamily: 'Syne', fontWeight: 600 }}>
    Hey, {firstName}
  </span>
)}
          <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign out</button>
        </div>
      </div>
    </nav>
  );
}
