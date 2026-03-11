import React, { useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import './Forum.css';

/**
 * Forum Component
 * Replica esatta di pinkcare/WEB-INF/flows/forum/forum.xhtml
 * Embed WebsiteToolbox Forum con autenticazione
 */
const Forum = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Cleanup function per rimuovere script precedente
    return () => {
      const existingScript = document.getElementById('embedded_forum');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Genera authtoken per WebsiteToolbox (se user è loggato)
    // TODO: il backend dovrebbe generare il token per WebsiteToolbox
    const authtoken = user ? `user=${user.email}` : '';

    // Rimuovi script esistente
    const existingScript = document.getElementById('embedded_forum');
    if (existingScript) {
      existingScript.remove();
    }

    // Aggiungi script WebsiteToolbox
    const script = document.createElement('script');
    script.id = 'embedded_forum';
    script.type = 'text/javascript';
    script.src = `https://forums.pinkcare.it/js/mb/embed.js?authtoken=${authtoken}`;
    script.async = true;

    const container = document.getElementById('wtEmbedCode');
    if (container) {
      container.appendChild(script);
    }

  }, [user]);

  return (
    <div className="forum-page">
      <div className="container">
        {/* Begin Website Toolbox Forum Embed Code */}
        <div id="wtEmbedCode" className="forum-embed-container">
          {/* Script will be injected here */}
          <noscript>
            <a href="https://forums.pinkcare.it/">PINKCARE Forum</a>
          </noscript>
        </div>
        {/* End Website Toolbox Forum Embed Code */}
      </div>
    </div>
  );
};

export default Forum;
