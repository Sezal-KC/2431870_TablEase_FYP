import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:8080';

function EsewaSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // eSewa sends response as base64 encoded data param
        const data = searchParams.get('data');
        if (!data) {
          setStatus('failed');
          return;
        }

        // Decode base64 response
        const decoded = JSON.parse(atob(data));
        console.log('eSewa response:', decoded);

        if (decoded.status !== 'COMPLETE') {
          setStatus('failed');
          return;
        }

        // Get stored order info from localStorage
        const pendingPayment = JSON.parse(localStorage.getItem('pendingEsewaPayment') || '{}');

        // Verify with backend
        const res = await axios.post(`${API}/api/payments/esewa/verify`, {
          orderId: pendingPayment.orderId,
          totalAmount: decoded.total_amount,
          transactionUuid: decoded.transaction_uuid,
          transactionCode: decoded.transaction_code,
          status: decoded.status
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (res.data.success) {
          localStorage.removeItem('pendingEsewaPayment');
          setStatus('success');
          setTimeout(() => navigate('/cashier-dashboard'), 6000);
        } else {
          setStatus('failed');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('failed');
      }
    };

    verifyPayment();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fdf6f0',
      fontFamily: 'Segoe UI, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '48px',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '90%'
      }}>
        {status === 'verifying' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
            <h2 style={{ color: '#333' }}>Verifying Payment...</h2>
            <p style={{ color: '#888' }}>Please wait while we confirm your payment</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
            <h2 style={{ color: '#27ae60' }}>Payment Successful!</h2>
            <p style={{ color: '#555' }}>Payment verified successfully via eSewa</p>
            <p style={{ color: '#888', fontSize: '0.85rem' }}>Redirecting to dashboard in 5 seconds...</p>
            <div style={{ marginTop: '16px' }}>
              <button
                onClick={() => navigate('/cashier-dashboard')}
                style={{
                  padding: '10px 24px',
                  background: '#60bb46',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Go to Dashboard Now
              </button>
            </div>
          </>
        )}
        {status === 'failed' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❌</div>
            <h2 style={{ color: '#e74c3c' }}>Payment Failed</h2>
            <p style={{ color: '#888' }}>Payment could not be verified</p>
            <button
              onClick={() => navigate('/cashier-dashboard')}
              style={{
                marginTop: '16px',
                padding: '12px 24px',
                background: '#ff8c42',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Back to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default EsewaSuccess;