import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import About from "./components/pages/About";
import Home from "./components/pages/Home/Home";
import ErrorDialog from "./components/ErrorDialog";
import LoadingDialog from "./components/LoadingDialog";
import Growl from "./components/Growl";
import Header from "./components/layout/Header";
import MainContainer from "./components/layout/MainContainer";
import Footer from "./components/layout/Footer";
import CookieBanner from "./components/CookieBanner";
import { useErrorHandler } from "./hooks/useErrorHandler";
// Importa stili globali PinkCare
import "./styles/global.css";

function App() {
  const { t } = useTranslation();
  const {
    error,
    isErrorDialogOpen,
    isLoading,
    hideError,
    growlMessages,
    removeGrowlMessage,
  } = useErrorHandler();


  // Stato utente per gestire login/logout
  const [simulatedUser, setSimulatedUser] = useState(null);

  return (
    <Router>
      <div className="App">
        {/* Header PinkCare con login - replica del layout JSF */}
        <Header userVO={simulatedUser} />


        {/* Main Container Area - replica del layout JSF */}
        <MainContainer userVO={simulatedUser}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/public" element={<Home />} />
            <Route path="/about" element={<About />} />
            {/* Altre route da aggiungere qui */}
          </Routes>
        </MainContainer>

        {/* Footer PinkCare - replica del footer standard_public.xhtml */}
        <Footer />

        {/* Growl Messages - equivalente a <p:growl> PrimeFaces */}
        <Growl
          messages={growlMessages}
          onRemoveMessage={removeGrowlMessage}
          sticky={true}
          life={600000}
        />

        {/* Loading Dialog - equivalente a statusDialog PrimeFaces */}
        <LoadingDialog isOpen={isLoading} />

        {/* Error Dialog - equivalente a exceptionDialog PrimeFaces */}
        <ErrorDialog
          isOpen={isErrorDialogOpen}
          onClose={hideError}
          error={error}
        />

        {/* Cookie Banner - replica del wt-cookie-banner */}
        <CookieBanner />
      </div>
    </Router>
  );
}

export default App;
