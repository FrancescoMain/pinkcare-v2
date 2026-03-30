import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import AdminApi from '../../../services/adminApi';

const BusinessList = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState({ name: '', surname: '', denomination: '', typeId: '' });
  const [appliedFilters, setAppliedFilters] = useState({ name: '', surname: '', denomination: '', typeId: '' });
  const [typologies, setTypologies] = useState([]);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1, size: 15, total: 0, totalPages: 0, hasNext: false, hasPrevious: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTypologies = async () => {
      try {
        const data = await AdminApi.getTypologies();
        setTypologies(data);
      } catch (error) {
        console.error('Error loading typologies:', error);
      }
    };
    loadTypologies();
  }, []);

  const fetchData = useCallback(async (currentFilters, page = 1) => {
    try {
      setLoading(true);
      const result = await AdminApi.getBusinesses(currentFilters, page, 15);
      setItems(result.items || []);
      setPagination({
        page: result.page,
        size: result.size,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrevious: result.hasPrevious
      });
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast.error(t('admin.toggle_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData(appliedFilters);
  }, [fetchData, appliedFilters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedFilters({ ...filters });
  };

  const handleReset = () => {
    const empty = { name: '', surname: '', denomination: '', typeId: '' };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  const handleToggleAccess = async (userId) => {
    try {
      await AdminApi.toggleAccess('business', userId);
      toast.success(t('admin.toggle_success'));
      fetchData(appliedFilters, pagination.page);
    } catch (error) {
      toast.error(t('admin.toggle_error'));
    }
  };

  const handleToggleMarketing = async (userId) => {
    try {
      await AdminApi.toggleMarketing('business', userId);
      toast.success(t('admin.toggle_success'));
      fetchData(appliedFilters, pagination.page);
    } catch (error) {
      toast.error(t('admin.toggle_error'));
    }
  };

  const handleToggleNewsletter = async (userId) => {
    try {
      await AdminApi.toggleNewsletter('business', userId);
      toast.success(t('admin.toggle_success'));
      fetchData(appliedFilters, pagination.page);
    } catch (error) {
      toast.error(t('admin.toggle_error'));
    }
  };

  const handleToggleSearchable = async (teamId) => {
    try {
      await AdminApi.toggleSearchable(teamId);
      toast.success(t('admin.toggle_success'));
      fetchData(appliedFilters, pagination.page);
    } catch (error) {
      toast.error(t('admin.toggle_error'));
    }
  };

  const handleExport = async () => {
    try {
      const blob = await AdminApi.exportBusinesses(appliedFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attivita_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(t('admin.export_error'));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('it-IT');
  };

  return (
    <div className="admin-list">
      {/* Search form */}
      <form className="admin-search-form" onSubmit={handleSearch}>
        <div className="admin-search-fields">
          <input
            type="text"
            placeholder={t('admin.search_name')}
            value={filters.name}
            onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
          />
          <input
            type="text"
            placeholder={t('admin.search_surname')}
            value={filters.surname}
            onChange={(e) => setFilters(prev => ({ ...prev, surname: e.target.value }))}
          />
          <input
            type="text"
            placeholder={t('admin.search_denomination')}
            value={filters.denomination}
            onChange={(e) => setFilters(prev => ({ ...prev, denomination: e.target.value }))}
          />
          <select
            value={filters.typeId}
            onChange={(e) => setFilters(prev => ({ ...prev, typeId: e.target.value }))}
          >
            <option value="">{t('admin.search_all_types')}</option>
            {typologies.map(typ => (
              <option key={typ.id} value={typ.id}>{typ.label}</option>
            ))}
          </select>
        </div>
        <div className="admin-search-actions">
          <button type="submit" className="btn btn-primary">{t('admin.find')}</button>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>{t('admin.reset')}</button>
          <button type="button" className="btn btn-export" onClick={handleExport}>
            <i className="fas fa-file-export"></i> {t('admin.export')}
          </button>
        </div>
      </form>

      {/* Data table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="admin-empty">{t('admin.no_results')}</div>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.insertion_date')}</th>
                <th>{t('admin.typology')}</th>
                <th>{t('admin.denomination')}</th>
                <th>{t('admin.access')}</th>
                <th>{t('admin.searchable')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((team) => {
                const user = team.representative;
                return (
                  <tr key={team.id}>
                    <td>{formatDate(user?.insertionDate)}</td>
                    <td>{team.type?.label || ''}</td>
                    <td>{team.name || ''}</td>
                    <td>
                      <button
                        className={`toggle-btn ${user?.enabled ? 'active' : 'inactive'}`}
                        onClick={() => user && handleToggleAccess(user.id)}
                      >
                        {user?.enabled ? 'Sì' : 'No'}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`toggle-btn ${team.searchable ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleSearchable(team.id)}
                      >
                        {team.searchable ? 'Sì' : 'No'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="admin-pagination">
            <button
              className="btn btn-secondary"
              disabled={!pagination.hasPrevious}
              onClick={() => fetchData(appliedFilters, pagination.page - 1)}
            >
              {t('admin.previous')}
            </button>
            <span>{t('admin.page')} {pagination.page} {t('admin.of')} {pagination.totalPages}</span>
            <button
              className="btn btn-secondary"
              disabled={!pagination.hasNext}
              onClick={() => fetchData(appliedFilters, pagination.page + 1)}
            >
              {t('admin.next')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BusinessList;
