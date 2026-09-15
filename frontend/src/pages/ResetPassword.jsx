import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [succeeded, setSucceeded] = useState(false);

  if (!token) {
    return (
      <div className="mx-auto" style={{ maxWidth: 360 }}>
        <h1>Invalid link</h1>
        <p>This password reset link is missing its token.</p>
        <p>
          <Link to="/forgot-password">Request a new one</Link>
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setSucceeded(true);
    } catch (err) {
      if (err.status === 400) {
        // Invalid or expired token
        setError(err.message || 'This reset link is invalid or has expired.');
      } else {
        // 422: weak password, etc. - already flattened by parseErrorBody
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (succeeded) {
    return (
      <div className="mx-auto" style={{ maxWidth: 360 }}>
        <h1>Password updated</h1>
        <p>You can now log in with your new password.</p>
        <p>
          <Link to="/login">Log in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto" style={{ maxWidth: 360 }}>
      <h1>Reset password</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          {error.toLowerCase().includes('expired') && (
            <>
              {' '}
              <Link to="/forgot-password">Request a new link</Link>.
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="text-start">
        <div className="mb-3">
          <label htmlFor="newPassword" className="form-label">New password</label>
          <input
            id="newPassword"
            type="password"
            className="form-control"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  );
}