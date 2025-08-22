import React from "react";
import "./style.css";
import PageHead from "../../layout/PageHead";
import { getPageConfig } from "../../../config/pageConfig";
import { MainCarousel, NewsCarousel } from "../../Carousel";

const Home = () => {
  const pageData = getPageConfig("home");

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
      <div className="home-page">
        {/* Start Main Container Area */}
        <div className="container main-container" style={{marginTop: '30px'}}>
          <div className="row">
            {/* Start Appointment Image Area */}
            <div className="col-md-6 col-xs-12">
              <MainCarousel />
            </div>
            <div className="col-md-1 col-sm-12 col-xs-12"></div>
            {/* End Appointment Image Area */}
            
            {/* Start Content Area */}
            <div className="col-md-5 col-sm-12 col-xs-12">
              <div>
                <h4 className="main-heading2" style={{marginBottom: '30px'}}>
                  <i className="fas fa-pencil-square-o"></i>
                  Iscriviti*
                </h4>
                <p>*Iscrizione gratuita</p>
                <p>Scopri PinkCare - il portale dedicato alla salute femminile</p>
              </div>
            </div>
            {/* End Content Area */}
          </div>
        </div>
        {/* End Main Container Area */}

        {/* Example News Carousel */}
        <div className="container main-container">
          <div className="row">
            <section className="col-md-8 col-sm-12 col-xs-12">
              <NewsCarousel 
                newsData={[
                  // Example news data - in real app this would come from props/state
                  [
                    {
                      id: 1,
                      headline: "Prevenzione del cancro al seno",
                      text: "Scopri l'importanza della prevenzione...",
                      image: "/styles/public/images/news-post-img-1.png",
                      insertion_date: new Date().toISOString()
                    },
                    {
                      id: 2,
                      headline: "Alimentazione in gravidanza", 
                      text: "Consigli nutrizionali per la gravidanza...",
                      image: "/styles/public/images/news-post-img-2.png",
                      insertion_date: new Date().toISOString()
                    }
                  ]
                ]}
                resourceBundle={{
                  Last_News: "Ultime News",
                  Read_all: "Leggi tutto"
                }}
              />
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
