import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './BlogPostCard.css';

const BlogPostCard = ({ post, index, canEdit, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getTextPreview = (text, maxLength = 300) => {
    const plainText = stripHtml(text);
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  return (
    <div id={`post_${index}`} className="ui-block">
      <article className="hentry post has-post-thumbnail thumb-full-width">
        <div className="post__author author vcard inline-items">
          <img
            src={post.team?.logo || '/styles/olympus/assets/images/avatar.jpg'}
            alt={t('resourceBundle.User_image', 'Immagine utente')}
          />

          {canEdit && (
            <div className="more">
              <i
                className="fas fa-ellipsis-h"
                onClick={() => setShowMenu(!showMenu)}
                style={{ cursor: 'pointer' }}
              />
              {showMenu && (
                <ul className="more-dropdown" style={{ display: 'block' }}>
                  <li>
                    <a href="#" onClick={(e) => {
                      e.preventDefault();
                      setShowMenu(false);
                      onEdit(post);
                    }}>
                      {t('resourceBundle.Edit', 'Modifica')}
                    </a>
                  </li>
                  <li>
                    <a href="#" onClick={(e) => {
                      e.preventDefault();
                      setShowMenu(false);
                      onDelete(post.id);
                    }}>
                      {t('resourceBundle.Delete', 'Elimina')}
                    </a>
                  </li>
                </ul>
              )}
            </div>
          )}

          <div className="author-date">
            <h3>{post.headline}</h3>
            <div className="post__date">
              {formatDate(post.insertion_date)}
              &nbsp; Da &nbsp; <b>{post.insertion_username}</b>
            </div>
          </div>
        </div>

        {post.image && (
          <div className="post-thumb">
            <img src={post.image} alt="photo" />
          </div>
        )}

        <div id={`accordion_${index + 1}`} role="tablist" aria-multiselectable="true">
          <div className="card">
            <div className="card-header" role="tab" id={`headingOne-${index + 1}`}>
              <div className={`mb-${index}`}>
                <div className="post-read-more">
                  {!isExpanded && <p>{getTextPreview(post.text)}</p>}
                  {isExpanded && (
                    <div
                      id={`collapseOne-${index + 1}`}
                      className="collapse show"
                      role="tabpanel"
                      aria-labelledby={`headingOne-${index + 1}`}
                    >
                      <div dangerouslySetInnerHTML={{ __html: post.text }} />
                    </div>
                  )}
                </div>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsExpanded(!isExpanded);
                  }}
                  className="btn btn-md-2 btn-border-think c-grey btn-transparent custom-color read_all_decrease"
                >
                  {isExpanded
                    ? t('resourceBundle.Decrease', 'Riduci')
                    : t('resourceBundle.Read_all', 'Leggi tutto')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogPostCard;
