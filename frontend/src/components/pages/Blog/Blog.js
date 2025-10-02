import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { ApiClient } from '../../../config/api';
import BlogPostEditor from './BlogPostEditor';
import BlogPostFilters from './BlogPostFilters';
import BlogPostList from './BlogPostList';
import './Blog.css';

const Blog = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filters, setFilters] = useState({
    text: '',
    ageRangeId: null,
    categoryId: null,
    thematicAreaId: null,
    pathologyId: null
  });
  const [filterOptions, setFilterOptions] = useState({
    ageRanges: [],
    categories: [],
    thematicAreas: [],
    pathologies: []
  });
  const [selectedPost, setSelectedPost] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const canCreatePosts = user?.roles?.some(r =>
    r.nome === 'ROLE_PINKCARE' || r.nome === 'ROLE_BUSINESS'
  );

  useEffect(() => {
    loadFilterOptions();
    loadPosts();
  }, [filters, page]);

  const loadFilterOptions = async () => {
    try {
      const response = await ApiClient.get('/api/blog/filters/options');
      setFilterOptions(response);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page,
        limit: 20
      };
      const response = await ApiClient.get('/api/blog', { params });
      console.log('Blog response:', response);

      if (response && response.posts) {
        setPosts(response.posts);
        setTotalPages(response.totalPages || 0);
      } else if (response && response.data && response.data.posts) {
        setPosts(response.data.posts);
        setTotalPages(response.data.totalPages || 0);
      } else {
        console.error('Unexpected response format:', response);
        setPosts([]);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handlePostPublish = async (postData) => {
    try {
      if (selectedPost) {
        await ApiClient.put(`/api/blog/${selectedPost.id}`, postData);
      } else {
        await ApiClient.post('/api/blog', postData);
      }
      setSelectedPost(null);
      loadPosts();
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Errore durante la pubblicazione del post');
    }
  };

  const handlePostEdit = (post) => {
    setSelectedPost(post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostDelete = async (postId) => {
    if (!window.confirm(t('resourceBundle.To_delete', 'Eliminare') + '?')) {
      return;
    }

    try {
      await ApiClient.delete(`/api/blog/${postId}`);
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Errore durante l\'eliminazione del post');
    }
  };

  return (
    <div className="blog-page">
      {/* Post Editor - only for PINKCARE and BUSINESS */}
      {canCreatePosts && (
        <BlogPostEditor
          post={selectedPost}
          filterOptions={filterOptions}
          onPublish={handlePostPublish}
          onCancel={() => setSelectedPost(null)}
        />
      )}

      {/* Filters */}
      <BlogPostFilters
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
      />

      {/* Posts List */}
      <BlogPostList
        posts={posts}
        loading={loading}
        canEdit={canCreatePosts}
        onEdit={handlePostEdit}
        onDelete={handlePostDelete}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn btn-secondary"
          >
            {t('resourceBundle.Previous', 'Precedente')}
          </button>
          <span className="page-info">
            {t('resourceBundle.Page', 'Pagina')} {page + 1} {t('resourceBundle.of', 'di')} {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="btn btn-secondary"
          >
            {t('resourceBundle.Next', 'Successivo')}
          </button>
        </div>
      )}
    </div>
  );
};

export default Blog;
