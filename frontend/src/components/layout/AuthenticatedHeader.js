import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { downloadClinicalHistoryPDF } from '../../services/clinicalHistoryApi';
import './AuthenticatedHeader.css';

/**
 * AuthenticatedHeader Component
 * Replica esattamente l'header del legacy standard.xhtml per utenti autenticati
 */
const AuthenticatedHeader = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuth();

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
          {/* HOME - Per consumer e business */}
          {(isConsumer || isBusiness) && (
            <div className={`nav-item ${location.pathname === '/home' ? 'active' : ''}`}>
              <Link to="/home" className="nav-link">
                <i className="fas fa-home"></i>
                <span>{t('resourceBundle.HOME', 'HOME')}</span>
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

          {/* CENTRI SPECIALISTICI - Per consumer, admin, o doctor */}
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

          {/* IMPOSTAZIONE / Personal form - Solo per business */}
          {isBusiness && (
            <div className={`nav-item ${isActive('/business') && !location.search.includes('tab=2') ? 'active' : ''}`}>
              <Link to="/business" className="nav-link">
                <i className="far fa-id-card"></i>
                <span>{user?.team?.type?.id === 'CLINIC' ? 'IMPOSTAZIONE' : t('resourceBundle.Personal_form', 'Scheda Personale')}</span>
              </Link>
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
                <i className="fas fa-notes-medical"></i>
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
          {/* Notifiche con dropdown */}
          <div className="control-icon more has-items">
            <i className="fas fa-bell" style={{color: '#fff'}}></i>
            <div className="more-dropdown more-with-triangle triangle-top-center">
              <div className="ui-block-title ui-block-title-small">
                <h6 className="title">Notifiche</h6>
              </div>
              <div className="mCustomScrollbar">
                <ul className="notification-list">
                  <li>
                    <p>Nessuna notifiche da leggere</p>
                  </li>
                </ul>
              </div>
              <Link to="/profile?tab=2" className="view-all bg-primary">
                Mostra tutte
              </Link>
            </div>
          </div>

          {/* Pulsante Logout */}
          <div className="nav-item">
            <a href="#" onClick={(e) => { e.preventDefault(); logout(); }} className="nav-link logout" title="Logout">
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
