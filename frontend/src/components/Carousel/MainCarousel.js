import React from "react";
import Carousel from "./Carousel";

const MainCarousel = () => {
  const slides = [
    {
      src: "/styles/public/images/slider/slide_pink-care_web-1.jpg",
      alt: "PinkCare",
    },
    {
      src: "/styles/public/images/slider/slide_pink-care_web-2.jpg",
      alt: "Programmi di prevenzionale personalizzata",
    },
    {
      src: "/styles/public/images/slider/slide_pink-care_web-3.jpg",
      alt: "Specialisti accreditati pinkcare",
    },
    {
      src: "/styles/public/images/slider/slide_pink-care_web-4.jpg",
      alt: "Salute e benessere al femminile",
    },
    {
      src: "/styles/public/images/slider/slide_pink-care_web-5.jpg",
      alt: "Affilizione specialista",
    },
  ];

  return (
    <>
      <h4 className="main-heading2">
        Con PinkCare potrai ottenere gratuitamente il tuo Piano di prevenzione e
        cura
      </h4>
      <Carousel
        items={slides}
        autoPlay={true}
        interval={5000}
        showIndicators={true}
        showControls={true}
        className="main-carousel"
      />
    </>
  );
};

export default MainCarousel;
