import React from 'react';
import { useTranslation } from 'react-i18next';
import './LoadingDialog.css';

const LoadingDialog = ({ isOpen }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="loading-dialog-overlay">
      <div className="loading-dialog pnl_dlg" role="dialog" aria-modal="true" aria-labelledby="loading-dialog-title">
        <div className="loading-dialog-content">
          <img 
            src="/styles/public/images/ajax-loader.gif" 
            alt="Loading..." 
            className="loading-gif"
            onError={(e) => {
              // Fallback alla GIF alternativa se ajax-loader.gif non funziona
              e.target.src = "/styles/public/images/loader.gif";
              e.target.onerror = () => {
                // Se anche quella fallisce, mostra il CSS spinner
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              };
            }}
          />
          <div className="loading-spinner css-fallback" style={{ display: 'none' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingDialog;