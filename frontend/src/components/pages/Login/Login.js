import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './style.css';
import PageHead from '../../layout/PageHead';
import { ApiError } from '../../../config/api';
import { AuthService } from '../../../services/authService';
import ReferenceService from '../../../services/referenceService';
import { pageConfig } from '../../../config/pageConfig';

const STREET_TYPES = [
  'Via', 'Piazza', 'Corso', 'Viale', 'Largo', 'Contrada', 'Vicolo',
  'Circonvallazione', 'Galleria', 'Parco', 'Rotonda', 'Traversa',
  'Lungomare', 'Strada', 'Stretto', 'SC', 'SP', 'SR', 'SS',
];

const createEmptyAddress = () => ({
  streetType: '',
  street: '',
  streetNumber: '',
  postCode: '',
  municipality: '',
  province: '',
  region: '',
});

const getInitialDoctorData = () => ({
  name: '',
  surname: '',
  email: '',
  password: '',
  gender: '',
  medicalTitle: '',
  address: createEmptyAddress(),
  agreeToBeShown: false,
  agreeMarketing: false,
  agreeNewsletter: false,
});

const getInitialClinicData = () => ({
  structureName: '',
  email: '',
  password: '',
  address: createEmptyAddress(),
  agreeToBeShown: false,
  agreeMarketing: false,
  agreeNewsletter: false,
});

const LoginPage = ({ errorHandler }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { showSuccessMessage, showErrorMessage } = errorHandler || {};
  const loginPageConfig = pageConfig.login || {};

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  const defaultTab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const page = params.get('page');

    if (page) {
      const normalized = page.toLowerCase();
      if (normalized === 'authentication') {
        return 'AUTH';
      }
      if (normalized === 'register_business' || normalized === 'registration') {
        return 'BUSINESS';
      }
    }

    return 'BUSINESS';
  }, [location.search]);

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [businessType, setBusinessType] = useState('DOCTOR');
  const [doctorData, setDoctorData] = useState(getInitialDoctorData);
  const [clinicData, setClinicData] = useState(getInitialClinicData);
  const [showBusinessPassword, setShowBusinessPassword] = useState(false);
  const [medicalTitles, setMedicalTitles] = useState([]);
  const [municipalitySuggestions, setMunicipalitySuggestions] = useState([]);
  const [skipMunicipalitySearch, setSkipMunicipalitySearch] = useState(false);

  useEffect(() => {
    document.body.classList.add('login-page-active');
    return () => {
      document.body.classList.remove('login-page-active');
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    ReferenceService.getMedicalTitles()
      .then((response) => {
        if (isMounted) {
          setMedicalTitles(response || []);
        }
      })
      .catch((err) => console.error('Failed to load medical titles:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (skipMunicipalitySearch) {
      setSkipMunicipalitySearch(false);
      return;
    }

    const activeAddress = businessType === 'DOCTOR' ? doctorData.address : clinicData.address;
    const query = activeAddress.municipality;
    if (!query || query.length < 3) {
      setMunicipalitySuggestions([]);
      return;
    }

    let ignore = false;
    (async () => {
      try {
        const results = await ReferenceService.searchMunicipalities(query);
        if (!ignore) {
          setMunicipalitySuggestions(results || []);
        }
      } catch (err) {
        console.error('Municipality search failed:', err);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [businessType, doctorData.address.municipality, clinicData.address.municipality, skipMunicipalitySearch]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const handleLoginInputChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleLoginSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (!showSuccessMessage || !showErrorMessage) {
      console.warn('Error handler not available');
      return;
    }

    if (!loginData.email || !loginData.password) {
      showErrorMessage(
        t('authentication.login_error', 'Errore di autenticazione'),
        t('authentication.login_missing_fields', 'Inserisci email e password per continuare.'),
      );
      return;
    }

    setIsSubmittingLogin(true);

    try {
      const response = await AuthService.login(
        loginData.email,
        loginData.password,
        loginData.rememberMe,
      );

      if (response?.token) {
        AuthService.setToken(response.token);
      }

      showSuccessMessage(
        t('authentication.login_success', 'Accesso effettuato'),
        t('authentication.login_welcome', 'Benvenuto in PinkCare!'),
      );
    } catch (error) {
      if (error instanceof ApiError) {
        showErrorMessage(
          t('authentication.login_error', 'Errore di autenticazione'),
          error.message || t('authentication.login_credentials_wrong', 'Credenziali non valide. Controlla email e password.'),
        );
      } else {
        showErrorMessage(
          t('authentication.login_error', 'Errore di autenticazione'),
          t('authentication.login_generic_error', 'Impossibile completare il login in questo momento. Riprova più tardi.'),
        );
      }
    } finally {
      setIsSubmittingLogin(false);
    }
  }, [loginData, showErrorMessage, showSuccessMessage, t]);

  const handleForgotPassword = useCallback(async () => {
    if (!showSuccessMessage || !showErrorMessage) {
      console.warn('Error handler not available');
      return;
    }

    if (!loginData.email) {
      showErrorMessage(
        t('authentication.recovery_error', 'Recupero password'),
        t('authentication.recovery_missing_email', 'Inserisci la tua email per ricevere il link di recupero.'),
      );
      return;
    }

    try {
      await AuthService.forgotPassword(loginData.email);
      showSuccessMessage(
        t('authentication.recovery_success_title', 'Recupero password'),
        t('authentication.recovery_success_message', "Se l'indirizzo esiste nei nostri sistemi riceverai una email con le istruzioni."),
      );
    } catch (error) {
      if (error instanceof ApiError) {
        showErrorMessage(
          t('authentication.recovery_error', 'Recupero password'),
          error.message || t('authentication.recovery_generic_error', 'Impossibile completare il recupero password. Riprova più tardi.'),
        );
      } else {
        showErrorMessage(
          t('authentication.recovery_error', 'Recupero password'),
          t('authentication.recovery_generic_error', 'Impossibile completare il recupero password. Riprova più tardi.'),
        );
      }
    }
  }, [loginData.email, showErrorMessage, showSuccessMessage, t]);

  const handleDoctorInputChange = (event) => {
    const { name, value } = event.target;
    setDoctorData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClinicInputChange = (event) => {
    const { name, value } = event.target;
    setClinicData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDoctorCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setDoctorData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleClinicCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setClinicData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleDoctorAddressChange = (event) => {
    const { name, value } = event.target;
    setDoctorData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value,
        ...(name === 'municipality' ? { province: '', region: '' } : {}),
      },
    }));
  };

  const handleClinicAddressChange = (event) => {
    const { name, value } = event.target;
    setClinicData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value,
        ...(name === 'municipality' ? { province: '', region: '' } : {}),
      },
    }));
  };

  const handleBusinessTypeSwitch = (type) => {
    const normalized = type.toUpperCase();
    if (businessType !== normalized) {
      setBusinessType(normalized);
      setShowBusinessPassword(false);
      setMunicipalitySuggestions([]);
    }
  };

  const handleMunicipalitySelect = (suggestion) => {
    if (businessType === 'DOCTOR') {
      setDoctorData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          municipality: suggestion.name,
          province: suggestion.province || '',
          region: suggestion.region || '',
          postCode: suggestion.postCode || prev.address.postCode,
        },
      }));
    } else {
      setClinicData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          municipality: suggestion.name,
          province: suggestion.province || '',
          region: suggestion.region || '',
          postCode: suggestion.postCode || prev.address.postCode,
        },
      }));
    }
    setSkipMunicipalitySearch(true);
    setMunicipalitySuggestions([]);
  };

  const toggleBusinessPasswordVisibility = () => {
    setShowBusinessPassword((prev) => !prev);
  };

  const handleBusinessRegistration = async (event) => {
    event.preventDefault();

    if (!showSuccessMessage || !showErrorMessage) {
      console.warn('Error handler not available');
      return;
    }

    const isDoctor = businessType === 'DOCTOR';

    if (isDoctor) {
      if (!doctorData.name || !doctorData.surname || !doctorData.email || !doctorData.password) {
        showErrorMessage('Errore di validazione', 'Compila Nome, Cognome, Email e Password');
        return;
      }

      if (!doctorData.address.streetType || !doctorData.address.street || !doctorData.address.streetNumber) {
        showErrorMessage('Errore di validazione', 'Completa l\'indirizzo professionale');
        return;
      }

      if (!doctorData.address.municipality || !doctorData.address.postCode || !doctorData.address.province) {
        showErrorMessage('Errore di validazione', 'Seleziona un comune dall\'elenco per compilare CAP e provincia');
        return;
      }

      if (!doctorData.medicalTitle) {
        showErrorMessage('Errore di validazione', 'Seleziona la specializzazione');
        return;
      }

      if (!doctorData.agreeToBeShown) {
        showErrorMessage('Errore', 'Devi acconsentire ad essere visibile sul portale');
        return;
      }
    } else {
      if (!clinicData.structureName || !clinicData.email || !clinicData.password) {
        showErrorMessage('Errore di validazione', 'Inserisci nome struttura, email e password');
        return;
      }

      if (!clinicData.address.streetType || !clinicData.address.street || !clinicData.address.streetNumber) {
        showErrorMessage('Errore di validazione', 'Completa l\'indirizzo della struttura');
        return;
      }

      if (!clinicData.address.municipality || !clinicData.address.postCode || !clinicData.address.province) {
        showErrorMessage('Errore di validazione', 'Seleziona un comune dall\'elenco per compilare CAP e provincia');
        return;
      }

      if (!clinicData.agreeToBeShown) {
        showErrorMessage('Errore', 'Devi acconsentire ad essere visibile sul portale');
        return;
      }
    }

    const confirmed = window.confirm(`${t('authentication.have_you_verified_all_your_data', 'Hai verificato tutti i tuoi dati')}?`);
    if (!confirmed) return;

    try {
      const payload = isDoctor
        ? {
            businessType,
            name: doctorData.name,
            surname: doctorData.surname,
            email: doctorData.email,
            password: doctorData.password,
            gender: doctorData.gender === '' ? null : doctorData.gender === 'true',
            medicalTitle: doctorData.medicalTitle,
            structureName: null,
            nickName: null,
            mobilePhone: null,
            agreeConditionAndPrivacy: true,
            agreeToBeShown: doctorData.agreeToBeShown,
            agreeMarketing: doctorData.agreeMarketing,
            agreeNewsletter: doctorData.agreeNewsletter,
            taxCode: null,
            vatNumber: null,
            landlinePhone: null,
            website: null,
            secondEmail: null,
            address: {
              ...doctorData.address,
              province: doctorData.address.province ? doctorData.address.province.toUpperCase() : '',
            },
          }
        : {
            businessType,
            name: clinicData.structureName,
            surname: clinicData.structureName,
            email: clinicData.email,
            password: clinicData.password,
            gender: null,
            medicalTitle: null,
            structureName: clinicData.structureName,
            nickName: null,
            mobilePhone: null,
            agreeConditionAndPrivacy: true,
            agreeToBeShown: clinicData.agreeToBeShown,
            agreeMarketing: clinicData.agreeMarketing,
            agreeNewsletter: clinicData.agreeNewsletter,
            taxCode: null,
            vatNumber: null,
            landlinePhone: null,
            website: null,
            secondEmail: null,
            address: {
              ...clinicData.address,
              province: clinicData.address.province ? clinicData.address.province.toUpperCase() : '',
            },
          };

      const result = await AuthService.registerBusiness(payload);

      showSuccessMessage('Registrazione', result.message || 'Registrazione completata con successo!');

      setDoctorData(getInitialDoctorData());
      setClinicData(getInitialClinicData());
      setShowBusinessPassword(false);
      setMunicipalitySuggestions([]);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.isValidationError()) {
          const errorMessages = error.details.map((detail) => `* ${detail.msg}`).join('\n');
          showErrorMessage('', errorMessages);
        } else if (error.isConflictError()) {
          showErrorMessage('Errore di registrazione', error.message);
        } else if (error.isAuthError()) {
          showErrorMessage('Errore di autenticazione', error.message);
        } else {
          showErrorMessage('Errore di registrazione', error.message || 'Errore durante la registrazione');
        }
      } else {
        showErrorMessage('Errore di connessione', 'Impossibile completare la registrazione. Controlla la connessione internet.');
      }
    }
  };

  const renderLoginCard = () => (
    <div className="login-card">
      <div className="title h6">
        {t('authentication.login_to_account', 'Accedi al tuo account')}
      </div>

      <form className="content" onSubmit={handleLoginSubmit} autoComplete="off">
        <div className="row">
          <div className="col col-12">
            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                name="email"
                className="form-control"
                type="email"
                value={loginData.email}
                onChange={handleLoginInputChange}
                required
              />
            </div>

            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="login-password">
                {t('authentication.password', 'Password')}
              </label>
              <input
                id="login-password"
                name="password"
                className="form-control"
                type="password"
                value={loginData.password}
                onChange={handleLoginInputChange}
                required
              />
            </div>

            <div className="remember">
              <div className="checkbox">
                <label htmlFor="rememberMe">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={loginData.rememberMe}
                    onChange={handleLoginInputChange}
                  />
                  {t('authentication.remember_me', 'Ricordami')}
                </label>
              </div>
              <button
                type="button"
                className="forgot"
                onClick={handleForgotPassword}
              >
                {t('authentication.forgot_password', 'Hai dimenticato la password?')}
              </button>
            </div>

            <button
              id="signin"
              name="submit"
              type="submit"
              className="btn btn-primary btn-login"
              disabled={isSubmittingLogin}
            >
              {isSubmittingLogin
                ? t('authentication.loading', 'Attendere...')
                : t('authentication.login_caps', 'LOGIN')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  const renderDoctorForm = () => (
    <>
      <div className="title h6">{t('resourceBundle.Join_us', 'Unisciti alla nostra rete')}</div>
      <form className="content" autoComplete="off" onSubmit={handleBusinessRegistration}>
        <div className="row">
          <div className="col col-12 col-xl-6 col-lg-6 col-md-6 col-sm-12">
            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="doctor-name">
                {t('authentication.first_name', 'Nome')}
              </label>
              <input
                id="doctor-name"
                name="name"
                className="form-control"
                value={doctorData.name}
                onChange={handleDoctorInputChange}
                required
              />
            </div>
          </div>
          <div className="col col-12 col-xl-6 col-lg-6 col-md-6 col-sm-12">
            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="doctor-surname">
                {t('authentication.last_name', 'Cognome')}
              </label>
              <input
                id="doctor-surname"
                name="surname"
                className="form-control"
                value={doctorData.surname}
                onChange={handleDoctorInputChange}
                required
              />
            </div>
          </div>
          <div className="col col-12 col-xl-6 col-lg-6 col-md-6 col-sm-12">
            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="doctor-email">Email</label>
              <input
                id="doctor-email"
                type="email"
                name="email"
                className="form-control"
                value={doctorData.email}
                onChange={handleDoctorInputChange}
                required
              />
            </div>
          </div>
          <div className="col col-12 col-xl-6 col-lg-6 col-md-6 col-sm-12 position-relative">
            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="doctor-password">
                {t('authentication.password', 'Password')}
              </label>
              <input
                id="doctor-password"
                type={showBusinessPassword ? 'text' : 'password'}
                name="password"
                className="form-control"
                value={doctorData.password}
                onChange={handleDoctorInputChange}
                required
                autoComplete="new-password"
              />
              <span className="toggle-password" onClick={toggleBusinessPasswordVisibility}>
                <i className={`fa ${showBusinessPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
              </span>
            </div>
          </div>

          <div className="col col-12">
            <h5 className="section-divider">{t('authentication.address', 'Indirizzo studio')}</h5>
          </div>

          <div className="col col-12 col-xl-3 col-lg-3 col-md-4 col-sm-12">
            <div className="form-group label-floating is-select">
              <label className="control-label" htmlFor="doctor-street-type">
                {t('authentication.street_type', 'Tipo via')}
              </label>
              <select
                id="doctor-street-type"
                name="streetType"
                className="form-control"
                value={doctorData.address.streetType}
                onChange={handleDoctorAddressChange}
                required
              >
                <option value="">---</option>
                {STREET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col col-12 col-xl-5 col-lg-5 col-md-4 col-sm-12">
            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="doctor-street">
                {t('authentication.street', 'Via')}
              </label>
              <input
                id="doctor-street"
                name="street"
                className="form-control"
                value={doctorData.address.street}
                onChange={handleDoctorAddressChange}
                required
              />
            </div>
          </div>

          <div className="col col-6 col-xl-2 col-lg-2 col-md-2 col-sm-6">
            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="doctor-street-number">
                {t('authentication.street_number', 'Civico')}
              </label>
              <input
                id="doctor-street-number"
                name="streetNumber"
                className="form-control"
                value={doctorData.address.streetNumber}
                onChange={handleDoctorAddressChange}
                required
              />
            </div>
          </div>

          <div className="col col-6 col-xl-2 col-lg-2 col-md-2 col-sm-6">
            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="doctor-postcode">CAP</label>
              <input
                id="doctor-postcode"
                name="postCode"
                className="form-control"
                value={doctorData.address.postCode}
                onChange={handleDoctorAddressChange}
                required
              />
            </div>
          </div>

          <div className="col col-12 col-xl-6 col-lg-6 col-md-6 col-sm-12 position-relative">
            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="doctor-municipality">
                {t('authentication.city', 'Comune')}
              </label>
              <input
                id="doctor-municipality"
                name="municipality"
                className="form-control"
                value={doctorData.address.municipality}
                onChange={handleDoctorAddressChange}
                required
                autoComplete="off"
              />
              {municipalitySuggestions.length > 0 && (
                <ul className="autocomplete-list">
                  {municipalitySuggestions.map((item) => (
                    <li key={item.id} onClick={() => handleMunicipalitySelect(item)}>
                      {item.name} {item.province ? `(${item.province})` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="col col-12">
            <p className="field-hint">
              {t('authentication.city_hint', 'Seleziona il comune dall\'elenco per compilare automaticamente CAP e provincia.')}
            </p>
          </div>

          <div className="col col-12 col-xl-6 col-lg-6 col-md-6 col-sm-12">
            <div className="form-group label-floating is-select">
              <label className="control-label" htmlFor="doctor-medical-title">
                {t('authentication.specialized_in', 'Specializzato in')}
              </label>
              <select
                id="doctor-medical-title"
                name="medicalTitle"
                className="form-control"
                value={doctorData.medicalTitle}
                onChange={handleDoctorInputChange}
                required
              >
                <option value="">---</option>
                {medicalTitles.map((title) => (
                  <option key={title.id} value={title.label}>
                    {title.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col col-12 col-xl-6 col-lg-6 col-md-6 col-sm-12">
            <div className="form-group label-floating is-select">
              <label className="control-label" htmlFor="doctor-gender">
                {t('authentication.gender', 'Genere')}
              </label>
              <select
                id="doctor-gender"
                name="gender"
                className="form-control"
                value={doctorData.gender}
                onChange={handleDoctorInputChange}
              >
                <option value="">---</option>
                <option value="true">{t('authentication.male', 'Maschio')}</option>
                <option value="false">{t('authentication.female', 'Femmina')}</option>
              </select>
            </div>
          </div>

          <div className="col col-12">
            <div className="consent-section">
              <p className="consent-text">
                {t('authentication.business_privacy_note', 'Dichiaro di aver letto e compreso l\'informativa privacy per il trattamento dei dati per finalità di marketing.')}
              </p>
              <label className="control-label consent-item">
                <input
                  type="checkbox"
                  name="agreeToBeShown"
                  checked={doctorData.agreeToBeShown}
                  onChange={handleDoctorCheckboxChange}
                  required
                />
                {t('authentication.agree_visibility', 'Acconsento ad essere visibile sul portale')}
              </label>
              <label className="control-label consent-item">
                <input
                  type="checkbox"
                  name="agreeMarketing"
                  checked={doctorData.agreeMarketing}
                  onChange={handleDoctorCheckboxChange}
                />
                {t('authentication.yes_marketing', 'Mi piacerebbe ricevere aggiornamenti sulle promozioni e offerte')}
              </label>
              <label className="control-label consent-item">
                <input
                  type="checkbox"
                  name="agreeNewsletter"
                  checked={doctorData.agreeNewsletter}
                  onChange={handleDoctorCheckboxChange}
                />
                {t('authentication.yes_newsletter', 'Mi piacerebbe ricevere la newsletter di PinkCare')}
              </label>
            </div>
          </div>

          <div className="col col-12">
            <button type="submit" className="btn btn-primary btn-register">
              {t('authentication.complete_registration', 'Completa registrazione')}
            </button>
          </div>
        </div>
      </form>
    </>
  );

  const renderClinicForm = () => (
    <>
      <div className="title h6">{t('resourceBundle.Join_us', 'Unisciti alla nostra rete')}</div>
      <form className="content" autoComplete="off" onSubmit={handleBusinessRegistration}>
        <div className="row">
          <div className="col col-12">
            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="clinic-structure">
                {t('authentication.structure_name', 'Nome struttura')}
              </label>
              <input
                id="clinic-structure"
                name="structureName"
                className="form-control"
                value={clinicData.structureName}
                onChange={handleClinicInputChange}
                required
              />
            </div>
          </div>

          <div className="col col-12">
            <h5 className="section-divider">{t('authentication.address', 'Indirizzo struttura')}</h5>
          </div>

          <div className="col col-12 col-md-3">
            <div className="form-group label-floating is-select">
              <label className="control-label" htmlFor="clinic-street-type">
                {t('authentication.street_type', 'Tipo via')}
              </label>
              <select
                id="clinic-street-type"
                name="streetType"
                className="form-control"
                value={clinicData.address.streetType}
                onChange={handleClinicAddressChange}
                required
              >
                <option value="">---</option>
                {STREET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col col-12 col-md-6">
            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="clinic-street">
                {t('authentication.street', 'Via')}
              </label>
              <input
                id="clinic-street"
                name="street"
                className="form-control"
                value={clinicData.address.street}
                onChange={handleClinicAddressChange}
                required
              />
            </div>
          </div>

          <div className="col col-12 col-md-3">
            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="clinic-street-number">
                {t('authentication.street_number', 'Civico')}
              </label>
              <input
                id="clinic-street-number"
                name="streetNumber"
                className="form-control"
                value={clinicData.address.streetNumber}
                onChange={handleClinicAddressChange}
                required
              />
            </div>
          </div>

          <div className="col col-12 col-md-9 position-relative">
            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="clinic-municipality">
                {t('authentication.city', 'Comune')}
              </label>
              <input
                id="clinic-municipality"
                name="municipality"
                className="form-control"
                value={clinicData.address.municipality}
                onChange={handleClinicAddressChange}
                required
                autoComplete="off"
              />
              {municipalitySuggestions.length > 0 && (
                <ul className="autocomplete-list">
                  {municipalitySuggestions.map((item) => (
                    <li key={item.id} onClick={() => handleMunicipalitySelect(item)}>
                      {item.name} {item.province ? `(${item.province})` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="col col-12 col-md-3">
            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="clinic-postcode">CAP</label>
              <input
                id="clinic-postcode"
                name="postCode"
                className="form-control"
                value={clinicData.address.postCode}
                onChange={handleClinicAddressChange}
                required
              />
            </div>
          </div>

          <div className="col col-12">
            <p className="field-hint">
              {t('authentication.city_hint', 'Seleziona il comune dall\'elenco per compilare automaticamente CAP e provincia.')}
            </p>
          </div>

          <div className="col col-12 col-xl-6 col-lg-6 col-md-6 col-sm-12">
            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="clinic-email">Email</label>
              <input
                id="clinic-email"
                type="email"
                name="email"
                className="form-control"
                value={clinicData.email}
                onChange={handleClinicInputChange}
                required
              />
            </div>
          </div>

          <div className="col col-12 col-xl-6 col-lg-6 col-md-6 col-sm-12 position-relative">
            <div className="form-group label-floating is-empty">
              <label className="control-label" htmlFor="clinic-password">
                {t('authentication.password', 'Password')}
              </label>
              <input
                id="clinic-password"
                type={showBusinessPassword ? 'text' : 'password'}
                name="password"
                className="form-control"
                value={clinicData.password}
                onChange={handleClinicInputChange}
                required
                autoComplete="new-password"
              />
              <span className="toggle-password" onClick={toggleBusinessPasswordVisibility}>
                <i className={`fa ${showBusinessPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
              </span>
            </div>
          </div>

          <div className="col col-12">
            <div className="consent-section">
              <p className="consent-text">
                {t('authentication.business_privacy_note', 'Dichiaro di aver letto e compreso l\'informativa privacy per il trattamento dei dati per finalità di marketing.')}
              </p>
              <label className="control-label consent-item">
                <input
                  type="checkbox"
                  name="agreeToBeShown"
                  checked={clinicData.agreeToBeShown}
                  onChange={handleClinicCheckboxChange}
                  required
                />
                {t('authentication.agree_visibility', 'Acconsento ad essere visibile sul portale')}
              </label>
              <label className="control-label consent-item">
                <input
                  type="checkbox"
                  name="agreeMarketing"
                  checked={clinicData.agreeMarketing}
                  onChange={handleClinicCheckboxChange}
                />
                {t('authentication.yes_marketing', 'Mi piacerebbe ricevere aggiornamenti sulle promozioni e offerte')}
              </label>
              <label className="control-label consent-item">
                <input
                  type="checkbox"
                  name="agreeNewsletter"
                  checked={clinicData.agreeNewsletter}
                  onChange={handleClinicCheckboxChange}
                />
                {t('authentication.yes_newsletter', 'Mi piacerebbe ricevere la newsletter di PinkCare')}
              </label>
            </div>
          </div>

          <div className="col col-12">
            <button type="submit" className="btn btn-primary btn-register">
              {t('authentication.complete_registration', 'Completa registrazione')}
            </button>
          </div>
        </div>
      </form>
    </>
  );

  const renderBusinessCard = () => (
    <div className="registration-login-form">
      <div className="business-vertical-nav">
        <button
          type="button"
          className={`business-vertical-tab ${businessType === 'DOCTOR' ? 'active' : ''}`}
          onClick={() => handleBusinessTypeSwitch('DOCTOR')}
        >
          <span>{t('standard_public.doctor', 'Medico')}</span>
        </button>
        <button
          type="button"
          className={`business-vertical-tab ${businessType === 'CLINIC' ? 'active' : ''}`}
          onClick={() => handleBusinessTypeSwitch('CLINIC')}
        >
          <span>{t('standard_public.clinic', 'Struttura')}</span>
        </button>
      </div>

      <div className="business-form-wrapper">
        {businessType === 'DOCTOR' ? renderDoctorForm() : renderClinicForm()}
      </div>
    </div>
  );
  

  return (
    <div className="login-page">
      <PageHead
        title={loginPageConfig.title || t('authentication.login_page_title', 'Login - PinkCare')}
        description={
          loginPageConfig.description ||
          t('authentication.login_page_description', 'Accedi al tuo profilo PinkCare')
        }
        keywords={loginPageConfig.keywords}
        author={loginPageConfig.author}
        themeColor="#e42080"
        links={loginPageConfig.links || []}
      />

      <div className="content-bg-wrap" />

      <div className="header--standard header--standard-landing" id="header--standard">
        <div className="container">
          <div className="header--standard-wrap">
            <a href="/" className="logo">
              <div className="img-wrap">
                <img
                  src="/styles/public/images/logo_pinkcare_white-01.png"
                  alt="PinkCare"
                  style={{ marginTop: '20px' }}
                />
              </div>
            </a>
          </div>
        </div>
      </div>
      <div className="header-spacer--standard" />

      <div className="container login-container">
        <div className="row justify-content-center align-items-center">
          {/* <div className="col col-12 col-lg-5 col-xl-5 landing-column">
            <div className="landing-content">
              <h2>{t('login.cta_title', 'Sei un professionista?')}</h2>
              <p>{t('login.cta_subtitle', 'Registrati gratuitamente e fatti conoscere da nuovi pazienti.')}</p>
              <a href="/login?page=authentication" className="btn btn-md btn-border c-white">
                {t('authentication.login_caps', 'Login')}
              </a>
            </div>
          </div> */}

          <div className="col col-12">
            {activeTab === 'AUTH' ? renderLoginCard() : renderBusinessCard()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
