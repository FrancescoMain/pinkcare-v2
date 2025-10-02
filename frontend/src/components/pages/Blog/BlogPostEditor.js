import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import './BlogPostEditor.css';

const BlogPostEditor = ({ post, filterOptions, onPublish, onCancel }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    headline: '',
    text: '',
    image: '',
    all_categories: false,
    all_thematic_areas: false,
    all_age_ranges: false,
    all_pathologies: false,
    categories: [],
    thematic_areas: [],
    age_ranges: [],
    pathologies: [],
    publish_in_public: false,
    publish_in_private: false
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (post) {
      setFormData({
        headline: post.headline || '',
        text: post.text || '',
        image: post.image || '',
        all_categories: post.all_categories || false,
        all_thematic_areas: post.all_thematic_areas || false,
        all_age_ranges: post.all_age_ranges || false,
        all_pathologies: post.all_pathologies || false,
        categories: post.categories?.map(c => c.category_id) || [],
        thematic_areas: post.thematic_areas?.map(ta => ta.thematic_area_id) || [],
        age_ranges: post.age_ranges?.map(ar => ar.age_range_id) || [],
        pathologies: post.pathologies?.map(p => p.pathology_id) || [],
        publish_in_public: post.publish_in_public || false,
        publish_in_private: post.publish_in_private || false
      });
      setImagePreview(post.image);
    } else {
      resetForm();
    }
  }, [post]);

  const resetForm = () => {
    setFormData({
      headline: '',
      text: '',
      image: '',
      all_categories: false,
      all_thematic_areas: false,
      all_age_ranges: false,
      all_pathologies: false,
      categories: [],
      thematic_areas: [],
      age_ranges: [],
      pathologies: [],
      publish_in_public: false,
      publish_in_private: false
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFormData(prev => ({ ...prev, image: base64String }));
      setImagePreview(base64String);
      setImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleMultiSelectChange = (field, value) => {
    const currentValues = formData[field];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setFormData({ ...formData, [field]: newValues });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.headline.trim()) {
      alert(t('resourceBundle.Headline', 'Titolo') + ' ' + t('resourceBundle.required_mascouline', 'richiesto'));
      return;
    }

    if (!formData.image && !post?.id) {
      alert(t('resourceBundle.Image', 'Immagine') + ' ' + t('resourceBundle.required_feminine', 'richiesta'));
      return;
    }

    onPublish(formData);
    if (!post) {
      resetForm();
    }
  };

  // Don't render if filterOptions is not loaded yet
  if (!filterOptions) {
    return <div className="ui-block">{t('resourceBundle.Loading', 'Caricamento')}...</div>;
  }

  return (
    <div className="ui-block">
      <div id="news-feed-form" className="news-feed-form">
        <ul className="nav nav-tabs" role="tablist">
          <li className="nav-item">
            <a className="nav-link active inline-items">
              <i className="fas fa-pen"></i>
              <span>{t('resourceBundle.Write_a_post', 'Scrivi un post')}</span>
            </a>
          </li>
        </ul>

        <div className="tab-content">
          <div className="tab-pane active">
            <form onSubmit={handleSubmit} className="post-form">
              <div className="author-thumb">
                <img
                  src={user?.team?.logo || '/styles/olympus/assets/images/avatar.jpg'}
                  alt={t('resourceBundle.User_image', 'Immagine utente')}
                  style={{ width: '36px', height: '36px' }}
                />
              </div>

              <div className="form-group">
                <label>{t('resourceBundle.Headline', 'Titolo')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('resourceBundle.Text', 'Testo')}</label>
                <textarea
                  className="form-control editor-textarea"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  rows="10"
                  placeholder={t('resourceBundle.Write_your_post', 'Scrivi il tuo post...')}
                />
              </div>

              <div className="add-options-message">
                <div className="form-group">
                  <label>{t('resourceBundle.Image', 'Immagine')}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="form-control"
                  />
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" style={{ height: '100px', marginTop: '10px' }} />
                    </div>
                  )}
                </div>

                {/* Filters */}
                <div className="row">
                  <div className="col-12 col-sm-12 col-md-3">
                    <label className="control-label">{t('resourceBundle.Age_ranges', 'Fasce età')}</label>
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        checked={formData.all_age_ranges}
                        onChange={(e) => setFormData({ ...formData, all_age_ranges: e.target.checked })}
                      />
                      <span>{t('resourceBundle.all_feminine', 'Tutte')}</span>
                    </div>
                    {!formData.all_age_ranges && (
                      <select
                        multiple
                        className="form-control"
                        value={formData.age_ranges}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                          setFormData({ ...formData, age_ranges: selected });
                        }}
                      >
                        {filterOptions.ageRanges?.map(ar => (
                          <option key={ar.id} value={ar.id}>{ar.age_range}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="col-12 col-sm-12 col-md-3">
                    <label className="control-label">{t('resourceBundle.Categories', 'Categorie')}</label>
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        checked={formData.all_categories}
                        onChange={(e) => setFormData({ ...formData, all_categories: e.target.checked })}
                      />
                      <span>{t('resourceBundle.all_feminine', 'Tutte')}</span>
                    </div>
                    {!formData.all_categories && (
                      <select
                        multiple
                        className="form-control"
                        value={formData.categories}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                          setFormData({ ...formData, categories: selected });
                        }}
                      >
                        {filterOptions.categories?.map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="col-12 col-sm-12 col-md-3">
                    <label className="control-label">{t('resourceBundle.Thematic_areas', 'Aree tematiche')}</label>
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        checked={formData.all_thematic_areas}
                        onChange={(e) => setFormData({ ...formData, all_thematic_areas: e.target.checked })}
                      />
                      <span>{t('resourceBundle.all_feminine', 'Tutte')}</span>
                    </div>
                    {!formData.all_thematic_areas && (
                      <select
                        multiple
                        className="form-control"
                        value={formData.thematic_areas}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                          setFormData({ ...formData, thematic_areas: selected });
                        }}
                      >
                        {filterOptions.thematicAreas?.map(ta => (
                          <option key={ta.id} value={ta.id}>{ta.label}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="col-12 col-sm-12 col-md-3">
                    <label className="control-label">{t('resourceBundle.Pathologies', 'Patologie')}</label>
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        checked={formData.all_pathologies}
                        onChange={(e) => setFormData({ ...formData, all_pathologies: e.target.checked })}
                      />
                      <span>{t('resourceBundle.all_feminine', 'Tutte')}</span>
                    </div>
                    {!formData.all_pathologies && (
                      <select
                        multiple
                        className="form-control"
                        value={formData.pathologies}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                          setFormData({ ...formData, pathologies: selected });
                        }}
                      >
                        {filterOptions.pathologies?.map(p => (
                          <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="row" style={{ marginTop: '15px' }}>
                  <div className="col-12 col-sm-12 col-md-3">
                    <input
                      type="checkbox"
                      checked={formData.publish_in_public}
                      onChange={(e) => setFormData({ ...formData, publish_in_public: e.target.checked })}
                    />
                    <span>{t('resourceBundle.Publish_in_public_area', 'Pubblica in area pubblica')}</span>
                  </div>
                  <div className="col-12 col-sm-12 col-md-3">
                    <input
                      type="checkbox"
                      checked={formData.publish_in_private}
                      onChange={(e) => setFormData({ ...formData, publish_in_private: e.target.checked })}
                    />
                    <span>{t('resourceBundle.Publish_in_reserved_area', 'Pubblica in area riservata')}</span>
                  </div>
                  <div className="col-12 col-sm-12 col-md-6">
                    <button type="submit" className="btn btn-primary btn-md-2">
                      {t('resourceBundle.Publish', 'Pubblica')}
                    </button>
                    {post && (
                      <button
                        type="button"
                        onClick={() => { resetForm(); onCancel(); }}
                        className="btn btn-secondary btn-md-2"
                        style={{ marginLeft: '10px' }}
                      >
                        {t('resourceBundle.Cancel', 'Annulla')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostEditor;
