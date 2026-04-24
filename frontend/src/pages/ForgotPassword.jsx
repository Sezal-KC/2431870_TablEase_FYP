import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { handleSuccess, handleError } from '../utils';
import { ToastContainer } from 'react-toastify';
import axios from 'axios';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return handleError('Please enter your email');

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8080/auth/forgot-password', { email });
      if (res.data.success) {
        setSent(true);
        handleSuccess('Reset link sent! Check your email.');
      }
    } catch (err) {
      handleError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Forgot Password</h1>

        {!sent ? (
          <>
            <p style={{ color: '#888', marginBottom: '24px', fontSize: '0.9rem' }}>
              Enter your registered email and we'll send you a password reset link.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="submit-btn"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📧</div>
            <h3 style={{ color: '#27ae60', marginBottom: '8px' }}>Email Sent!</h3>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>
              Check your email for the password reset link. It expires in 15 minutes.
            </p>
          </div>
        )}

        <p className="switch-link" style={{ marginTop: '20px' }}>
          Remember your password? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;