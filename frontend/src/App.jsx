import React, { useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componenti sempre caricati (layout + globali)
import ErrorDialog from "./components/ErrorDialog";
import LoadingDialog from "./components/LoadingDialog";
import Header from "./components/layout/Header";
import AuthenticatedLayout from "./components/layout/AuthenticatedLayout";
import MainContainer from "./components/layout/MainContainer";
import Footer from "./components/layout/Footer";
import CookieBanner from "./components/CookieBanner";
import ProtectedRoute from "./components/common/ProtectedRoute";
import PageLoader from "./components/PageLoader";
import { AuthProvider } from "./context/AuthContext";
import { useErrorHandler } from "./hooks/useErrorHandler";

// Lazy-loaded page components
const Home = lazy(() => import("./components/pages/Home/Home"));
const About = lazy(() => import("./components/pages/About"));
const Disclosure = lazy(() => import("./components/pages/Disclosure"));
const Accreditation = lazy(() => import("./components/pages/Accreditation"));
const Forum = lazy(() => import("./components/pages/Forum/Forum"));
const Blog = lazy(() => import("./components/pages/Blog/Blog"));
const LoginPage = lazy(() => import("./components/pages/Login/Login"));
const Profile = lazy(() => import("./components/pages/Profile/Profile"));
const Dashboard = lazy(() => import("./components/pages/Dashboard/Dashboard"));
const PasswordRecovery = lazy(() => import("./components/pages/PasswordRecovery"));
const PasswordRecoveryTest = lazy(() => import("./components/pages/PasswordRecoveryTest"));
const Consumer = lazy(() => import("./components/pages/Consumer/Consumer"));
const Hospitalization = lazy(() => import("./components/pages/Hospitalization/Hospitalization"));
const DocumentShop = lazy(() => import("./components/pages/DocumentShop/DocumentShop"));
const Business = lazy(() => import("./components/pages/Business/Business"));

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
  } = errorHandler;

  // Stato utente per gestire login/logout
  const [simulatedUser, setSimulatedUser] = useState(null);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Route standalone senza layout */}
          <Route path="/disclosure" element={<Disclosure />} />
          <Route path="/login/*" element={<LoginPage errorHandler={errorHandler} />} />
          <Route path="/password-recovery-test" element={<PasswordRecoveryTest />} />
          <Route path="/api/auth/password-recovery" element={<PasswordRecovery />} />

          {/* Route autenticate con AuthenticatedLayout */}
          <Route path="/home" element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Profile errorHandler={errorHandler} />
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

          <Route path="/consumer" element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Consumer />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } />

          <Route path="/hospitalization" element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Hospitalization />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } />

          <Route path="/documentshop" element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <DocumentShop />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } />

          <Route path="/business" element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Business />
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
        </Suspense>

        {/* Componenti globali sempre presenti */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
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
