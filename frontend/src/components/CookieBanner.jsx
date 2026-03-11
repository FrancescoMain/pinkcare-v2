import React, { useState, useEffect } from 'react';
import './CookieBanner.css';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Controlla se l'utente ha già accettato i cookie
    const cookieAllowed = localStorage.getItem('cookieAllowed');
    if (!cookieAllowed) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    // Salva l'accettazione dei cookie per 365 giorni (simulando $.cookie)
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    localStorage.setItem('cookieAllowed', '1');
    localStorage.setItem('cookieAcceptedDate', expirationDate.toISOString());
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div id="wt-cookie-banner">
      <p>
        Utilizzando questo sito Web, accetti il ​​nostro utilizzo dei cookie. 
        Utilizziamo i cookie per offrirti un'esperienza eccezionale e per aiutare 
        il nostro sito Web a funzionare in modo efficace.
      </p>
      <button id="wt-cookie-accept-btn" onClick={acceptCookies}>
        Okay
      </button>
    </div>
  );
};

export default CookieBanner;