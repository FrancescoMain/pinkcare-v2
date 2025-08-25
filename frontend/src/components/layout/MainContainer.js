import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import './MainContainer.css';

const MainContainer = ({ userVO = null, children }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { showSuccessMessage, showErrorMessage } = useErrorHandler();

  // Gestione del contenuto basato sulla route
  const getMainContent = () => {
    switch (location.pathname) {
      case '/about':
        return (
          <div className="about-content">
            <h4 className="main-heading2">Chi siamo</h4>
            
            <p style={{ textAlign: 'justify' }}>
              PinkCare è il primo portale dedicato alla salute femminile: una piattaforma con la finalità 
              di supportare le Donne nel proprio percorso di <strong>prevenzione</strong>, <strong>benessere</strong> e <strong>cura</strong>.
            </p>
            
            <p style={{ textAlign: 'justify' }}>
              PinkCare è una piattaforma in grado di offrire alle Utenti un servizio di <strong>tutoring personalizzato</strong> 
              in base all'età e alla storia clinica. Registrandosi gratuitamente a PinkCare è possibile ottenere 
              il proprio <strong>Piano di prevenzione</strong> e <strong>cura personalizzato</strong> e ricevere notifiche e aggiornamenti su visite 
              ed esami da effettuare per proteggere la propria salute.
            </p>
            
            <p style={{ textAlign: 'justify' }}> 
              All'interno della propria area personale è possibile archiviare referti, documenti e altre informazioni 
              mediche e trovare gli articoli del blog selezionati in base alla propria fascia d'età e ai propri interessi. 
              La scheda sanitaria online potrà essere condivisa con il proprio specialista di fiducia, in modo da fornire 
              notizie complete circa il proprio stato di salute.
              PinkCare suggerisce gli appuntamenti più importanti per la propria agenda della salute e aiuta a trovare 
              specialisti e strutture per eseguire visite ed esami. Per fornire alle Utenti un elevato standard di qualità 
              delle prestazioni, su PinkCare troverai solo professionisti rispondenti alle procedure di qualità definite dal Comitato scientifico.
            </p>
          </div>
        );
      
      default:
        // Home content - renderizza i children (Home component)
        return children;
    }
  };

  // Gestione del title della pagina
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/about':
        return 'PinkCare - Chi siamo';
      default:
        return 'PinkCare: il primo portale dedicato alla salute femminile';
    }
  };

  useDocumentTitle(getPageTitle());

  // Stati per il form di registrazione
  const [newUser, setNewUser] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    birthday: '',
    gender: null,
    nick_name: '',
    agree_condition_and_privacy: false,
    agree_marketing: false,
    agree_newsletter: false
  });

  // Stati per form di login mobile
  const [mobileLoginData, setMobileLoginData] = useState({
    j_username: '',
    j_password: '',
    _spring_security_remember_me: false
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMobileLoginChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMobileLoginData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMobileLogin = (e) => {
    e.preventDefault();
    console.log('Mobile Login:', mobileLoginData);
    
    // Simulazione login
    if (mobileLoginData.j_username === 'error@test.com') {
      showErrorMessage(t('authentication.authentication_error', 'Errore di autenticazione'));
      return;
    }
    
    showSuccessMessage('Login Mobile', 'Login effettuato con successo');
  };

  const handleRegistration = (e) => {
    e.preventDefault();
    
    // Validazione base
    if (!newUser.name || !newUser.surname || !newUser.email || !newUser.password) {
      showErrorMessage('Errore di validazione', 'Tutti i campi obbligatori devono essere compilati');
      return;
    }
    
    if (!newUser.agree_condition_and_privacy) {
      showErrorMessage('Errore', 'Devi accettare i termini e condizioni');
      return;
    }

    // Conferma registrazione
    const confirmed = window.confirm(t('authentication.have_you_verified_all_your_data', 'Hai verificato tutti i tuoi dati') + '?');
    if (!confirmed) return;
    
    console.log('Registration:', newUser);
    showSuccessMessage('Registrazione', 'Registrazione completata con successo!');
  };

  const handlePasswordForgot = () => {
    console.log('Password dimenticata per:', mobileLoginData.j_username);
    showSuccessMessage('Recovery', 'Email di recupero inviata');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      {/* Start Main Container Area */}
      <div className="container main-container" style={{ marginTop: '30px' }}>
        <div className="row">
          {/* Form di login mobile - visible-xs */}
          <form 
            id="f" 
            name="f" 
            className="content visible-xs" 
            method="post" 
            onSubmit={handleMobileLogin}
          >
            <input type="hidden" id="j_action" name="j_action" value="null" />
            
            <div className="container resp_log">
              {!userVO?.team && (
                <div className="row">
                  <div className="col-xs-12">
                    <div className="border_input">
                      <input 
                        name="j_username" 
                        value={mobileLoginData.j_username}
                        onChange={handleMobileLoginChange}
                        className="autocomplete log" 
                        autoCapitalize="off" 
                        placeholder={t('authentication.email', 'Email')}
                      />
                      <input 
                        name="j_password" 
                        type="password" 
                        value={mobileLoginData.j_password}
                        onChange={handleMobileLoginChange}
                        placeholder={t('authentication.password', 'Password')} 
                        className="autocomplete log"
                      />
                    </div>
                  </div>
                  <div className="col-xs-12">
                    <button 
                      id="signin" 
                      name="submit" 
                      type="submit" 
                      className="btn btn-block btn-secondary"
                    >
                      {t('authentication.login_caps', 'LOGIN')}
                    </button>
                    
                    <div className="item" style={{ height: '10px' }}></div>
                  </div>
                </div>
              )}
            </div>
            
            {!userVO?.team && (
              <>
                <div className="col-xs-6 col-md-6">
                  <label>
                    <input 
                      id="_spring_security_remember_me" 
                      name="_spring_security_remember_me" 
                      type="checkbox"
                      checked={mobileLoginData._spring_security_remember_me}
                      onChange={handleMobileLoginChange}
                    />
                    {' '}{t('authentication.remember_me', 'Resta collegato')}
                  </label>
                </div>
                <div className="col-xs-6 col-md-6">
                  <a 
                    onClick={handlePasswordForgot}
                    className="forgot" 
                    style={{ cursor: 'pointer' }}
                  >
                    {t('authentication.forgot_my_password', 'Password dimenticata?')}
                  </a>
                </div>
              </>
            )}
          </form>

          {/* Start Appointment Image Area */}
          <div className="col-md-6 col-xs-12">
            {getMainContent()}
          </div>
          <div className="col-md-1 col-sm-12 col-xs-12"></div>
          {/* End Appointment Image Area */}

          {/* Start Content Area */}
          <div className="col-md-5 col-sm-12 col-xs-12">
            {/* Start Registration Form */}
            <div>
              <h4 className="main-heading2" style={{ marginBottom: '30px' }}>
                <i className="fas fa-pencil-square-o"></i>
                {t('standard_public.subscribe', 'Iscriviti')}*
              </h4>
              <p>*{t('standard_public.free_membership', 'Iscrizione completamente gratuita, non sono richiesti dati economici')}</p>
              
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
                    </div>
                  </div>
                  
                  <div className="col-xs-12 col-sm-12 col-md-6">
                    <input 
                      type="date"
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
                    >
                      <option value="">{t('authentication.gender', 'Sesso')}</option>
                      <option value="true">{t('authentication.male', 'Uomo')}</option>
                      <option value="false">{t('authentication.female', 'Donna')}</option>
                    </select>
                  </div>
                  <div className="col-xs-12 col-sm-12">
                    <input 
                      name="nick_name"
                      value={newUser.nick_name}
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
                          name="agree_condition_and_privacy"
                          checked={newUser.agree_condition_and_privacy}
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
                          name="agree_marketing"
                          checked={newUser.agree_marketing}
                          onChange={handleInputChange}
                        />
                        {' '}{t('authentication.yes_marketing', 'Mi piacerebbe ricevere aggiornamenti sulle promozioni e offerte')}
                      </label><br/>
                      <label>
                        <input 
                          type="checkbox"
                          name="agree_newsletter"
                          checked={newUser.agree_newsletter}
                          onChange={handleInputChange}
                        />
                        {' '}{t('authentication.yes_newsletter', 'Mi piacerebbe ricevere la newsletter di PinkCare')}
                      </label>
                    </div>
                    <button 
                      type="submit"
                      className="btn btn-secondary"
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
        </div>
      </div>
    </>
  );
};

export default MainContainer;