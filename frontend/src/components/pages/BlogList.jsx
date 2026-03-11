import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiClient } from '../../config/api';

const BlogList = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Filter options from API
  const [ageRanges, setAgeRanges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [thematicAreas, setThematicAreas] = useState([]);

  // Active filters from URL params
  const params = new URLSearchParams(location.search);
  const activeAgeRange = params.get('age_range') || '';
  const activeCategory = params.get('category') || '';
  const activeThematicArea = params.get('thematic_area') || '';

  const POSTS_PER_PAGE = 15;

  const fetchPosts = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', pageNum);
      queryParams.set('limit', POSTS_PER_PAGE);
      if (activeAgeRange) queryParams.set('ageRangeId', activeAgeRange);
      if (activeCategory) queryParams.set('categoryId', activeCategory);
      if (activeThematicArea) queryParams.set('thematicAreaId', activeThematicArea);

      const data = await ApiClient.get(`/api/blog/public?${queryParams.toString()}`);
      setPosts(data.posts || []);
      setTotalPages(data.totalPages || 0);
      setTotalCount(data.totalCount || 0);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeAgeRange, activeCategory, activeThematicArea]);

  useEffect(() => {
    fetchPosts(0);
  }, [fetchPosts]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const data = await ApiClient.get('/api/blog/filters/options');
        setAgeRanges(data.ageRanges || []);
        setCategories(data.categories || []);
        setThematicAreas(data.thematicAreas || []);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    fetchFilterOptions();
  }, []);

  const handlePageChange = (newPage) => {
    fetchPosts(newPage);
    window.scrollTo(0, 0);
  };

  const buildFilterUrl = (filterType, filterId) => {
    const newParams = new URLSearchParams();
    newParams.set('tab', 'blog_list');
    if (filterType === 'age_range') newParams.set('age_range', filterId);
    if (filterType === 'category') newParams.set('category', filterId);
    if (filterType === 'thematic_area') newParams.set('thematic_area', filterId);
    return `/public?${newParams.toString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Build paginator pages array (max 5 visible)
  const getPaginatorPages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible);
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="blog-list-content">
        <div className="text-center" style={{ padding: '40px' }}>
          <i className="fa fa-spinner fa-spin fa-2x"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-list-content">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <div className="container">
          <ul className="list-unstyled list-inline">
            <li><a href="/public">Home</a></li>
            <li className="active">News</li>
          </ul>
        </div>
      </div>

      <div className="container main-container">
        <div className="row">
          {/* Content Area */}
          <div className="col col-12 col-sm-12 col-md-9">
            <div className="news-post-list">
              {posts.length === 0 ? (
                <p>{t('blog.no_posts', 'Nessun articolo trovato.')}</p>
              ) : (
                posts.map((post) => (
                  <article key={post.id} className="news-post">
                    {post.image && (
                      <img src={post.image} alt="photo" />
                    )}
                    <div className="inner">
                      <h4>{post.headline}</h4>
                      <ul className="list-unstyled list-inline post-meta">
                        <li>
                          <i className="fa fa-calendar" />{' '}
                          {formatDate(post.insertion_date)}
                        </li>
                        <li>
                          <i className="fa fa-clock-o" />{' '}
                          {formatTime(post.insertion_date)}
                        </li>
                        <li>
                          <ul className="list-unstyled list-inline sm-links">
                            <li><a href="#"><i className="fab fa-facebook-square"></i></a></li>
                            <li><a href="#"><i className="fab fa-twitter-square"></i></a></li>
                            <li><a href="#"><i className="fab fa-linkedin"></i></a></li>
                            <li><a href="#"><i className="fas fa-envelope-square"></i></a></li>
                          </ul>
                        </li>
                        {(post.age_ranges?.length > 0 || post.all_age_ranges ||
                          post.thematic_areas?.length > 0 || post.all_thematic_areas) && (
                          <li>
                            <i className="fa fa-tag" />{' '}
                            {!post.all_age_ranges ? (
                              post.age_ranges?.map((ar, idx) => (
                                <span key={ar.id}>
                                  {ar.age_range?.age_range}
                                  {(idx < post.age_ranges.length - 1 ||
                                    (post.all_thematic_areas ? thematicAreas.length > 0 : post.thematic_areas?.length > 0)) ? ', ' : ''}
                                </span>
                              ))
                            ) : (
                              <span>
                                {t('blog.all_ages', 'Tutte le età')}
                                {(post.all_thematic_areas ? thematicAreas.length > 0 : post.thematic_areas?.length > 0) ? ', ' : ''}
                              </span>
                            )}
                            {(post.all_thematic_areas ? thematicAreas : post.thematic_areas || []).map((ta, idx, arr) => (
                              <span key={ta.id || idx}>
                                <a href="#">{post.all_thematic_areas ? ta.label : ta.thematic_area?.label}</a>
                                {idx < arr.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </li>
                        )}
                      </ul>
                      <div className="news-post-content" dangerouslySetInnerHTML={{ __html: post.text }} />
                      <a href={`/public?tab=blog_post&post=${post.id}`} className="btn btn-secondary">
                        {t('blog.read_all', 'Leggi tutto')}{' '}
                        <i className="fa fa-arrow-circle-right"></i>
                      </a>
                    </div>
                  </article>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="clearfix pagination-wrap text-center">
                <ul className="pagination">
                  <li>
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0}
                      style={{ border: 'none', background: 'none', cursor: page === 0 ? 'default' : 'pointer' }}
                    >
                      <span aria-hidden="true">&laquo;</span>
                    </button>
                  </li>
                  {getPaginatorPages().map((p) => (
                    <li key={p} className={p === page ? 'active' : ''}>
                      <button
                        onClick={() => handlePageChange(p)}
                        disabled={p === page}
                        style={{ border: 'none', background: 'none', cursor: p === page ? 'default' : 'pointer' }}
                      >
                        {p + 1}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={(page + 1) * POSTS_PER_PAGE >= totalCount}
                      style={{ border: 'none', background: 'none', cursor: (page + 1) * POSTS_PER_PAGE >= totalCount ? 'default' : 'pointer' }}
                    >
                      <span aria-hidden="true">&raquo;</span>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-md-3 col-sm-12 col-xs-12">
            {/* Age Range Tags */}
            <h4 className="side-heading1">{t('blog.age_range', 'Fascia d\'età')}</h4>
            <ul className="list-unstyled list-inline list-tags">
              {ageRanges.map((ar) => (
                <li key={ar.id}>
                  <a href={buildFilterUrl('age_range', ar.id)}>{ar.age_range}</a>
                </li>
              ))}
            </ul>

            {/* Category Tags */}
            <h4 className="side-heading1">{t('blog.health_topics', 'Argomenti Salute')}</h4>
            <ul className="list-unstyled list-inline list-tags">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <a href={buildFilterUrl('category', cat.id)}>{cat.label}</a>
                </li>
              ))}
            </ul>

            {/* Thematic Area Tags */}
            <h4 className="side-heading1">{t('blog.thematic_areas', 'Aree Tematiche')}</h4>
            <ul className="list-unstyled list-inline list-tags">
              {thematicAreas.map((ta) => (
                <li key={ta.id}>
                  <a href={buildFilterUrl('thematic_area', ta.id)}>{ta.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogList;
