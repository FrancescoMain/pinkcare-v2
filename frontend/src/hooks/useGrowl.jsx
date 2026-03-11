import { useState, useCallback } from 'react';
import { SEVERITY } from '../components/Growl';

let messageIdCounter = 0;

export const useGrowl = () => {
  const [messages, setMessages] = useState([]);

  // Funzione per aggiungere un messaggio (equivalente a FacesContext.addMessage)
  const addMessage = useCallback((severity, summary, detail, options = {}) => {
    console.log('[useGrowl] addMessage called', { severity, summary, detail, options });
    const message = {
      id: ++messageIdCounter,
      severity: severity || SEVERITY.INFO,
      summary: summary || '',
      detail: detail || '',
      timestamp: new Date().toISOString(),
      sticky: options.sticky,
      life: options.life,
      ...options
    };
    console.log('[useGrowl] Message created:', message);

    setMessages(prev => {
      console.log('[useGrowl] setMessages - prev:', prev);
      const newMessages = [...prev, message];
      console.log('[useGrowl] setMessages - new:', newMessages);
      return newMessages;
    });
    return message.id;
  }, []);

  // Funzioni di convenienza per ogni tipo di messaggio (come PrimeFaces)
  const addInfoMessage = useCallback((summary, detail, options) => {
    return addMessage(SEVERITY.INFO, summary, detail, options);
  }, [addMessage]);

  const addSuccessMessage = useCallback((summary, detail, options) => {
    return addMessage(SEVERITY.SUCCESS, summary, detail, options);
  }, [addMessage]);

  const addWarnMessage = useCallback((summary, detail, options) => {
    return addMessage(SEVERITY.WARN, summary, detail, options);
  }, [addMessage]);

  const addErrorMessage = useCallback((summary, detail, options) => {
    return addMessage(SEVERITY.ERROR, summary, detail, options);
  }, [addMessage]);

  // Rimuove un messaggio specifico
  const removeMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // Rimuove tutti i messaggi
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Rimuove tutti i messaggi di una severità specifica
  const clearMessagesBySeverity = useCallback((severity) => {
    setMessages(prev => prev.filter(msg => msg.severity !== severity));
  }, []);

  // Trova messaggi per criterio
  const findMessages = useCallback((predicate) => {
    return messages.filter(predicate);
  }, [messages]);

  // Verifica se ci sono messaggi di una certa severità
  const hasMessagesOfSeverity = useCallback((severity) => {
    return messages.some(msg => msg.severity === severity);
  }, [messages]);

  // Conta messaggi per severità
  const getMessageCount = useCallback((severity) => {
    if (severity) {
      return messages.filter(msg => msg.severity === severity).length;
    }
    return messages.length;
  }, [messages]);

  return {
    // State
    messages,
    
    // Funzioni principali
    addMessage,
    removeMessage,
    clearMessages,
    
    // Funzioni di convenienza
    addInfoMessage,
    addSuccessMessage, 
    addWarnMessage,
    addErrorMessage,
    
    // Funzioni di utilità
    clearMessagesBySeverity,
    findMessages,
    hasMessagesOfSeverity,
    getMessageCount,
    
    // Alias per compatibilità con naming PrimeFaces
    showInfoMessage: addInfoMessage,
    showSuccessMessage: addSuccessMessage,
    showWarnMessage: addWarnMessage,
    showErrorMessage: addErrorMessage,
    
    // Stato di utilità
    hasMessages: messages.length > 0,
    hasErrors: messages.some(msg => msg.severity === SEVERITY.ERROR),
    hasWarnings: messages.some(msg => msg.severity === SEVERITY.WARN),
    hasInfo: messages.some(msg => msg.severity === SEVERITY.INFO),
    hasSuccess: messages.some(msg => msg.severity === SEVERITY.SUCCESS)
  };
};