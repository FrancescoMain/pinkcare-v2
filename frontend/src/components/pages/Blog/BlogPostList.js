import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BlogPostCard from './BlogPostCard';
import './BlogPostList.css';

const BlogPostList = ({ posts, loading, canEdit, onEdit, onDelete }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('resourceBundle.Loading', 'Caricamento')}...</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="ui-block">
        <div className="no-posts">
          <p>{t('resourceBundle.No_posts_found', 'Nessun post trovato')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-post-list">
      {posts.map((post, index) => (
        <BlogPostCard
          key={post.id}
          post={post}
          index={index}
          canEdit={canEdit}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default BlogPostList;
