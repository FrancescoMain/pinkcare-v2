import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/authService';
import { downloadClinicalHistoryPDF } from '../../services/clinicalHistoryApi';
import NotificationApi from '../../services/notificationApi';
import './AuthenticatedHeader.css';

/**
 * AuthenticatedHeader Component
 * Replica esattamente l'header del legacy standard.xhtml per utenti autenticati
 */
const AuthenticatedHeader = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifDropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUnreadNotifications = useCallback(async () => {
    try {
      const result = await NotificationApi.getUnread();
      setUnreadNotifications(result.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  useEffect(() => {
    loadUnreadNotifications();
  }, [loadUnreadNotifications]);

  const handleNotificationClick = async (e, notificationId) => {
    e.preventDefault();
    setNotifDropdownOpen(false);
    try {
      const result = await NotificationApi.getLink(notificationId);
      loadUnreadNotifications();
      if (result.link) {
        navigate(result.link);
      }
    } catch (error) {
      console.error('Error opening notification:', error);
    }
  };

  const handleMarkAsRead = async (e, notificationId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await NotificationApi.markAsRead(notificationId);
      loadUnreadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.preventDefault();
    try {
      await NotificationApi.markAllAsRead();
      setUnreadNotifications([]);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const toggleNotifDropdown = (e) => {
    e.stopPropagation();
    setNotifDropdownOpen(prev => !prev);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  // Handle PDF download for Storia Clinica
  const handleDownloadPDF = async (e) => {
    e.preventDefault();
    try {
      const pdfBlob = await downloadClinicalHistoryPDF();
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'storia_clinica.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Errore durante il download del PDF');
    }
  };

  const hasRole = (role) => {
    return user?.roles?.some(r => r.nome === role) || false;
  };

  const isConsumer = hasRole('ROLE_CONSUMER');
  const isBusiness = hasRole('ROLE_BUSINESS');
  const isAdmin = hasRole('ROLE_PINKCARE');

  return (
    <header className="header" id="site-header">
      <div className="page-title">
        <Link to="/public">
          <img
            src="/styles/olympus/assets/images/logo_pinkcare_white.png"
            alt="PinkCare"
            onError={(e) => {
              e.target.src = '/styles/public/images/logo_pinkcare_white-01.png';
            }}
          />
        </Link>
      </div>

      <div className="header-content-wrapper">
        <div className="search-bar">
          {/* HOME - Solo per consumer (nel legacy: rendered="#{roleService['ROLE_CONSUMER']}") */}
          {isConsumer && (
            <div className={`nav-item ${location.pathname === '/home' ? 'active' : ''}`}>
              <Link to="/home" className="nav-link">
                <i className="fas fa-home"></i>
                <span>{t('resourceBundle.HOME', 'HOME')}</span>
              </Link>
            </div>
          )}

          {/* SCHEDA PERSONALE / IMPOSTAZIONE - Solo per business (prima voce per business nel legacy) */}
          {isBusiness && (
            <div className={`nav-item ${isActive('/business') && !location.search.includes('tab=2') ? 'active' : ''}`}>
              <Link to="/business" className="nav-link">
                <i className="far fa-id-card"></i>
                <span>{user?.team?.type?.id === 'CLINIC' ? 'IMPOSTAZIONE' : t('resourceBundle.Personal_form', 'Scheda Personale')}</span>
              </Link>
            </div>
          )}

          {/* MEDICI - Per consumer e admin */}
          {(isConsumer || isAdmin) && (
            <div className={`nav-item ${location.pathname === '/consumer' && location.search.includes('tab=6') && location.search.includes('type=3') ? 'active' : ''}`}>
              <Link to="/consumer?tab=6&type=3" className="nav-link">
                <i className="fas fa-user-md"></i>
                <span>{t('resourceBundle.DOCTORS', 'MEDICI')}</span>
              </Link>
            </div>
          )}

          {/* CENTRI SPECIALISTICI - Per consumer, admin, o business doctor */}
          {(isConsumer || isAdmin || (isBusiness && user?.team?.type?.id === 'DOCTOR')) && (
            <div className={`nav-item ${location.pathname === '/consumer' && location.search.includes('tab=6') && location.search.includes('type=4') ? 'active' : ''}`}>
              <Link to="/consumer?tab=6&type=4" className="nav-link">
                <i className="fas fa-hospital"></i>
                <span>
                  {t('resourceBundle.CENTERS', 'CENTRI')}<br />
                  {t('resourceBundle.SPECIALIZED', 'SPECIALISTICI')}
                </span>
              </Link>
            </div>
          )}

          {/* USERS - Solo per admin */}
          {isAdmin && (
            <div className={`nav-item ${isActive('/administration') && location.search.includes('tab=0') ? 'active' : ''}`}>
              <Link to="/administration?tab=0" className="nav-link">
                <i className="fas fa-users"></i>
                <span>{t('resourceBundle.USERS', 'UTENTI')}</span>
              </Link>
            </div>
          )}

          {/* NETWORK - Solo per admin */}
          {isAdmin && (
            <div className={`nav-item ${isActive('/administration') && location.search.includes('tab=1') ? 'active' : ''}`}>
              <Link to="/administration?tab=1" className="nav-link">
                <i className="fas fa-code-branch"></i>
                <span>{t('resourceBundle.NETWORK', 'NETWORK')}</span>
              </Link>
            </div>
          )}

          {/* PARTNERS - Solo per admin */}
          {isAdmin && (
            <div className={`nav-item ${isActive('/profile') && location.search.includes('tab=1') ? 'active' : ''}`}>
              <Link to="/profile?tab=1" className="nav-link">
                <i className="fas fa-handshake"></i>
                <span>{t('resourceBundle.PARTNERS', 'PARTNERS')}</span>
              </Link>
            </div>
          )}

          {/* BLOG - Per consumer, admin e business */}
          {(isConsumer || isAdmin || isBusiness) && (
            <div className={`nav-item ${isActive('/blog')}`}>
              <Link to="/blog" className="nav-link">
                <i className="fas fa-newspaper"></i>
                <span>{t('resourceBundle.BLOG', 'BLOG')}</span>
              </Link>
            </div>
          )}

          {/* FORUM - Solo per consumer */}
          {isConsumer && (
            <div className={`nav-item ${isActive('/forum')}`}>
              <Link to="/forum" className="nav-link">
                <i className="fas fa-comments"></i>
                <span>{t('resourceBundle.FORUM', 'FORUM')}</span>
              </Link>
            </div>
          )}

          {/* SETTINGS - Dropdown per admin */}
          {isAdmin && (
            <div className="nav-item more">
              <div className="more-dropdown more-with-triangle">
                <div className="mCustomScrollbar">
                  <ul className="account-settings">
                    <li>
                      <Link to="/profile?tab=3">
                        <span>{t('resourceBundle.Examinations_Pathologies', 'Esami e Patologie')}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/profile?tab=4">
                        <span>{t('resourceBundle.Blog_post_categories', 'Categorie Blog')}</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <a href="#" className="nav-link">
                <i className="fas fa-cogs"></i>
                <span>{t('resourceBundle.SETTINGS', 'IMPOSTAZIONI')}<i className="fas fa-caret-down" style={{ marginLeft: '5px' }}></i></span>
              </a>
            </div>
          )}

          {/* ESAMI - Dropdown per consumer */}
          {isConsumer && (
            <div className="nav-item more">
              <div className="more-dropdown more-with-triangle">
                <div className="mCustomScrollbar">
                  <ul className="account-settings">
                    <li>
                      <Link to="/consumer?tab=4">
                        <span>{t('resourceBundle.My_agenda', 'Mia Agenda')}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/consumer?tab=2">
                        <span>{t('resourceBundle.Checks', 'Controlli')}</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <a href="#" className="nav-link">
                <i className="fas fa-clipboard-list" style={{ color: 'white' }}></i>
                <span>{t('resourceBundle.EXAMS', 'ESAMI')}<i className="fas fa-caret-down" style={{ marginLeft: '5px' }}></i></span>
              </a>
            </div>
          )}

          {/* PROFILO - Dropdown per tutti */}
          <div className="nav-item more">
            <div className="more-dropdown more-with-triangle">
              <div className="mCustomScrollbar">
                <ul className="account-settings">
                  {isConsumer && (
                    <>
                      <li>
                        <Link to="/consumer?tab=3">
                          <span>{t('resourceBundle.Advanced_Screening', 'Screening Avanzato')}</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/consumer?tab=0">
                          <span>{t('resourceBundle.Medical_history', 'Storia Clinica')}</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/consumer?tab=5">
                          <span>{t('resourceBundle.Menses_calendar', 'Calendario Mestruale')}</span>
                        </Link>
                      </li>
                    </>
                  )}
                  <li>
                    <Link to="/profile?tab=0">
                      <span>{t('resourceBundle.Change_password', 'Cambia Password')}</span>
                    </Link>
                  </li>
                  {isConsumer && (
                    <li>
                      <Link to="/consumer?tab=10">
                        <span>I miei referti</span>
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            </div>
            <Link to="/profile?tab=0" className="nav-link">
              <i className="fas fa-user" style={{color: '#fff'}}></i>
              <span style={{color: '#fff'}}>{user?.team?.type?.id === 'CLINIC' ? 'GESTIONE ACCOUNT' : t('resourceBundle.PROFILE', 'PROFILO')}<i className="fas fa-caret-down" style={{ marginLeft: '5px' }}></i></span>
            </Link>
          </div>

          {/* GESTIONE REFERTI - Solo per business */}
          {isBusiness && (
            <div className="nav-item more">
              <div className="more-dropdown more-with-triangle">
                <div className="mCustomScrollbar">
                  <ul className="account-settings">
                    <li>
                      <Link to="/hospitalization">
                        <span>Carica Documenti</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/hospitalization?tab=generateCode">
                        <span>Genera codice</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <a href="#" className="nav-link">
                <i className="fas fa-notes-medical" style={{ color: 'white' }}></i>
                <span>GESTIONE REFERTI<i className="fas fa-caret-down" style={{ marginLeft: '5px' }}></i></span>
              </a>
            </div>
          )}

          {/* INVIO RELAZIONI / DOCUMENTI SHOP - Solo per business con linkshop */}
          {isBusiness && user?.team?.linkshop && (
            <div className={`nav-item ${isActive('/documentshop')}`}>
              <Link to="/documentshop" className="nav-link">
                <i className="fas fa-folder-open"></i>
                <span>{user?.team?.type?.id === 'CLINIC' ? 'INVIO RELAZIONI' : 'DOCUMENTI SHOP'}</span>
              </Link>
            </div>
          )}

          {/* DOCUMENTI SHOP - Solo per business doctor senza linkshop */}
          {isBusiness && user?.team?.type?.id === 'DOCTOR' && !user?.team?.linkshop && (
            <div className={`nav-item ${isActive('/documentshop')}`}>
              <Link to="/documentshop" className="nav-link">
                <i className="fas fa-folder-open"></i>
                <span>DOCUMENTI SHOP</span>
              </Link>
            </div>
          )}

          {/* STORIA CLINICA - Solo per consumer */}
          {isConsumer && (
            <div className="nav-item">
              <a href="#" className="nav-link" onClick={handleDownloadPDF}>
                <img
                  src="/styles/olympus/assets/images/pinkcare_icon.png"
                  alt=""
                  className="immages_bow"
                />
                <span>{t('resourceBundle.CLINICAL_HISTORY', 'STORIA CLINICA')}</span>
              </a>
            </div>
          )}
        </div>

        {/* Control Block - come nel legacy */}
        <div className="control-block">
          {/* Notifiche con dropdown on click */}
          <div className="notif-bell-wrapper" ref={notifDropdownRef}>
            <button className="notif-bell-btn" onClick={toggleNotifDropdown} title={t('notifications.notifications', 'Notifiche')}>
              <i className="fas fa-bell"></i>
              {unreadNotifications.length > 0 && (
                <span className="notif-badge">{unreadNotifications.length}</span>
              )}
            </button>

            {notifDropdownOpen && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <h6>{t('notifications.notifications', 'Notifiche')}</h6>
                  {unreadNotifications.length > 0 && (
                    <a href="#" onClick={handleMarkAllAsRead}>
                      {t('notifications.mark_all_as_read', 'Segna tutte come lette')}
                    </a>
                  )}
                </div>

                <div className="notif-dropdown-body">
                  {unreadNotifications.length === 0 ? (
                    <div className="notif-empty">
                      <i className="far fa-bell-slash"></i>
                      <p>{t('notifications.no_notifications', 'Nessuna notifica da leggere')}</p>
                    </div>
                  ) : (
                    <ul className="notif-list">
                      {unreadNotifications.map((n) => (
                        <li key={n.id} className="notif-item">
                          <span className="notif-item-icon">
                            {n.typology?.id == 10 && <i className="fas fa-key"></i>}
                            {n.typology?.id == 12 && <i className="fas fa-file-signature"></i>}
                            {n.typology?.id == 11 && <i className="fas fa-clipboard-check"></i>}
                            {n.typology?.id == 13 && <i className="fas fa-stethoscope"></i>}
                          </span>
                          <a href="#" className="notif-item-content" onClick={(e) => handleNotificationClick(e, n.id)}>
                            <span className="notif-item-title">{n.title}</span>
                            <span className="notif-item-date">
                              {n.insertionDate ? new Date(n.insertionDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                            </span>
                          </a>
                          <button className="notif-item-dismiss" onClick={(e) => handleMarkAsRead(e, n.id)} title={t('notifications.mark_as_read', 'Segna come letto')}>
                            <i className="fas fa-times"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Link to="/profile?tab=2" className="notif-dropdown-footer" onClick={() => setNotifDropdownOpen(false)}>
                  {t('notifications.show_all', 'Mostra tutte')}
                </Link>
              </div>
            )}
          </div>

          {/* Pulsante Logout */}
          <div className="nav-item">
            <a href="#" onClick={(e) => { e.preventDefault(); AuthService.removeToken(); window.location.href = '/'; }} className="nav-link logout" title="Logout">
              <i className="fas fa-power-off"></i>
            </a>
          </div>

          {/* Pulsante Premium */}
          <div className="nav-item">
            <a href="#" className="nav-link premium">
              <i className="fas fa-crown"></i>
              <span>{t('resourceBundle.Premium', 'Passa a Premium')}</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AuthenticatedHeader;
