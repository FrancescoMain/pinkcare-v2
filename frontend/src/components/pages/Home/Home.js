import React from "react";
import "./style.css";
import PageHead from "../../layout/PageHead";
import { getPageConfig } from "../../../config/pageConfig";

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
        <div className="container">
          <h1>Benvenuto su PinkCare</h1>
          <p>Il primo portale dedicato alla salute femminile</p>
        </div>
      </div>
    </>
  );
};

export default Home;
