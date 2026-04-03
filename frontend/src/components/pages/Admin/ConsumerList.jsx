import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import AdminApi from '../../../services/adminApi';

const ConsumerList = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState({ name: '', surname: '' });
  const [appliedFilters, setAppliedFilters] = useState({ name: '', surname: '' });
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1, size: 15, total: 0, totalPages: 0, hasNext: false, hasPrevious: false
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (currentFilters, page = 1) => {
    try {
      setLoading(true);
      const result = await AdminApi.getConsumers(currentFilters, page, 15);
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
      console.error('Error fetching consumers:', error);
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

  const handleToggleAccess = async (userId) => {
    try {
      await AdminApi.toggleAccess('consumer', userId);
      toast.success(t('admin.toggle_success'));
      fetchData(appliedFilters, pagination.page);
    } catch (error) {
      toast.error(t('admin.toggle_error'));
    }
  };

  const handleToggleMarketing = async (userId) => {
    try {
      await AdminApi.toggleMarketing('consumer', userId);
      toast.success(t('admin.toggle_success'));
      fetchData(appliedFilters, pagination.page);
    } catch (error) {
      toast.error(t('admin.toggle_error'));
    }
  };

  const handleToggleNewsletter = async (userId) => {
    try {
      await AdminApi.toggleNewsletter('consumer', userId);
      toast.success(t('admin.toggle_success'));
      fetchData(appliedFilters, pagination.page);
    } catch (error) {
      toast.error(t('admin.toggle_error'));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const calculateAge = (birthday) => {
    if (!birthday) return '';
    const today = new Date();
    const birth = new Date(birthday);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="admin-list">
      <h5 className="admin-title">{t('admin.consumer_list_title')}</h5>

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
        </div>
        <div className="admin-search-actions">
          <button type="submit" className="btn btn-primary">{t('admin.find')}</button>
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
                <th>{t('admin.name')}</th>
                <th>{t('admin.surname')}</th>
                <th>{t('admin.age')}</th>
                <th>{t('admin.access')}</th>
                <th>{t('admin.marketing')}</th>
                <th>{t('admin.newsletter')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((team) => {
                const user = team.representative;
                if (!user) return null;
                return (
                  <tr key={team.id}>
                    <td>{formatDate(user.insertionDate)}</td>
                    <td>{user.name}</td>
                    <td>{user.surname}</td>
                    <td>{calculateAge(user.birthday)}</td>
                    <td>
                      <button
                        className="toggle-btn"
                        onClick={() => handleToggleAccess(user.id)}
                      >
                        <i className={`fas ${user.enabled ? 'fa-check toggle-check' : 'fa-times toggle-times'}`}></i>
                      </button>
                    </td>
                    <td>
                      <button
                        className="toggle-btn"
                        onClick={() => handleToggleMarketing(user.id)}
                      >
                        <i className={`fas ${user.agreeMarketing ? 'fa-check toggle-check' : 'fa-times toggle-times'}`}></i>
                      </button>
                    </td>
                    <td>
                      <button
                        className="toggle-btn"
                        onClick={() => handleToggleNewsletter(user.id)}
                      >
                        <i className={`fas ${user.agreeNewsletter ? 'fa-check toggle-check' : 'fa-times toggle-times'}`}></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="admin-pagination">
            {pagination.hasPrevious && (
              <button
                className="btn btn-pagination"
                onClick={() => fetchData(appliedFilters, pagination.page - 1)}
              >
                &lt;
              </button>
            )}
            <span>{t('admin.pag')} {pagination.page} {t('admin.di')} {pagination.totalPages}</span>
            {pagination.hasNext && (
              <button
                className="btn btn-pagination"
                onClick={() => fetchData(appliedFilters, pagination.page + 1)}
              >
                &gt;
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ConsumerList;
