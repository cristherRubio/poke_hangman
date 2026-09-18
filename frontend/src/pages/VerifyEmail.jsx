import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token, verifyEmail]);

  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(() => navigate('/login'), 3000);
    return () => clearTimeout(t);
  }, [status, navigate]);

  if (status === 'loading') {
    return (
      <div className="mx-auto" style={{ maxWidth: 360 }}>
        <h1>Verifying...</h1>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="mx-auto" style={{ maxWidth: 360 }}>
        <h1>Email verified</h1>
        <p>
          Your account is now active. Redirecting to <Link to="/login">login</Link>...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto" style={{ maxWidth: 360 }}>
      <h1>Verification failed</h1>
      <p>This link is invalid or has expired.</p>
    </div>
  );
}