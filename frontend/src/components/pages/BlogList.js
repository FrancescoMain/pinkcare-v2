import React from "react";
import { useTranslation } from 'react-i18next';

const BlogList = () => {
  const { t } = useTranslation();

  // Mock data per il blog - in futuro questo dovrebbe arrivare da API
  const mockBlogPosts = [
    {
      id: 1,
      title: "Prevenzione del tumore al seno",
      excerpt: "L'importanza della prevenzione e dell'autopalpazione per la salute femminile...",
      date: "2024-01-15",
      image: "/styles/public/images/about-page-tab-image-1.png"
    },
    {
      id: 2,
      title: "Alimentazione e salute femminile",
      excerpt: "Come una corretta alimentazione può influire positivamente sulla salute della donna...",
      date: "2024-01-10",
      image: "/styles/public/images/about-page-tab-image-2.png"
    },
    {
      id: 3,
      title: "Sport e benessere",
      excerpt: "L'attività fisica come alleata per il benessere psico-fisico femminile...",
      date: "2024-01-05",
      image: "/styles/public/images/about-page-tab-image-3.png"
    }
  ];

  return (
    <div className="blog-list-content">
      <h4 className="main-heading2">{t('standard_public.blog', 'BLOG')}</h4>

      <div className="row">
        {mockBlogPosts.map((post) => (
          <div key={post.id} className="col-md-6 col-sm-6 col-xs-12" style={{ marginBottom: '30px' }}>
            <div className="news-post-box">
              <img src={post.image} alt={post.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div className="inner">
                <h5>
                  <a href={`/public?tab=blog_detail&post=${post.id}`}>{post.title}</a>
                </h5>
                <ul className="list-unstyled list-inline post-meta">
                  <li>
                    <i className="fa fa-calendar" />
                    {' '}
                    {new Date(post.date).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </li>
                </ul>
                <div className="read_p_blog">
                  <p>{post.excerpt}</p>
                </div>
                <a
                  href={`/public?tab=blog_detail&post=${post.id}`}
                  className="btn btn-secondary"
                >
                  <i className="fa fa-arrow-circle-right" />
                  {' '}
                  Leggi tutto
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogList;