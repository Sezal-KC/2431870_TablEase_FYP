import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { handleSuccess, handleError } from '../utils';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasVerified = useRef(false); // 🔐 prevents double call

  useEffect(() => {
    if (hasVerified.current) return; // ⛔ stop second execution
    hasVerified.current = true;

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      handleError('Invalid verification link');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/auth/verify-email?token=${token}&email=${email}`
        );
        const result = await response.json();

        if (result.success) {
          handleSuccess(
            'Email verified successfully! You can now log in using your email and password.'
          );
          setTimeout(() => navigate('/login'), 2000);
        } else {
          handleError(result.message || 'Verification failed');
        }
      } catch (err) {
        handleError('Verification failed. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: '80px' }}>
      <h2>Verifying your email...</h2>
      <p>Please wait while we activate your account.</p>
    </div>
  );
}

export default VerifyEmail;
