import React from "react";
import "./style.css";
import PageHead from "../../layout/PageHead";
import { getPageConfig } from "../../../config/pageConfig";
import { MainCarousel } from "../../Carousel";

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
        <MainCarousel />
      </div>
    </>
  );
};

export default Home;
