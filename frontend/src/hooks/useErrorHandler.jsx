import { useState, useCallback, useEffect } from 'react';
import { useGlobalAjaxStatus } from './useGlobalAjaxStatus';
import { toast } from 'react-toastify';

export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const {
    isLoading,
    fetchWithAjaxStatus,
    executeWithAjaxStatus,
    setLoadingState,
    resetStatus
  } = useGlobalAjaxStatus();


  const showError = useCallback((errorObj, options = {}) => {
    console.error('Application Error:', errorObj);
    
    // Normalizza l'errore in un oggetto standard
    const normalizedError = {
      message: errorObj?.message || errorObj?.toString() || 'Errore sconosciuto',
      stack: errorObj?.stack,
      name: errorObj?.name,
      timestamp: new Date().toISOString(),
      ...errorObj
    };
    
    // Mostra toast error se richiesto
    if (options.showToast !== false) {
      toast.error(`Errore di sistema: ${normalizedError.message}`);
    }
    
    // Mostra dialog solo per errori critici o se esplicitamente richiesto
    if (options.showDialog !== false) {
      setError(normalizedError);
      setIsErrorDialogOpen(true);
    }
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

  // Wrapper per chiamate API con gestione loading e errori
  const fetchWithErrorHandling = useCallback(async (url, options = {}) => {
    return await fetchWithAjaxStatus(url, options, showError);
  }, [fetchWithAjaxStatus, showError]);

  // Wrapper per operazioni asincrone con gestione loading e errori
  const executeWithErrorHandling = useCallback(async (asyncFn) => {
    return await executeWithAjaxStatus(asyncFn, showError);
  }, [executeWithAjaxStatus, showError]);

  // Gestione errori globali JavaScript
  useEffect(() => {
    const handleGlobalError = (event) => {
      console.error('[GLOBAL ERROR HANDLER]', event);
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
      console.error('[UNHANDLED REJECTION]', event.reason);
      const error = {
        message: event.reason?.message || 'Promise rifiutata non gestita',
        stack: event.reason?.stack,
        reason: event.reason,
        type: 'unhandled_promise_rejection'
      };
      showError(error);
      // TEMPORANEAMENTE COMMENTO PER VEDERE L'ERRORE ORIGINALE
      // event.preventDefault(); // Previene il log dell'errore nel console
    };

    // Aggiungi listeners solo se non sono già presenti
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [showError]);

  // Funzioni per messaggi toast con react-toastify (come JSF FacesContext.addMessage)
  const showSuccessMessage = useCallback((summary, detail, options) => {
    const message = detail ? `${summary}: ${detail}` : summary;
    toast.success(message, options);
  }, []);

  const showInfoMessage = useCallback((summary, detail, options) => {
    const message = detail ? `${summary}: ${detail}` : summary;
    toast.info(message, options);
  }, []);

  const showWarnMessage = useCallback((summary, detail, options) => {
    const message = detail ? `${summary}: ${detail}` : summary;
    toast.warning(message, options);
  }, []);

  const showErrorMessage = useCallback((summary, detail, options) => {
    const message = detail ? `${summary}: ${detail}` : summary;
    toast.error(message, options);
  }, []);

  return {
    // Error handling
    error,
    isErrorDialogOpen,
    showError,
    hideError,
    handleAsyncError,

    // Ajax status handling
    isLoading,
    fetchWithErrorHandling,
    executeWithErrorHandling,
    setLoadingState,
    resetStatus,

    // Toast messages con react-toastify (equivalente a FacesContext.addMessage)
    showSuccessMessage,
    showInfoMessage,
    showWarnMessage,
    showErrorMessage,
  };
};