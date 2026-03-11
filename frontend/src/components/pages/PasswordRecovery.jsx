import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../../config/api';

/**
 * Password Recovery Handler Page
 * This component handles password recovery links from emails
 * Format: /api/auth/password-recovery?code=userId$hash
 */
const PasswordRecovery = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Stiamo verificando il link di recupero...');

  useEffect(() => {
    const processRecoveryLink = async () => {
      const code = searchParams.get('code');

      if (!code) {
        setStatus('error');
        setMessage('Link di recupero non valido');
        setTimeout(() => navigate('/login?res=-1'), 3000);
        return;
      }

      try {
        console.log('[PasswordRecovery] Processing recovery code:', code);
        console.log('[PasswordRecovery] API_URL:', API_URL);

        const backendUrl = `${API_URL}/api/auth/password-recovery?code=${encodeURIComponent(code)}`;
        console.log('[PasswordRecovery] Calling backend URL:', backendUrl);

        // Call the backend API endpoint
        const response = await fetch(backendUrl, {
          method: 'GET',
          redirect: 'follow' // Follow redirects
        });

        console.log('[PasswordRecovery] Response status:', response.status);
        console.log('[PasswordRecovery] Response type:', response.type);

        // Check if the response is a redirect
        if (response.type === 'opaqueredirect' || response.status === 0) {
          // The backend sent a redirect, follow it
          setStatus('success');
          setMessage('Recupero password completato! Reindirizzamento...');
          setTimeout(() => navigate('/login?res=0'), 2000);
          return;
        }

        // For non-redirect responses, check the status
        if (response.ok) {
          setStatus('success');
          setMessage('Recupero password completato! Reindirizzamento al login...');
          setTimeout(() => navigate('/login?res=0'), 2000);
        } else {
          // Get error code from response or default to -1
          const errorCode = response.status === 404 ? -2 : -1;
          setStatus('error');
          setMessage('Si è verificato un errore durante il recupero della password');
          setTimeout(() => navigate(`/login?res=${errorCode}`), 3000);
        }
      } catch (error) {
        console.error('[PasswordRecovery] Error processing recovery link:', error);
        setStatus('error');
        setMessage('Si è verificato un errore durante il recupero della password');
        setTimeout(() => navigate('/login?res=-1'), 3000);
      }
    };

    processRecoveryLink();
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#fcedf5',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '40px',
        maxWidth: '500px',
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {status === 'processing' && (
          <>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #e42080',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </>
        )}

        {status === 'success' && (
          <div style={{
            fontSize: '50px',
            color: '#4CAF50',
            marginBottom: '20px'
          }}>✓</div>
        )}

        {status === 'error' && (
          <div style={{
            fontSize: '50px',
            color: '#f44336',
            marginBottom: '20px'
          }}>✗</div>
        )}

        <h2 style={{
          color: '#333',
          marginBottom: '15px',
          fontSize: '24px'
        }}>
          {status === 'processing' && 'Recupero Password'}
          {status === 'success' && 'Successo!'}
          {status === 'error' && 'Errore'}
        </h2>

        <p style={{
          color: '#666',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default PasswordRecovery;
