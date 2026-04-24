import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { handleSuccess, handleError } from '../utils';
import axios from 'axios';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.password || !form.confirmPassword) return handleError('All fields are required');
    if (form.password !== form.confirmPassword) return handleError('Passwords do not match');
    if (form.password.length < 6) return handleError('Password must be at least 6 characters');

    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:8080/auth/reset-password/${token}`, form);
      if (res.data.success) {
        handleSuccess('Password reset successful!');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed. Link may have expired.';
      handleError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Reset Password</h1>
        <p style={{ color: '#888', marginBottom: '24px', fontSize: '0.9rem' }}>
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group password-group">
            <label>New Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Enter new password"
                required
                autoFocus
              />
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;