import React from 'react';
import PageHead from '../layout/PageHead';
import { getPageConfig } from '../../config/pageConfig';

const About = () => {
  const pageData = getPageConfig('about');

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
      <div className="about-page">
        <div className="container">
          <h1>Chi siamo</h1>
          <p>La piattaforma che supporta le Donne nel proprio percorso di prevenzione e benessere.</p>
          <p>Questa pagina usa font Roboto diversi dalla Home (che usa Open Sans + Lato).</p>
        </div>
      </div>
    </>
  );
};

export default About;