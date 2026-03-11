import React from 'react';
import AuthenticatedHeader from './AuthenticatedHeader';
import './AuthenticatedLayout.css';

/**
 * AuthenticatedLayout - REPLICA ESATTA del layout standard.xhtml
 * Layout per pagine autenticate con header e contenuto principale
 */
const AuthenticatedLayout = ({ children }) => {
  return (
    <div className="authenticated-layout">
      <AuthenticatedHeader />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default AuthenticatedLayout;
