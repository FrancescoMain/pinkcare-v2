import React from 'react';

const PageLoader = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '28px',
  }}>
    {/* Spinner con doppio anello */}
    <div style={{ position: 'relative', width: '56px', height: '56px' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        border: '3px solid #f3e8ef',
        borderTop: '3px solid #e42080',
        borderRadius: '50%',
        animation: 'pageLoaderSpin 0.8s linear infinite',
      }} />
      <div style={{
        position: 'absolute',
        inset: '8px',
        border: '3px solid #f3e8ef',
        borderBottom: '3px solid #e42080',
        borderRadius: '50%',
        animation: 'pageLoaderSpin 1.2s linear infinite reverse',
      }} />
    </div>

    {/* Testo brand */}
    <div style={{
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      fontSize: '14px',
      fontWeight: 300,
      letterSpacing: '3px',
      textTransform: 'uppercase',
      color: '#e42080',
      animation: 'pageLoaderFade 1.5s ease-in-out infinite',
    }}>
      PinkCare
    </div>

    <style>{`
      @keyframes pageLoaderSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes pageLoaderFade {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
    `}</style>
  </div>
);

export default PageLoader;
