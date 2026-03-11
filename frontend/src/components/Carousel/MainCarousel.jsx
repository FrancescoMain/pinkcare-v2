import React, { useEffect } from "react";

const MainCarousel = () => {
  useEffect(() => {
    // Initialize Bootstrap carousel if jQuery and Bootstrap are loaded
    if (window.jQuery && window.jQuery.fn.carousel) {
      window.jQuery("#myCarousel").carousel({
        interval: 5000,
      });
    }
  }, []);

  return (
    <>
      <h4 className="main-heading2">
        Con PinkCare potrai ottenere gratuitamente il tuo Piano di prevenzione e
        cura
      </h4>
      {/* Start carousel - IDENTICAL to JSF original */}
      <div id="myCarousel" className="carousel slide" data-ride="carousel">
        {/* Indicators */}
        <ol className="carousel-indicators">
          <li
            data-target="#myCarousel"
            data-slide-to="0"
            className="active"
          ></li>
          <li data-target="#myCarousel" data-slide-to="1"></li>
          <li data-target="#myCarousel" data-slide-to="2"></li>
          <li data-target="#myCarousel" data-slide-to="3"></li>
          <li data-target="#myCarousel" data-slide-to="4"></li>
        </ol>

        {/* Wrapper for slides */}
        <div className="carousel-inner">
          <div className="item active">
            <img
              src="/styles/public/images/slider/slide_pink-care_web-1.jpg"
              alt="PinkCare"
            />
          </div>

          <div className="item">
            <img
              src="/styles/public/images/slider/slide_pink-care_web-2.jpg"
              alt="Programmi di prevenzionale personalizzata"
            />
          </div>

          <div className="item">
            <img
              src="/styles/public/images/slider/slide_pink-care_web-3.jpg"
              alt="Specialisti accreditati pinkcare"
            />
          </div>
          <div className="item">
            <img
              src="/styles/public/images/slider/slide_pink-care_web-4.jpg"
              alt="Salute e benessere al femminile"
            />
          </div>
          <div className="item">
            <img
              src="/styles/public/images/slider/slide_pink-care_web-5.jpg"
              alt="Affilizione specialista"
            />
          </div>
        </div>

        {/* Left and right controls */}
        <a
          className="left carousel-control"
          href="#myCarousel"
          data-slide="prev"
        >
          <span className="glyphicon glyphicon-chevron-left"></span>
          <span className="sr-only">Previous</span>
        </a>
        <a
          className="right carousel-control"
          href="#myCarousel"
          data-slide="next"
        >
          <span className="glyphicon glyphicon-chevron-right"></span>
          <span className="sr-only">Next</span>
        </a>
      </div>
      {/* End carousel */}
    </>
  );
};

export default MainCarousel;
