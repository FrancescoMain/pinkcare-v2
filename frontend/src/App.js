import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import About from "./components/pages/About";
import Home from "./components/pages/Home/Home";
import Disclosure from "./components/pages/Disclosure";
import Accreditation from "./components/pages/Accreditation";
import Forum from "./components/pages/Forum/Forum";
import Dashboard from "./components/pages/Dashboard/Dashboard";
import Blog from "./components/pages/Blog/Blog";
import ErrorDialog from "./components/ErrorDialog";
import LoadingDialog from "./components/LoadingDialog";
import Growl from "./components/Growl";
import Header from "./components/layout/Header";
import AuthenticatedLayout from "./components/layout/AuthenticatedLayout";
import MainContainer from "./components/layout/MainContainer";
import Footer from "./components/layout/Footer";
import CookieBanner from "./components/CookieBanner";
import LoginPage from "./components/pages/Login/Login";
import Profile from "./components/pages/Profile/Profile";
import PasswordRecovery from "./components/pages/PasswordRecovery";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { useErrorHandler } from "./hooks/useErrorHandler";
// Importa stili globali PinkCare - DEVE essere caricato per ultimo
import "./styles/global.css";

function App() {
  const { t } = useTranslation();
  const errorHandler = useErrorHandler();
  const {
    error,
    isErrorDialogOpen,
    isLoading,
    hideError,
    growlMessages,
    removeGrowlMessage,
  } = errorHandler;


  // Stato utente per gestire login/logout
  const [simulatedUser, setSimulatedUser] = useState(null);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
        <Routes>
          {/* Route standalone senza layout */}
          <Route path="/disclosure" element={<Disclosure />} />
          <Route path="/login/*" element={<LoginPage errorHandler={errorHandler} />} />
          <Route path="/api/auth/password-recovery" element={<PasswordRecovery />} />

          {/* Route autenticate con AuthenticatedLayout */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } />

          <Route path="/forum" element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Forum />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } />

          <Route path="/blog" element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Blog />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } />

          {/* Route con layout completo */}
          <Route path="/*" element={
            <>
              {/* Header PinkCare con login - replica del layout JSF */}
              <Header userVO={simulatedUser} />

              {/* Main Container Area - replica del layout JSF */}
              <MainContainer userVO={simulatedUser} errorHandler={errorHandler}>
                <Routes>
                  <Route path="/" element={<Home userVO={simulatedUser} errorHandler={errorHandler} />} />
                  <Route path="/public" element={<Home userVO={simulatedUser} errorHandler={errorHandler} />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/accreditation" element={<Accreditation />} />
                  <Route path="/forum" element={<Forum />} />

                  {/* Protected routes - TEMPORANEAMENTE disabilitate */}
                  {/* <Route path="/profile" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } /> */}

                  {/* Altre route da aggiungere qui */}
                </Routes>
              </MainContainer>

              {/* Footer PinkCare - replica del footer standard_public.xhtml */}
              <Footer />
            </>
          } />
        </Routes>

        {/* Componenti globali sempre presenti */}
        <Growl
          messages={growlMessages}
          onRemoveMessage={removeGrowlMessage}
          sticky={true}
          life={600000}
        />

        <LoadingDialog isOpen={isLoading} />

        <ErrorDialog
          isOpen={isErrorDialogOpen}
          onClose={hideError}
          error={error}
        />

        <CookieBanner />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
