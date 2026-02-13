import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiClient } from '../../../config/api';
import ThreeColumnLayout from '../../layout/ThreeColumnLayout';
import UserProfileSidebar from '../../layout/UserProfileSidebar';
import AdvertisingSidebar from '../../layout/AdvertisingSidebar';
import './Dashboard.css';

/**
 * Dashboard Component
 * Replicates /WEB-INF/flows/home/home.xhtml exactly
 */
const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedPosts, setExpandedPosts] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load dashboard data (user, suggestedScreening)
      const dashboardResponse = await ApiClient.get('/api/dashboard');

      // Load blog posts from /api/blog (same endpoint as Blog page)
      const blogResponse = await ApiClient.get('/api/blog', {
        params: { page: 0, limit: 10 }
      });

      setDashboardData({
        ...dashboardResponse,
        blogPosts: blogResponse.posts || []
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const truncateText = (html, maxLength = 300) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';

    if (text.length <= maxLength) return html;

    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Caricamento...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-error">
        <p>Errore nel caricamento della dashboard</p>
      </div>
    );
  }

  const { user, suggestedScreening, blogPosts } = dashboardData;

  return (
    <ThreeColumnLayout
      leftSidebar={<UserProfileSidebar />}
      rightSidebar={<AdvertisingSidebar />}
      leftColSize={2}
      centerColSize={8}
      rightColSize={2}
    >
      <div className="dashboard-container">
        {/* Banner Questionario - Replica: <div class="ui-block"> with questionario class */}
        <div className="ui-block">
          <a href="/consumer?tab=3" className="tile" style={{ float: 'none' }}>
            <div className="ui-block-container questionario">
              <span style={{ textAlign: 'center' }} dangerouslySetInnerHTML={{
                __html: t('resourceBundle.Complete_questionnaire', 'Ottieni il tuo Programma di prevenzione e cura personalizzato <br/>Completa il Questionario')
              }} />
            </div>
          </a>
        </div>

        {/* Programma di cura personalizzato - Legacy style */}
        {suggestedScreening && suggestedScreening.length > 0 && (
          <div className="ui-block">
            <div className="ui-block-title">
              <h5 className="title">
                {t('resourceBundle.Customized_care_program', 'Programma di cura personalizzato')}
              </h5>
            </div>
            <div className="row">
              {suggestedScreening.map((screening) => (
                <div key={screening.id} className="col-12 col-md-4">
                  <div className="ui-block available-widget">
                    <div className="h6 title">{screening.examination.label}</div>
                    <div className="more">
                      <a
                        href={`/consumer?tab=6&type=4&exam_id=${screening.examination.id}`}
                        className="btn btn-xs bg-blue"
                      >
                        {t('resourceBundle.Find_doctor', 'Trova medico')}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dal nostro blog - Replica: blogPostList section */}
        {blogPosts && blogPosts.length > 0 && (
          <div className="ui-block">
            <div className="ui-block-title">
              <h5 className="title">
                {t('resourceBundle.From_our_blog', 'Dal nostro blog')}
              </h5>
              <p style={{ display: 'table-footer-group' }}>
                {t('resourceBundle.Content_chosen_for_you', 'Contenuti scelti per te')}
              </p>
            </div>

            {blogPosts.map((post, index) => (
              <div key={post.id}>
                {/* Post - Replica: article.hentry.post structure */}
                <article className="hentry post has-post-thumbnail thumb-full-width">
                  {/* Control buttons - Social sharing */}
                  <div className="control-block-button post-control-button">
                    <a href="#" className="btn btn-control has-i bg-facebook">
                      <i className="fab fa-facebook-f" style={{ lineHeight: '30px' }}></i>
                    </a>
                    <a href="#" className="btn btn-control has-i bg-twitter">
                      <i className="fab fa-linkedin-in" style={{ lineHeight: '30px' }}></i>
                    </a>
                    <a href="#" className="btn btn-control has-i bg-google">
                      <i className="far fa-envelope-open" style={{ lineHeight: '30px' }}></i>
                    </a>
                  </div>

                  {/* Post author */}
                  <div className="post__author author vcard inline-items">
                    <img
                      src={
                        post.team?.logo && post.team.logo !== ''
                          ? post.team.logo
                          : '../styles/olympus/assets/images/avatar.jpg'
                      }
                      alt={t('resourceBundle.User_image', 'Immagine utente')}
                    />
                    <div className="author-date">
                      <h3>{post.headline}</h3>
                      <div className="post__date">
                        {new Date(post.insertion_date).toLocaleString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {post.insertion_username && (
                          <>&nbsp; Da &nbsp; <b>{post.insertion_username}</b></>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post image */}
                  {post.image && post.image !== '' && (
                    <div className="post-thumb">
                      <img src={post.image} alt="photo" />
                    </div>
                  )}

                  {/* Post content with accordion */}
                  <div id={`accordion_${post.id}`} role="tablist" aria-multiselectable="true">
                    <div className="card">
                      <div className="card-header" role="tab" id={`headingOne-1_${post.id}`}>
                        <div className="mb-0">
                          {/* Truncated text */}
                          <div className="post-read-more">
                            {expandedPosts[post.id] ? (
                              <div dangerouslySetInnerHTML={{ __html: post.text }} />
                            ) : (
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: truncateText(post.text, 300)
                                }}
                              />
                            )}
                          </div>

                          {/* Read more button */}
                          <button
                            onClick={() => togglePostExpansion(post.id)}
                            className="btn btn-md-2 btn-border-think c-grey btn-transparent custom-color"
                            style={{ marginTop: '10px' }}
                          >
                            {expandedPosts[post.id]
                              ? t('resourceBundle.Decrease', 'Riduci')
                              : t('resourceBundle.Read_all', 'Leggi tutto')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </div>
    </ThreeColumnLayout>
  );
};

export default Dashboard;
