import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-content">
      <h4 className="main-heading2">Privacy Policy</h4>

      <div style={{ textAlign: 'justify' }}>
        <p>
          <strong>INFORMATIVA SUL TRATTAMENTO DEI DATI PERSONALI</strong>
        </p>

        <p>
          La presente informativa è resa ai sensi dell'art. 13 del Regolamento (UE) 2016/679
          (di seguito "GDPR") e s.m.i. e illustra le modalità del trattamento dei dati personali
          degli utenti che consultano il presente sito web.
        </p>

        <p>
          <strong>Titolare del trattamento</strong><br/>
          Il titolare del trattamento dei dati personali è PinkCare con sede in Piazza Stazione, 2 - 50123 Firenze.
        </p>

        <p>
          <strong>Tipologie di dati trattati</strong><br/>
          I dati personali trattati attraverso il presente sito web sono quelli forniti
          volontariamente dall'utente attraverso la compilazione dei moduli di registrazione
          e di contatto presenti sul sito.
        </p>

        <p>
          <strong>Finalità del trattamento</strong><br/>
          I dati personali sono trattati per le seguenti finalità:
        </p>
        <ul>
          <li>Gestione delle registrazioni e dei servizi richiesti</li>
          <li>Comunicazioni relative ai servizi sanitari</li>
          <li>Invio di newsletter e comunicazioni promozionali (previo consenso)</li>
          <li>Adempimenti di obblighi di legge</li>
        </ul>

        <p>
          <strong>Diritti dell'interessato</strong><br/>
          L'interessato ha diritto di chiedere al titolare del trattamento l'accesso ai dati personali,
          la rettifica o la cancellazione degli stessi, la limitazione del trattamento,
          la portabilità dei dati e di opporsi al trattamento.
        </p>

        <p>
          Per ulteriori informazioni o per esercitare i propri diritti,
          è possibile contattare il titolare all'indirizzo email: info@pinkcare.it
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;