import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // { message, kind: 'generic' | 'unverified' | 'locked' | 'rate_limited', lockedUntil? }
  const [error, setError] = useState(null);

  // If ProtectedRoute (or similar) redirected here, send the user back after login.
  const redirectTo = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login(username, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err.status === 403) {
        setError({ kind: 'unverified', message: err.message });
      } else if (err.status === 423) {
        setError({
          kind: 'locked',
          message: err.message,
          lockedUntil: err.detail?.locked_until,
        });
      } else if (err.status === 429) {
        setError({ kind: 'rate_limited', message: err.message });
      } else if (err.status === 401) {
        setError({ kind: 'generic', message: 'Incorrect username or password.' });
      } else {
        setError({ kind: 'generic', message: err.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto" style={{ maxWidth: 360 }}>
      <h1>Log in</h1>

      {error && <LoginError error={error} />}

      <form onSubmit={handleSubmit} className="text-start">
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Username</label>
          <input
            id="username"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            id="password"
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="mt-3">
        <Link to="/forgot-password">Forgot your password?</Link>
      </p>
      <p>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

function LoginError({ error }) {
  if (error.kind === 'unverified') {
    return (
      <div className="alert alert-warning" role="alert">
        Check your email to verify your account before logging in.
      </div>
    );
  }
  if (error.kind === 'locked') {
    return (
      <div className="alert alert-danger" role="alert">
        This account is locked
        {error.lockedUntil
          ? ` until ${new Date(error.lockedUntil).toLocaleString()}`
          : ''}
        . Try again later.
      </div>
    );
  }
  if (error.kind === 'rate_limited') {
    return (
      <div className="alert alert-warning" role="alert">
        Too many attempts. Try again shortly.
      </div>
    );
  }
  return (
    <div className="alert alert-danger" role="alert">
      {error.message}
    </div>
  );
}