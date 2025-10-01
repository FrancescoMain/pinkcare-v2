import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
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
          {/* HOME - Solo per consumer */}
          {isConsumer && (
            <div className={`nav-item ${isActive('/profile')}`}>
              <Link to="/profile" className="nav-link">
                <i className="fas fa-home"></i>
                <span>{t('resourceBundle.HOME', 'HOME')}</span>
              </Link>
            </div>
          )}

          {/* MEDICI - Per consumer e admin */}
          {(isConsumer || isAdmin) && (
            <div className={`nav-item ${isActive('/business') && location.search.includes('tab=1') ? 'active' : ''}`}>
              <Link to="/business?tab=1" className="nav-link">
                <i className="fas fa-user-md"></i>
                <span>{t('resourceBundle.DOCTORS', 'MEDICI')}</span>
              </Link>
            </div>
          )}

          {/* CENTRI SPECIALISTICI - Per consumer, admin, o doctor */}
          {(isConsumer || isAdmin || (isBusiness && user?.team?.type?.id === 'DOCTOR')) && (
            <div className={`nav-item ${isActive('/business') && location.search.includes('tab=2') ? 'active' : ''}`}>
              <Link to="/business?tab=2" className="nav-link">
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
                <i className="fas fa-clipboard-list"></i>
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
              <i className="fas fa-user"></i>
              <span>{user?.team?.type?.id === 'CLINIC' ? 'GESTIONE ACCOUNT' : t('resourceBundle.PROFILE', 'PROFILO')}<i className="fas fa-caret-down" style={{ marginLeft: '5px' }}></i></span>
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
            <div className={`nav-item ${isActive('/clinical-history')}`}>
              <a href="/api/consumer/download-details" className="nav-link" target="_blank" rel="noopener noreferrer">
                <span className="immages_bow"></span>
                <span>{t('resourceBundle.CLINICAL_HISTORY', 'STORIA CLINICA')}</span>
              </a>
            </div>
          )}
        </div>

        {/* User Controls */}
        <div className="control-block-button">
          <a href="#" className="btn btn-control bg-primary">
            <i className="fas fa-bell"></i>
          </a>

          <div className="author-page author vcard inline-items more">
            <div className="author-thumb">
              <img
                src={user?.team?.logo || '/styles/olympus/assets/images/avatar.jpg'}
                alt="User"
                className="avatar"
              />
              <span className="icon-status online"></span>
            </div>
            <span className="author-name fn">
              {user?.name || 'Utente'}
            </span>

            {/* Dropdown menu */}
            <div className="more-dropdown more-with-triangle">
              <div className="mCustomScrollbar">
                <ul className="account-settings">
                  <li>
                    <Link to="/settings">
                      <i className="fas fa-cog"></i>
                      <span>{t('resourceBundle.Settings', 'Impostazioni')}</span>
                    </Link>
                  </li>
                  <li>
                    <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>
                      <i className="fas fa-sign-out-alt"></i>
                      <span>{t('resourceBundle.Logout', 'Esci')}</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="more">
            <i className="fas fa-ellipsis-h"></i>
          </div>
        </div>
      </div>

      {/* Pulsante Premium */}
      <a href="#" className="btn btn-control premium-button">
        <i className="fas fa-crown"></i>
        {t('resourceBundle.Premium', 'Passa a Premium')}
      </a>
    </header>
  );
};

export default AuthenticatedHeader;
