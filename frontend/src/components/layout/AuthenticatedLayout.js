import React from 'react';
import AuthenticatedHeader from './AuthenticatedHeader';
import './AuthenticatedLayout.css';

/**
 * AuthenticatedLayout
 * Layout per pagine autenticate con header (senza footer)
 */
const AuthenticatedLayout = ({ children }) => {
  return (
    <div className="authenticated-layout">
      <AuthenticatedHeader />
      <main className="main-content">
        <div className="container-fluid">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AuthenticatedLayout;
