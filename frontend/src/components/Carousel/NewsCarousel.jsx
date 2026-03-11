import React from 'react';
import Carousel from './Carousel';

const NewsCarousel = ({ newsData = [], resourceBundle = {} }) => {
  const renderNewsSlide = (newsList, index) => {
    return (
      <div className="row">
        {newsList.map((newsItem, newsIndex) => (
          <div key={newsIndex} className="col-md-6 col-sm-6 col-xs-6">
            <div className="news-post-box">
              <img src={newsItem.image} alt="photo" />
              <div className="inner">
                <h5>
                  <a href="#">{newsItem.headline}</a>
                </h5>
                <ul className="list-unstyled list-inline post-meta">
                  <li>
                    <i className="fa fa-calendar" />
                    {' '}
                    {newsItem.insertion_date ? 
                      new Date(newsItem.insertion_date).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : ''
                    }
                  </li>
                </ul>
                <div className="read_p_blog">
                  <div dangerouslySetInnerHTML={{ __html: newsItem.text }} />
                </div>
                <a 
                  href={`/public?tab=1&post=${newsItem.id}`} 
                  className="btn btn-secondary"
                >
                  <i className="fa fa-arrow-circle-right" />
                  {' '}
                  {resourceBundle.Read_all || 'Leggi tutto'}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!newsData || newsData.length === 0) {
    return null;
  }

  return (
    <div className="main-block1">
      <h2 className="main-heading2">
        {resourceBundle.Last_News || 'Ultime News'}
      </h2>
      <Carousel
        items={newsData}
        autoPlay={false}
        interval={false}
        showIndicators={false}
        showControls={true}
        className="news-carousel"
        renderItem={renderNewsSlide}
      />
    </div>
  );
};

export default NewsCarousel;