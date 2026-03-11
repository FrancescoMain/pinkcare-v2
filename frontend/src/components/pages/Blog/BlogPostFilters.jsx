import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './BlogPostFilters.css';

const BlogPostFilters = ({ filters, filterOptions, onFilterChange }) => {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
  };

  const handleSearch = () => {
    onFilterChange(localFilters);
  };

  // Don't render if filterOptions is not loaded yet
  if (!filterOptions) {
    return null;
  }

  return (
    <div className="ui-block">
      <div className="ui-block-title">
        <h5>{t('resourceBundle.Use_filters_to_find_the_posts_you_are_interested_in', 'Usa i filtri per trovare i post che ti interessano')}</h5>
      </div>
      <fieldset className="filters-fieldset">
        <div className="responsive-flex1200">
          <div className="ui-block-title">
            <div className="w-select">
              <div className="title">{t('resourceBundle.Age_ranges', 'Fasce età')}</div>
              <fieldset className="form-group">
                <select
                  className="form-control"
                  value={localFilters.ageRangeId || ''}
                  onChange={(e) => handleChange('ageRangeId', e.target.value || null)}
                >
                  <option value="">---</option>
                  {filterOptions.ageRanges?.map(ar => (
                    <option key={ar.id} value={ar.id}>{ar.age_range}</option>
                  ))}
                </select>
              </fieldset>
            </div>

            <div className="w-select">
              <div className="title">{t('resourceBundle.Categories', 'Categorie')}</div>
              <fieldset className="form-group">
                <select
                  className="form-control"
                  value={localFilters.categoryId || ''}
                  onChange={(e) => handleChange('categoryId', e.target.value || null)}
                >
                  <option value="">---</option>
                  {filterOptions.categories?.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </fieldset>
            </div>

            <div className="w-select">
              <div className="title">{t('resourceBundle.Thematic_areas', 'Aree tematiche')}</div>
              <fieldset className="form-group">
                <select
                  className="form-control"
                  value={localFilters.thematicAreaId || ''}
                  onChange={(e) => handleChange('thematicAreaId', e.target.value || null)}
                >
                  <option value="">---</option>
                  {filterOptions.thematicAreas?.map(ta => (
                    <option key={ta.id} value={ta.id}>{ta.label}</option>
                  ))}
                </select>
              </fieldset>
            </div>

            <div className="w-select">
              <div className="title">{t('resourceBundle.Pathologies', 'Patologie')}</div>
              <fieldset className="form-group">
                <select
                  className="form-control"
                  value={localFilters.pathologyId || ''}
                  onChange={(e) => handleChange('pathologyId', e.target.value || null)}
                >
                  <option value="">---</option>
                  {filterOptions.pathologies?.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </fieldset>
            </div>
          </div>

          <div className="ui-block-title">
            <div className="form-group with-button">
              <input
                type="text"
                className="form-control"
                value={localFilters.text}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder={t('resourceBundle.Find_an_articol', 'Trova un articolo')}
              />
              <button onClick={handleSearch} className="search-button">
                <i className="fas fa-search" />
              </button>
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
};

export default BlogPostFilters;
