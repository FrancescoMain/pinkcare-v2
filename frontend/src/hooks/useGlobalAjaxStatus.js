import { useState, useCallback, useRef } from 'react';

export const useGlobalAjaxStatus = () => {
  const [isLoading, setIsLoading] = useState(false);
  const requestCounter = useRef(0);

  // onstart - Inizia una richiesta AJAX
  const startRequest = useCallback(() => {
    requestCounter.current += 1;
    if (requestCounter.current === 1) {
      setIsLoading(true);
    }
  }, []);

  // oncomplete - Finisce una richiesta AJAX (successo o errore)
  const completeRequest = useCallback(() => {
    requestCounter.current = Math.max(0, requestCounter.current - 1);
    if (requestCounter.current === 0) {
      setIsLoading(false);
    }
  }, []);

  // onsuccess - Richiesta completata con successo
  const onSuccess = useCallback((response) => {
    completeRequest();
    return response;
  }, [completeRequest]);

  // onerror - Richiesta fallita
  const onError = useCallback((error, onErrorCallback) => {
    completeRequest();
    if (onErrorCallback) {
      onErrorCallback(error);
    }
    throw error;
  }, [completeRequest]);

  // Wrapper per fetch che implementa il ciclo di vita AJAX
  const fetchWithAjaxStatus = useCallback(async (url, options = {}, onErrorCallback = null) => {
    startRequest(); // onstart
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.statusText = response.statusText;
        error.url = url;
        return onError(error, onErrorCallback);
      }
      
      return onSuccess(response); // onsuccess
    } catch (error) {
      return onError(error, onErrorCallback); // onerror
    }
  }, [startRequest, onSuccess, onError]);

  // Wrapper per operazioni asincrone generiche
  const executeWithAjaxStatus = useCallback(async (asyncFn, onErrorCallback = null) => {
    startRequest(); // onstart
    
    try {
      const result = await asyncFn();
      completeRequest(); // onsuccess/oncomplete
      return result;
    } catch (error) {
      return onError(error, onErrorCallback); // onerror
    }
  }, [startRequest, completeRequest, onError]);

  // Metodo per impostare manualmente lo stato di loading
  const setLoadingState = useCallback((loading) => {
    if (loading) {
      startRequest();
    } else {
      completeRequest();
    }
  }, [startRequest, completeRequest]);

  // Reset dello stato (utile per cleanup)
  const resetStatus = useCallback(() => {
    requestCounter.current = 0;
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    requestCount: requestCounter.current,
    fetchWithAjaxStatus,
    executeWithAjaxStatus,
    setLoadingState,
    resetStatus,
    // Metodi di controllo manuale
    startRequest,
    completeRequest
  };
};