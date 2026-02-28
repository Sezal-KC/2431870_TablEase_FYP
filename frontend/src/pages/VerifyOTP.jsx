import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { handleError, handleSuccess } from '../utils';
import axios from 'axios';
import '../css/verify-Otp.css';

function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // numbers only

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // only last digit
    setOtp(newOtp);

    // Auto-advance to next box
    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // On backspace, clear current and go back
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputs.current[5].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      return handleError('Please enter all 6 digits');
    }
    if (!email) {
      return handleError('Email not found. Please signup again.');
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8080/auth/verify-email', {
        email,
        otp: otpString
      });

      if (res.data.success) {
        handleSuccess('Email verified! You can now login.');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP.';
      handleError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-card">
        <div className="otp-icon">✉️</div>
        <h1>Check your email</h1>
        <p className="otp-subtitle">
          We sent a 6-digit code to<br />
          <strong>{email || 'your email'}</strong>
        </p>
        <p className="otp-hint">Enter the code below to verify your account</p>

        <form onSubmit={handleVerify}>
          <div className="otp-boxes" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                autoFocus={index === 0}
                className={`otp-box ${digit ? 'filled' : ''}`}
              />
            ))}
          </div>

          <button type="submit" className="verify-btn" disabled={loading || otp.join('').length !== 6}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <p className="otp-expiry">⏱ Code expires in 10 minutes</p>
        <p className="otp-resend">
          Didn't receive it? <button className="resend-btn" onClick={() => navigate('/signup')}>Sign up again</button>
        </p>
      </div>
    </div>
  );
}

export default VerifyOTP;