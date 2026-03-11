import React from "react";
import PageHead from "../layout/PageHead";
import { getPageConfig } from "../../config/pageConfig";
import "./Accreditation.css";

const Accreditation = () => {
  const pageData = getPageConfig("accreditation");

  return (
    <>
      <PageHead
        title={pageData.title}
        description={pageData.description}
        keywords={pageData.keywords}
        author={pageData.author}
        ogType="website"
        themeColor="#e42080"
        links={pageData.links || []}
      />
      <div className="accreditation-content">
        {/* Start accreditation content */}
        <h4>Requisiti d'iscrizione per i professionisti a PinkCare</h4>
        <p style={{ textAlign: 'justify' }}>
          PinkCare è un portale dedicato alla prevenzione e cura della Donna. 
          Il portale è aperto alle strutture e ai professionisti delle seguenti specialità mediche: Dermatologia, Endocrinologia, Chirurgia generale, Ginecologia, Diagnostica Per Immagini, Medicina Generale, Senologia, Gastroenterologia, Endocrinologia.
          Al fine di garantire uno standard elevato di servizio alle Utenti, PinkCare è dotato di un Comitato scientifico che ha definito gli standard di qualità delle prestazioni che i professionisti e le strutture devono possedere per iscriversi al portale.
          L'iscrizione dei professionisti al portale è soggetta alla validazione da parte dell'organizzazione PinkCare. I Professionisti e le strutture possono effettuare in autonomia l'iscrizione e gestire la propria scheda online, ma la pubblicazione della stessa e ogni relativa modifica verrà autorizzata dai gestori del portale. 
        </p>
        
        <h4>Requisiti e richieste:</h4>
        <p>Il Professionista che si iscrive a PinkCare autocertifica di possedere i seguenti requisiti:</p>
        <ul>
          <li>Spazio ambulatori &gt; 40 mq e sala d'attesa adeguata;</li>
          <li>Sistema interno di rilevazione delle opinioni dei Pazienti</li>
          <li>Locale autorizzato</li>
          <li>Rispetto delle procedure sulla sicurezza del dato</li>
          <li>Presenza di un deposito farmaceutico per la corretta conservazione dei medicinali</li>
          <li>Attività di sterilizzazione della strumentazione diagnostica</li>
          <li>Tecnologie diagnostiche all'avanguardia o comunque non antecedenti gli 8 anni</li>
        </ul>
        {/* End accreditation content */}
      </div>
    </>
  );
};

export default Accreditation;