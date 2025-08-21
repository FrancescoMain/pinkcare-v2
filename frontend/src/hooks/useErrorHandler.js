import { useState, useCallback, useEffect } from 'react';

export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  const showError = useCallback((errorObj) => {
    console.error('Application Error:', errorObj);
    
    // Normalizza l'errore in un oggetto standard
    const normalizedError = {
      message: errorObj?.message || errorObj?.toString() || 'Errore sconosciuto',
      stack: errorObj?.stack,
      name: errorObj?.name,
      timestamp: new Date().toISOString(),
      ...errorObj
    };
    
    setError(normalizedError);
    setIsErrorDialogOpen(true);
  }, []);

  const hideError = useCallback(() => {
    setIsErrorDialogOpen(false);
    setError(null);
  }, []);

  // Wrapper per funzioni async che gestisce automaticamente gli errori
  const handleAsyncError = useCallback((asyncFn) => {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        showError(error);
        throw error; // Re-throw per permettere gestione locale se necessaria
      }
    };
  }, [showError]);

  // Wrapper per chiamate API
  const fetchWithErrorHandling = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.statusText = response.statusText;
        error.url = url;
        throw error;
      }
      
      return response;
    } catch (error) {
      showError(error);
      throw error;
    }
  }, [showError]);

  // Gestione errori globali JavaScript
  useEffect(() => {
    const handleGlobalError = (event) => {
      const error = {
        message: event.error?.message || event.message || 'Errore JavaScript non gestito',
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript_error'
      };
      showError(error);
    };

    const handleUnhandledRejection = (event) => {
      const error = {
        message: event.reason?.message || 'Promise rifiutata non gestita',
        stack: event.reason?.stack,
        reason: event.reason,
        type: 'unhandled_promise_rejection'
      };
      showError(error);
      event.preventDefault(); // Previene il log dell'errore nel console
    };

    // Aggiungi listeners solo se non sono già presenti
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [showError]);

  return {
    error,
    isErrorDialogOpen,
    showError,
    hideError,
    handleAsyncError,
    fetchWithErrorHandling
  };
};