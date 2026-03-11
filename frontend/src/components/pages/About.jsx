import React from "react";
import PageHead from "../layout/PageHead";
import { getPageConfig } from "../../config/pageConfig";
import "./About.css";

const About = () => {
  const pageData = getPageConfig("about");

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
      <div className="about-content">
        <h4 className="main-heading2">Chi siamo</h4>
        
        <p style={{ textAlign: 'justify' }}>
          PinkCare è il primo portale dedicato alla salute femminile: una piattaforma con la finalità 
          di supportare le Donne nel proprio percorso di <strong>prevenzione</strong>, <strong>benessere</strong> e <strong>cura</strong>.
        </p>
        
        <p style={{ textAlign: 'justify' }}>
          PinkCare è una piattaforma in grado di offrire alle Utenti un servizio di <strong>tutoring personalizzato</strong> 
          in base all'età e alla storia clinica. Registrandosi gratuitamente a PinkCare è possibile ottenere 
          il proprio <strong>Piano di prevenzione</strong> e <strong>cura personalizzato</strong> e ricevere notifiche e aggiornamenti su visite 
          ed esami da effettuare per proteggere la propria salute.
        </p>
        
        <p style={{ textAlign: 'justify' }}> 
          All'interno della propria area personale è possibile archiviare referti, documenti e altre informazioni 
          mediche e trovare gli articoli del blog selezionati in base alla propria fascia d'età e ai propri interessi. 
          La scheda sanitaria online potrà essere condivisa con il proprio specialista di fiducia, in modo da fornire 
          notizie complete circa il proprio stato di salute.
          PinkCare suggerisce gli appuntamenti più importanti per la propria agenda della salute e aiuta a trovare 
          specialisti e strutture per eseguire visite ed esami. Per fornire alle Utenti un elevato standard di qualità 
          delle prestazioni, su PinkCare troverai solo professionisti rispondenti alle procedure di qualità definite dal Comitato scientifico.
        </p>
      </div>
    </>
  );
};

export default About;
