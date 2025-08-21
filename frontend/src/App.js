import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import About from "./components/pages/About";
import Home from "./components/pages/Home/Home";
import ErrorDialog from "./components/ErrorDialog";
import { useErrorHandler } from "./hooks/useErrorHandler";
import "./App.css";

function App() {
  const { t } = useTranslation();
  const { error, isErrorDialogOpen, showError, hideError, fetchWithErrorHandling } = useErrorHandler();

  // Esempio di funzione che può generare errori per test
  const testError = () => {
    showError(new Error('Test errore - Dialog ErrorDialog funziona!'));
  };

  const testApiError = async () => {
    try {
      // Test con un endpoint che restituisce 404
      await fetchWithErrorHandling('https://httpstat.us/404');
    } catch (error) {
      // L'errore è già gestito da fetchWithErrorHandling
    }
  };

  const testNetworkError = async () => {
    try {
      // Test con un URL inesistente per simulare errore di rete
      await fetchWithErrorHandling('https://thisdomaindoesnotexist12345.com/api/test');
    } catch (error) {
      // L'errore è già gestito da fetchWithErrorHandling
    }
  };

  const testJavaScriptError = () => {
    // Questo genererà un errore JavaScript che verrà catturato automaticamente
    const obj = null;
    obj.nonExistentProperty.someMethod(); // Errore intenzionale
  };

  return (
    <Router>
      <div className="App">
        <nav style={{ padding: "20px", borderBottom: "1px solid #eee" }}>
          <a href="/" style={{ margin: "0 10px" }}>
            {t('standard_public.home', 'Home')}
          </a>
          <a href="/about" style={{ margin: "0 10px" }}>
            {t('standard_public.about_us', 'About')}
          </a>
          
          {/* Pulsanti per testare il dialog degli errori */}
          <div style={{ margin: "10px 0", padding: "10px", backgroundColor: "#f0f0f0" }}>
            <strong>Test ErrorDialog:</strong>
            <button onClick={testError} style={{ margin: "0 5px", padding: "5px 10px" }}>
              Test Errore Manuale
            </button>
            <button onClick={testApiError} style={{ margin: "0 5px", padding: "5px 10px" }}>
              Test 404 Error
            </button>
            <button onClick={testNetworkError} style={{ margin: "0 5px", padding: "5px 10px" }}>
              Test Network Error
            </button>
            <button onClick={testJavaScriptError} style={{ margin: "0 5px", padding: "5px 10px" }}>
              Test JS Error
            </button>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/public" element={<Home />} />
          <Route path="/about" element={<About />} />
          {/* Altre route da aggiungere qui */}
        </Routes>

        {/* Error Dialog - sempre presente per gestire errori globali */}
        <ErrorDialog 
          isOpen={isErrorDialogOpen}
          onClose={hideError}
          error={error}
        />
      </div>
    </Router>
  );
}

export default App;
