import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NotificationApi from '../../../services/notificationApi';

/**
 * NotificationList Component
 * Replica esattamente notification_list.xhtml del legacy (profile?tab=2)
 * DataTable paginata con colonne: Data inserimento, Tipo, Messaggio, Non letta, Elimina
 */
const NotificationList = ({ errorHandler }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showSuccessMessage, showErrorMessage } = errorHandler || {};

  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const ITEMS_PER_PAGE = 15;

  const loadNotifications = useCallback(async (pageNum) => {
    setIsLoading(true);
    try {
      const result = await NotificationApi.getAll(pageNum, ITEMS_PER_PAGE);
      setNotifications(result.notifications || []);
      setTotalPages(result.totalPages || 0);
      setTotal(result.total || 0);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading notifications:', error);
      if (showErrorMessage) {
        showErrorMessage('Errore', t('notifications.error_loading', 'Errore nel caricamento delle notifiche'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [showErrorMessage, t]);

  useEffect(() => {
    loadNotifications(0);
  }, [loadNotifications]);

  const handleRowClick = async (notification) => {
    try {
      const result = await NotificationApi.getLink(notification.id);
      if (result.link) {
        navigate(result.link);
      }
    } catch (error) {
      console.error('Error getting notification link:', error);
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    if (!window.confirm(t('notifications.confirm_delete', 'Eliminare?'))) {
      return;
    }
    try {
      await NotificationApi.deleteNotification(notificationId);
      loadNotifications(page);
    } catch (error) {
      console.error('Error deleting notification:', error);
      if (showErrorMessage) {
        showErrorMessage('Errore', t('notifications.error_deleting', 'Errore nell\'eliminazione della notifica'));
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  return (
    <div className="ui-block">
      <div className="ui-block-title">
        <h6 className="title">{t('notifications.notification_list', 'Lista Notifiche')}</h6>
      </div>
      <div className="ui-block-content">
        <div className="row">
          {isLoading ? (
            <div style={{ textAlign: 'center', width: '100%', padding: '20px' }}>
              <i className="fas fa-spinner fa-spin"></i> Caricamento...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', width: '100%', padding: '20px' }}>
              {t('notifications.empty_message', 'Nessuna notifica')}
            </div>
          ) : (
            <>
              <table className="table table-hover" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '10%' }}>{t('notifications.insertion_date', 'Data Inserimento')}</th>
                    <th>{t('notifications.type', 'Tipo')}</th>
                    <th>{t('notifications.message', 'Messaggio')}</th>
                    <th style={{ width: '10%' }}>{t('notifications.not_read', 'Non letta')}</th>
                    <th style={{ width: '10%' }}>{t('notifications.delete', 'Elimina')}</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => (
                    <tr
                      key={n.id}
                      onClick={() => handleRowClick(n)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{formatDate(n.insertionDate)}</td>
                      <td>{n.typology?.label || ''}</td>
                      <td dangerouslySetInnerHTML={{ __html: n.message || '' }} />
                      <td>{n.active ? t('common.yes', 'Sì') : t('common.no', 'No')}</td>
                      <td>
                        <button
                          className="btn btn-sm"
                          onClick={(e) => handleDelete(e, n.id)}
                          title={t('notifications.delete', 'Elimina')}
                          style={{ border: 'none', background: 'none' }}
                        >
                          <i className="fas fa-times" style={{ color: '#dc3545' }}></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {total > 0 && (
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <table style={{ margin: '0 auto' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '20%', textAlign: 'center' }}>
                          {page > 0 && (
                            <button
                              className="btn btn-sm btn-default"
                              onClick={() => loadNotifications(page - 1)}
                              style={{ width: '40px' }}
                            >
                              &lt;
                            </button>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0 15px' }}>
                          {t('notifications.page', 'Pagina')} {page + 1} {t('notifications.of', 'di')} {totalPages}
                        </td>
                        <td style={{ width: '20%', textAlign: 'center' }}>
                          {page + 1 < totalPages && (
                            <button
                              className="btn btn-sm btn-default"
                              onClick={() => loadNotifications(page + 1)}
                              style={{ width: '40px' }}
                            >
                              &gt;
                            </button>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationList;
