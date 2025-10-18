import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import "./style.css";
import PageHead from "../../layout/PageHead";
import { getPageConfig } from "../../../config/pageConfig";
import { MainCarousel } from "../../Carousel";
import DateInput from '../../DateInput';
import { ApiError } from '../../../config/api';
import { AuthService } from '../../../services/authService';
import About from '../About';
import Accreditation from '../Accreditation';
import BlogList from '../BlogList';
import PrivacyPolicy from '../PrivacyPolicy';

const Home = ({ userVO = null, errorHandler }) => {
  const { t } = useTranslation();
  const { showSuccessMessage, showErrorMessage } = errorHandler || {};
  const location = useLocation();
  const pageData = getPageConfig("home");

  // Stato per gestire il tab attivo
  const [activeTab, setActiveTab] = useState('home');

  // Stati per il form di registrazione
  const [newUser, setNewUser] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    birthday: '',
    gender: null,
    nickName: '',
    agreeConditionAndPrivacy: false,
    agreeMarketing: false,
    agreeNewsletter: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', className: '' });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState('right');

  // useEffect per gestire i query parameters dell'URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');

    if (tab) {
      setActiveTab(tab);
    } else {
      setActiveTab('home');
    }
  }, [location.search]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const processedValue = type === 'checkbox' ? checked : value;
    
    // Handle password strength feedback
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
    
    setNewUser(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    
    if (!showSuccessMessage || !showErrorMessage) {
      console.warn('Error handler not available');
      return;
    }
    
    // Validazione base
    if (!newUser.name || !newUser.surname || !newUser.email || !newUser.password) {
      showErrorMessage('Errore di validazione', 'Tutti i campi obbligatori devono essere compilati');
      return;
    }
    
    if (!newUser.agreeConditionAndPrivacy) {
      showErrorMessage('Errore', 'Devi accettare i termini e condizioni');
      return;
    }

    // Conferma registrazione
    const confirmed = window.confirm(t('authentication.have_you_verified_all_your_data', 'Hai verificato tutti i tuoi dati') + '?');
    if (!confirmed) return;
    
    try {
      // Preparazione dati per il backend
      const registrationData = {
        ...newUser,
        // Converti gender da string a boolean per il backend
        gender: newUser.gender === 'true' ? true : newUser.gender === 'false' ? false : null,
        // Assicurati che i boolean siano inviati correttamente
        agreeConditionAndPrivacy: newUser.agreeConditionAndPrivacy,
        agreeMarketing: newUser.agreeMarketing,
        agreeNewsletter: newUser.agreeNewsletter
      };
      
      console.log('Sending registration data:', registrationData);
      
      // Chiamata API tramite AuthService
      const result = await AuthService.registerConsumer(registrationData);
      
      // Registrazione riuscita
      showSuccessMessage('Registrazione', result.message || 'Registrazione completata con successo!');
      
      // Reset form
      setNewUser({
        name: '',
        surname: '',
        email: '',
        password: '',
        birthday: '',
        gender: null,
        nickName: '',
        agreeConditionAndPrivacy: false,
        agreeMarketing: false,
        agreeNewsletter: false
      });
      
      // Salva il token per login automatico
      if (result.token) {
        AuthService.setToken(result.token);
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof ApiError) {
        if (error.isValidationError()) {
          // Errori di validazione specifici - mostra come nel vecchio JSF
          const errorMessages = error.details.map(detail => {
            const message = detail.msg;
            return `* ${message}`;
          }).join('\n');
          showErrorMessage('', errorMessages);
        } else if (error.isConflictError()) {
          // Email già esistente
          showErrorMessage('Errore di registrazione', error.message);
        } else if (error.isAuthError()) {
          // Problema di autenticazione
          showErrorMessage('Errore di autenticazione', error.message);
        } else {
          // Altri errori API
          showErrorMessage('Errore di registrazione', error.message || 'Errore durante la registrazione');
        }
      } else {
        // Errore di connessione o generico
        showErrorMessage('Errore di connessione', 'Impossibile completare la registrazione. Controlla la connessione internet.');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handlePasswordFocus = (e) => {
    setIsPasswordFocused(true);
    
    // Calcola se c'è spazio per il tooltip a destra
    setTimeout(() => {
      const inputRect = e.target.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const tooltipWidth = 200;
      const spaceNeeded = inputRect.right + 10 + tooltipWidth;
      
      if (spaceNeeded > windowWidth) {
        setTooltipPosition('left');
      } else {
        setTooltipPosition('right');
      }
    }, 0);
  };

  const handlePasswordBlur = () => {
    setIsPasswordFocused(false);
  };


  const calculatePasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength({ score: 0, label: '', className: '' });
      return;
    }

    let score = 0;
    let label = '';
    let className = '';

    // Check length
    if (password.length >= 8) score += 1;
    
    // Check for letters
    if (/[A-Za-z]/.test(password)) score += 1;
    
    // Check for numbers
    if (/\d/.test(password)) score += 1;
    
    // Check for special characters
    if (/[_@./#+-]/.test(password)) score += 1;
    
    // Check for mixed case
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;

    // Determine strength label and color
    if (score <= 2) {
      label = t('authentication.weak', 'Debole') + ' ' + t('authentication.min8chars_alphanumeric', '(min 8 caratteri alfanumerici)');
      className = 'password-weak';
    } else if (score <= 3) {
      label = t('authentication.good', 'Buona') + ' ' + t('authentication.min8chars_alphanumeric', '(min 8 caratteri alfanumerici)');
      className = 'password-good';
    } else {
      label = t('authentication.strong_label', 'Forte') + ' ' + t('authentication.min8chars_alphanumeric', '(min 8 caratteri alfanumerici)');
      className = 'password-strong';
    }

    setPasswordStrength({ score, label, className });
  };

  // Funzione per renderizzare il contenuto corretto basato sul tab attivo
  const renderTabContent = () => {
    switch (activeTab) {
      case 'about_us':
        return <About />;
      case 'blog_list':
        return <BlogList />;
      case 'accreditation_pinkcare':
        return <Accreditation />;
      case 'general_policy':
        return <PrivacyPolicy />;
      case 'home':
      default:
        return renderHomeContent();
    }
  };

  // Contenuto originale della home (form di registrazione + carousel)
  const renderHomeContent = () => (
    <>
      {/* Start Appointment Image Area - carousel section */}
      <div className="col-md-6 col-xs-12">
        <MainCarousel />
      </div>
      <div className="col-md-1 col-sm-12 col-xs-12"></div>
      {/* End Appointment Image Area */}

      {/* Start Content Area - registration section */}
      <div className="col-md-5 col-sm-12 col-xs-12">
        {/* Start Registration Form */}
        <div className="row">
          {/* Titolo che occupa tutta la riga */}
          <div className="col-xs-12">
            <h4 className="main-heading2" style={{ marginBottom: '30px' }}>
              <i className="fas fa-pencil-square-o"></i>
              {t('standard_public.subscribe', 'Iscriviti')}*
            </h4>
          </div>

          {/* Tab Navigation - compact styling */}
          <div className="col-md-6 col-sm-6 col-xs-6 tab-button tab-active">
            <h5>Privato</h5>
          </div>
          <div className="col-md-6 col-sm-6 col-xs-6 tab-button tab-inactive">
            <h5>
              <a href="/login?page=register_business" style={{ color: '#e42080', textDecoration: 'none' }}>
                Struttura / Medico
              </a>
            </h5>
          </div>

          {/* Testo esplicativo che occupa tutta la riga */}
          <div className="col-xs-12">
            <p>*{t('standard_public.free_membership', 'Iscrizione completamente gratuita, non sono richiesti dati economici')}</p>
          </div>

          <form className="content" autoComplete="off" onSubmit={handleRegistration}>
            <div className="row">
              <div className="col-xs-12 col-sm-12 col-md-6">
                <input
                  name="name"
                  value={newUser.name}
                  onChange={handleInputChange}
                  placeholder={t('authentication.first_name', 'Nome')}
                  className="form-control"
                  required
                />
              </div>
              <div className="col-xs-12 col-sm-12 col-md-6">
                <input
                  name="surname"
                  value={newUser.surname}
                  onChange={handleInputChange}
                  placeholder={t('authentication.last_name', 'Cognome')}
                  className="form-control"
                  required
                />
              </div>
              <div className="col-xs-12 col-sm-12 col-md-6">
                <input
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder={t('authentication.email', 'Email')}
                  autoComplete="off"
                  pattern="^(([a-zA-Z0-9_+.-]+)@([a-zA-Z0-9][a-zA-Z0-9_.-]+).([a-zA-Z]+))$"
                />
              </div>
              <div className="col-xs-12 col-sm-12 col-md-6">
                <div style={{ position: 'relative' }}>
                  <input style={{ opacity: 0, position: 'absolute' }} />
                  <input type="password" style={{ opacity: 0, position: 'absolute' }} />
                  <input
                    id="eye-field"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={handleInputChange}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    placeholder={t('authentication.password', 'Password')}
                    className="form-control"
                    autoComplete="new-password"
                    pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d_@./#+-]{8,}$"
                    title={t('authentication.min8chars_alphanumeric', '(min 8 caratteri alfanumerici)')}
                    required
                  />
                  <span
                    toggle="#eye-field"
                    className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} field-icon toggle-password`}
                    onClick={togglePasswordVisibility}
                    style={{ cursor: 'pointer' }}
                  ></span>
                  {passwordStrength.label && isPasswordFocused && (
                    <div className={`password-strength-indicator ${passwordStrength.className} tooltip-${tooltipPosition}`}>
                      {passwordStrength.label}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-xs-12 col-sm-12 col-md-6">
                <DateInput
                  name="birthday"
                  value={newUser.birthday}
                  onChange={handleInputChange}
                  placeholder={t('authentication.your_birthday', 'Data di nascita')}
                  className="form-control"
                  required
                />
              </div>
              <div className="col-xs-12 col-sm-12 col-md-6">
                <select
                  name="gender"
                  value={newUser.gender || ''}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="" disabled>{t('authentication.gender', 'Sesso')}</option>
                  <option value="true">{t('authentication.male', 'Uomo')}</option>
                  <option value="false">{t('authentication.female', 'Donna')}</option>
                </select>
              </div>
              <div className="col-xs-12 col-sm-12">
                <input
                  name="nickName"
                  value={newUser.nickName}
                  onChange={handleInputChange}
                  placeholder={t('authentication.nick_name', 'Nick name forum')}
                  className="form-control"
                  required
                />
              </div>
              <div className="col-xs-12 col-sm-12">
                <div className="">
                  {t('standard_public.consent_to_processing_sensitive_data', 'CONSENSO AL TRATTAMENTO DEI DATI SENSIBILI')}<br/>
                  {t('standard_public.i_declare', 'Dichiaro di aver letto e compreso')}
                  {' '}<a href="/disclosure" target="_blank">{t('standard_public.disclosure', "l'informativa")}</a>{' '}
                  {t('standard_public.processing_of_my_personal_data', 'per il trattamento dei dati anagrafici e sensibili e acconsento al trattamento che riguarderà i dati personali idonei a rivelare lo stato di salute del sottoscritto.')}<br/>
                  <label>
                    <input
                      type="checkbox"
                      name="agreeConditionAndPrivacy"
                      checked={newUser.agreeConditionAndPrivacy}
                      onChange={handleInputChange}
                      required
                    />
                    {' '}{t('standard_public.agree_to_receive', 'Acconsento per ricevere il mio piano di prevenzione')}
                  </label><br/>
                  {t('standard_public.consent_to_processing_personal_data', 'CONSENSO AL TRATTAMENTO DEI DATI PERSONALI')}<br/>
                  {t('standard_public.i_declare', 'Dichiaro di aver letto e compreso')}
                  {' '}<a href="/privacy-policy" target="_blank">{t('standard_public.disclosure', "l'informativa")}</a>{' '}
                  {t('standard_public.processing_of_my_data_for_marketing', 'per il trattamento dei dati per finalità di marketing. Acconsento quindi al trattamento dei dati personali da me comunicati. In particolare:')}<br/>
                  <label>
                    <input
                      type="checkbox"
                      name="agreeMarketing"
                      checked={newUser.agreeMarketing}
                      onChange={handleInputChange}
                    />
                    {' '}{t('authentication.yes_marketing', 'Mi piacerebbe ricevere aggiornamenti sulle promozioni e offerte')}
                  </label><br/>
                  <label>
                    <input
                      type="checkbox"
                      name="agreeNewsletter"
                      checked={newUser.agreeNewsletter}
                      onChange={handleInputChange}
                    />
                    {' '}{t('authentication.yes_newsletter', 'Mi piacerebbe ricevere la newsletter di PinkCare')}
                  </label>
                </div>
              </div>
              <div className="col-xs-12 col-sm-12">
                <button
                  type="submit"
                  className="btn btn-secondary"
                  style={{ padding: 0 }}
                >
                  {t('authentication.complete_registration', 'REGISTRATI')}
                </button>
              </div>
            </div>
          </form>
        </div>
        {/* End Registration Form */}
      </div>
      {/* End Content Area */}
    </>
  );

  return (
    <>
      <PageHead
        title={pageData.title}
        description={pageData.description}
        keywords={pageData.keywords}
        author={pageData.author}
        ogType="website"
        themeColor="#e42080"
        links={pageData.links || []}
      />
      <div className="home-page">
        {renderTabContent()}
      </div>
    </>
  );
};

export default Home;
