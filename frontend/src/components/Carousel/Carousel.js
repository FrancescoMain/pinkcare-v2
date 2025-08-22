import React, { useState, useEffect } from 'react';
import './Carousel.css';

const Carousel = ({ 
  items = [], 
  autoPlay = true, 
  interval = 5000, 
  showIndicators = true, 
  showControls = true,
  className = '',
  renderItem
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, interval);
    
    return () => clearInterval(timer);
  }, [autoPlay, interval, items.length]);
  
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };
  
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? items.length - 1 : prevIndex - 1
    );
  };
  
  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };
  
  if (!items.length) return null;
  
  return (
    <div className={`carousel slide ${className}`} data-ride="carousel">
      {/* Indicators */}
      {showIndicators && items.length > 1 && (
        <ol className="carousel-indicators">
          {items.map((_, index) => (
            <li
              key={index}
              className={index === currentIndex ? 'active' : ''}
              onClick={() => goToSlide(index)}
            />
          ))}
        </ol>
      )}
      
      {/* Carousel Inner */}
      <div className="carousel-inner">
        {items.map((item, index) => (
          <div
            key={index}
            className={`item ${index === currentIndex ? 'active' : ''}`}
          >
            {renderItem ? renderItem(item, index) : (
              <img src={item.src || item} alt={item.alt || `Slide ${index + 1}`} />
            )}
          </div>
        ))}
      </div>
      
      {/* Controls */}
      {showControls && items.length > 1 && (
        <>
          <a 
            className="left carousel-control" 
            href="#" 
            role="button" 
            onClick={(e) => {
              e.preventDefault();
              goToPrevious();
            }}
          >
            <span className="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
            <span className="sr-only">Previous</span>
          </a>
          <a 
            className="right carousel-control" 
            href="#" 
            role="button" 
            onClick={(e) => {
              e.preventDefault();
              goToNext();
            }}
          >
            <span className="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>
            <span className="sr-only">Next</span>
          </a>
        </>
      )}
    </div>
  );
};

export default Carousel;