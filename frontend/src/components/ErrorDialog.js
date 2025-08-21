import React from 'react';
import { useTranslation } from 'react-i18next';
import './ErrorDialog.css';

const ErrorDialog = ({ isOpen, onClose, error }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="error-dialog-overlay" onClick={handleOverlayClick}>
      <div className="error-dialog pnl_dlg" role="dialog" aria-modal="true" aria-labelledby="error-dialog-title">
        <div className="error-dialog-header">
          <h3 id="error-dialog-title">{t('errors.exception_occurred', 'Exception occurred!')}</h3>
          <button 
            className="error-dialog-close" 
            onClick={onClose}
            aria-label="Close dialog"
            type="button"
          >
            ×
          </button>
        </div>
        
        <div className="error-dialog-content">
          <p className="error-message">
            {t('public.system_error', 'Errore di sistema')}!
          </p>
          <br />
          <p className="support-message">
            {t('public.send_a_message_to', 'Invia un messaggio a')} {' '}
            <a href={`mailto:${t('errors.support_email', 'support@t1srl.it')}`}>
              {t('errors.support_email', 'support@t1srl.it')}
            </a>
          </p>
          
          {error && process.env.NODE_ENV === 'development' && (
            <details className="error-details">
              <summary>Dettagli tecnici (solo in sviluppo)</summary>
              <pre>{error.message || JSON.stringify(error, null, 2)}</pre>
            </details>
          )}
        </div>
        
        <div className="error-dialog-footer">
          <button onClick={onClose} className="btn-primary" type="button">
            {t('authentication.ok', 'OK')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDialog;