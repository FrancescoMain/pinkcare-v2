import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Growl.css';

// Tipi di severità come PrimeFaces
export const SEVERITY = {
  INFO: 'info',
  SUCCESS: 'success', 
  WARN: 'warn',
  ERROR: 'error'
};

const GrowlMessage = ({ message, onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!message.sticky && message.life > 0) {
      const timer = setTimeout(() => {
        onClose(message.id);
      }, message.life);

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case SEVERITY.INFO:
        return '🔵'; // ℹ️ per info
      case SEVERITY.SUCCESS:
        return '✅'; // ✓ per success
      case SEVERITY.WARN:
        return '⚠️'; // ⚠ per warning
      case SEVERITY.ERROR:
        return '❌'; // ✗ per error
      default:
        return '📢'; // Default
    }
  };

  const getSeverityClass = (severity) => {
    return `growl-message-${severity}`;
  };

  return (
    <div 
      className={`growl-message ${getSeverityClass(message.severity)}`}
      role="alert"
      aria-live={message.severity === SEVERITY.ERROR ? 'assertive' : 'polite'}
    >
      <div className="growl-message-icon">
        {getSeverityIcon(message.severity)}
      </div>
      
      <div className="growl-message-content">
        {message.summary && (
          <div className="growl-message-summary">
            {message.summary}
          </div>
        )}
        {message.detail && (
          <div className="growl-message-detail">
            {message.detail}
          </div>
        )}
      </div>
      
      <button 
        className="growl-message-close"
        onClick={() => onClose(message.id)}
        aria-label="Close message"
        type="button"
      >
        ×
      </button>
    </div>
  );
};

const Growl = ({ messages = [], onRemoveMessage, sticky = true, life = 600000 }) => {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="growl-container" id="msgs">
      {messages.map((message) => (
        <GrowlMessage
          key={message.id}
          message={{
            ...message,
            sticky: message.sticky !== undefined ? message.sticky : sticky,
            life: message.life !== undefined ? message.life : life
          }}
          onClose={onRemoveMessage}
        />
      ))}
    </div>
  );
};

export default Growl;