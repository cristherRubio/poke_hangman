import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [registered, setRegistered] = useState(null); // holds the created user on success

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError({ kind: 'generic', message: 'Passwords do not match.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register({
        username: form.username,
        email: form.email,
        password: form.password,
      });
      setRegistered(user);
    } catch (err) {
      if (err.status === 429) {
        setError({ kind: 'rate_limited', message: 'Too many attempts. Try again shortly.' });
      } else {
        // 400/422: parseErrorBody already flattens Pydantic's field errors
        // (weak password, taken username, etc.) into err.message.
        setError({ kind: 'generic', message: err.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registered) {
    return (
      <div className="mx-auto" style={{ maxWidth: 360 }}>
        <h1>Check your email</h1>
        <p>
          We sent a verification link to <strong>{registered.email}</strong>.
          Verify your account, then{' '}
          <Link to="/login">log in</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto" style={{ maxWidth: 360 }}>
      <h1>Register</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="text-start">
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Username</label>
          <input
            id="username"
            className="form-control"
            value={form.username}
            onChange={update('username')}
            autoComplete="username"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            id="email"
            type="email"
            className="form-control"
            value={form.email}
            onChange={update('email')}
            autoComplete="email"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            id="password"
            type="password"
            className="form-control"
            value={form.password}
            onChange={update('password')}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            className="form-control"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            autoComplete="new-password"
            required
          />
        </div>
        <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p className="mt-3">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}