import React from 'react';
import { useNavigate } from 'react-router-dom';

function EsewaFailure() {
  const navigate = useNavigate();

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
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❌</div>
        <h2 style={{ color: '#e74c3c' }}>Payment Failed</h2>
        <p style={{ color: '#888' }}>Your eSewa payment was cancelled or failed</p>
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
      </div>
    </div>
  );
}

export default EsewaFailure;