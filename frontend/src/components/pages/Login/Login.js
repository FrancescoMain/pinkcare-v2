import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './style.css';
import PageHead from '../../layout/PageHead';
import { ApiError } from '../../../config/api';
import { AuthService } from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';
import ReferenceService from '../../../services/referenceService';
import { pageConfig } from '../../../config/pageConfig';

const STREET_TYPES = [
  'Via', 'Piazza', 'Corso', 'Viale', 'Largo', 'Contrada', 'Vicolo',
  'Circonvallazione', 'Galleria', 'Parco', 'Rotonda', 'Traversa',
  'Lungomare', 'Strada', 'Stretto', 'SC', 'SP', 'SR', 'SS',
];

// Componente select isolato per debug
const SimpleSelect = ({ value, onChange, name, options, placeholder }) => {
  console.log('SimpleSelect render - value:', value, 'name:', name);
  const selectRef = useRef(null);

  useEffect(() => {
    if (selectRef.current && value) {
      console.log('Force setting DOM value to:', value);
      selectRef.current.value = value;
      console.log('DOM value after force set:', selectRef.current.value);

      // Force visual update
      selectRef.current.style.fontWeight = 'bold';
      selectRef.current.style.color = '#e42080';
      setTimeout(() => {
        selectRef.current.style.fontWeight = 'normal';
        selectRef.current.style.color = '#515365';
      }, 200);
    }
  }, [value]);

  return (
    <select
      ref={selectRef}
      name={name}
      className="form-select"
      defaultValue={value || ''}
      onChange={onChange}
      required
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

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
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccessMessage, showErrorMessage } = errorHandler || {};
  const loginPageConfig = pageConfig.login || {};

  // Debug: log errorHandler status
  console.log('[LoginPage] Component rendered', {
    hasErrorHandler: !!errorHandler,
    hasShowSuccessMessage: !!showSuccessMessage,
    hasShowErrorMessage: !!showErrorMessage,
    errorHandlerKeys: errorHandler ? Object.keys(errorHandler) : []
  });

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

    return 'AUTH';
  }, [location.search]);

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [businessType, setBusinessType] = useState('DOCTOR');
  const [doctorData, setDoctorData] = useState(getInitialDoctorData);
  const [clinicData, setClinicData] = useState(getInitialClinicData);
  const [showBusinessPassword, setShowBusinessPassword] = useState(false);
  const [medicalTitles, setMedicalTitles] = useState([]);
  const [municipalitySuggestions, setMunicipalitySuggestions] = useState([]);
  const [skipMunicipalitySearch, setSkipMunicipalitySearch] = useState(false);
  const [isSubmittingBusiness, setIsSubmittingBusiness] = useState(false);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);


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

  // Handle password recovery result from URL query parameter (run once on mount)
  useEffect(() => {
    if (!showSuccessMessage || !showErrorMessage) return;

    const params = new URLSearchParams(location.search);
    const res = params.get('res');

    if (res !== null) {
      // Show message based on result code
      switch (res) {
        case '0':
          showSuccessMessage(
            t('authentication.recovery_complete_title', 'Password ripristinata'),
            t('authentication.recovery_complete_message', 'La tua password è stata ripristinata con successo. Controlla la tua email per la nuova password temporanea.')
          );
          break;
        case '-1':
          showErrorMessage(
            t('authentication.recovery_error', 'Errore recupero password'),
            t('authentication.recovery_link_malformed', 'Il link di recupero non è valido. Richiedi un nuovo link.')
          );
          break;
        case '-2':
          showErrorMessage(
            t('authentication.recovery_error', 'Errore recupero password'),
            t('authentication.recovery_already_used', 'Questo link è già stato utilizzato o non è più valido.')
          );
          break;
        case '-3':
          showErrorMessage(
            t('authentication.recovery_error', 'Errore recupero password'),
            t('authentication.recovery_code_incorrect', 'Il codice di recupero non è corretto o è scaduto.')
          );
          break;
        default:
          showErrorMessage(
            t('authentication.recovery_error', 'Errore recupero password'),
            t('authentication.recovery_generic_error', 'Si è verificato un errore durante il recupero password.')
          );
      }

      // Clear the query parameter from URL after showing message
      navigate(location.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  useEffect(() => {
    if (skipMunicipalitySearch) {
      console.log('[Municipality] Skipping search due to skipMunicipalitySearch flag');
      setSkipMunicipalitySearch(false);
      setIsLoadingMunicipalities(false);
      return;
    }

    const activeAddress = businessType === 'DOCTOR' ? doctorData.address : clinicData.address;
    const query = activeAddress.municipality;

    // Non fare la ricerca se il campo è vuoto o troppo corto
    if (!query || query.length < 3) {
      setMunicipalitySuggestions([]);
      setIsLoadingMunicipalities(false);
      return;
    }

    // Se il comune ha già la provincia compilata, significa che è stato selezionato dall'autocomplete
    // Non fare una nuova ricerca (il postCode può essere null dal backend, quindi non lo controlliamo)
    if (activeAddress.province) {
      console.log('[Municipality] Skipping search - municipality already selected with province');
      setMunicipalitySuggestions([]);
      setIsLoadingMunicipalities(false);
      return;
    }

    console.log('[Municipality] Starting debounce for:', query);
    setIsLoadingMunicipalities(true);

    // Debouncing: attendi 500ms prima di fare la chiamata
    const debounceTimer = setTimeout(() => {
      console.log('[Municipality] Searching for:', query);

      let ignore = false;
      (async () => {
        try {
          const results = await ReferenceService.searchMunicipalities(query);
          if (!ignore) {
            console.log('[Municipality] Found results:', results?.length || 0);
            setMunicipalitySuggestions(results || []);
            setIsLoadingMunicipalities(false);
          }
        } catch (err) {
          console.error('Municipality search failed:', err);
          if (!ignore) {
            setIsLoadingMunicipalities(false);
          }
        }
      })();

      return () => {
        ignore = true;
      };
    }, 500); // 500ms di debounce

    return () => {
      clearTimeout(debounceTimer);
      setIsLoadingMunicipalities(false);
    };
  }, [businessType, doctorData.address.municipality, clinicData.address.municipality, doctorData.address.province, clinicData.address.province, skipMunicipalitySearch]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Chiudi autocomplete quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      const municipalityField = document.getElementById(businessType === 'DOCTOR' ? 'doctor-municipality' : 'clinic-municipality');
      const autocompleteList = municipalityField?.parentElement?.querySelector('.autocomplete-list');

      if (municipalityField && autocompleteList && !municipalityField.contains(event.target) && !autocompleteList.contains(event.target)) {
        setMunicipalitySuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [businessType]);


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
      console.log('🚀 Starting login process with:', loginData.email);

      const response = await login(
        loginData.email,
        loginData.password,
        loginData.rememberMe,
      );

      console.log('✅ Login response received:', response);
      console.log('👤 User role:', response?.user?.role);

      showSuccessMessage(
        t('authentication.login_success', 'Accesso effettuato'),
        t('authentication.login_welcome', 'Benvenuto in PinkCare!'),
      );

      // Redirect based on user role, matching legacy behavior
      setTimeout(() => {
        console.log('⏰ Redirect timeout triggered, navigating...');
        if (response?.user?.role === 'ADMIN') {
          console.log('🎯 Redirecting to admin dashboard');
          navigate('/admin/dashboard');
        } else {
          console.log('🎯 Redirecting to dashboard (home)');
          navigate('/dashboard'); // Redirect to home page after login
        }
      }, 1500);
    } catch (error) {
      console.error('❌ Login error caught:', error);
      console.error('Error type:', typeof error);
      console.error('Is ApiError:', error instanceof ApiError);

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
  }, [loginData, showErrorMessage, showSuccessMessage, t, login, navigate]);

  const handleForgotPassword = useCallback(async () => {
    console.log('[DEBUG] handleForgotPassword called', {
      hasShowSuccessMessage: !!showSuccessMessage,
      hasShowErrorMessage: !!showErrorMessage,
      email: loginData.email
    });

    if (!showSuccessMessage || !showErrorMessage) {
      console.warn('Error handler not available');
      alert('Error handler not available - funzioni di messaggio mancanti');
      return;
    }

    if (!loginData.email) {
      console.log('[DEBUG] No email provided, showing error');
      showErrorMessage(
        t('authentication.recovery_error', 'Recupero password'),
        t('authentication.recovery_missing_email', 'Inserisci la tua email per ricevere il link di recupero.'),
      );
      return;
    }

    try {
      console.log('[DEBUG] Calling forgotPassword API');
      await AuthService.forgotPassword(loginData.email);
      console.log('[DEBUG] API call successful');
      showSuccessMessage(
        t('authentication.recovery_success_title', 'Recupero password'),
        t('authentication.recovery_success_message', "Se l'indirizzo esiste nei nostri sistemi riceverai una email con le istruzioni."),
      );
    } catch (error) {
      console.log('[DEBUG] API call failed', error);
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
        // Se l'utente modifica manualmente il comune, resetta solo provincia e regione
        // Il postCode rimane manuale (può essere null dal backend)
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
        // Se l'utente modifica manualmente il comune, resetta solo provincia e regione
        // Il postCode rimane manuale (può essere null dal backend)
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
    console.log('[Municipality] Selected:', suggestion);

    // Prima chiudi l'autocomplete
    setMunicipalitySuggestions([]);
    setSkipMunicipalitySearch(true);

    // Poi aggiorna i dati
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

    // Rimuovi il focus dal campo per assicurare la chiusura
    setTimeout(() => {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.id === 'doctor-municipality' || activeElement.id === 'clinic-municipality')) {
        activeElement.blur();
      }
    }, 100);
  };

  const toggleBusinessPasswordVisibility = () => {
    setShowBusinessPassword((prev) => !prev);
  };

  const handleBusinessRegistration = async (event) => {
    event.preventDefault();

    // Previeni sottomissioni multiple
    if (isSubmittingBusiness) return;

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

    setIsSubmittingBusiness(true);

    try {
      const payload = isDoctor
        ? {
            businessType,
            name: doctorData.name,
            surname: doctorData.surname,
            email: doctorData.email,
            password: doctorData.password,
            gender: doctorData.gender === '' ? null : doctorData.gender === 'true',
            nickName: doctorData.name + ' ' + doctorData.surname,
            mobilePhone: null,
            medicalTitle: doctorData.medicalTitle,
            structureName: '',
            address: {
              streetType: doctorData.address.streetType || '',
              street: doctorData.address.street || '',
              streetNumber: doctorData.address.streetNumber || '1',
              postCode: doctorData.address.postCode || '',
              municipality: doctorData.address.municipality || '',
              province: (doctorData.address.province || '').toUpperCase()
            },
            agreeConditionAndPrivacy: true,
            agreeToBeShown: doctorData.agreeToBeShown,
            agreeMarketing: doctorData.agreeMarketing,
            agreeNewsletter: doctorData.agreeNewsletter,
            taxCode: '',
            vatNumber: '',
            landlinePhone: '',
            website: '',
            secondEmail: ''
          }
        : {
            businessType,
            name: clinicData.structureName,
            surname: clinicData.structureName,
            email: clinicData.email,
            password: clinicData.password,
            gender: null,
            nickName: clinicData.structureName,
            mobilePhone: null,
            medicalTitle: '',
            structureName: clinicData.structureName,
            address: {
              streetType: clinicData.address.streetType || '',
              street: clinicData.address.street || '',
              streetNumber: clinicData.address.streetNumber || '1',
              postCode: clinicData.address.postCode || '',
              municipality: clinicData.address.municipality || '',
              province: (clinicData.address.province || '').toUpperCase()
            },
            agreeConditionAndPrivacy: true,
            agreeToBeShown: clinicData.agreeToBeShown,
            agreeMarketing: clinicData.agreeMarketing,
            agreeNewsletter: clinicData.agreeNewsletter,
            taxCode: '',
            vatNumber: '',
            landlinePhone: '',
            website: '',
            secondEmail: ''
          };

      console.log('Registration payload:', payload);

      const result = await AuthService.registerBusiness(payload);

      showSuccessMessage('Registrazione', result.message || 'Registrazione completata con successo!');

      setDoctorData(getInitialDoctorData());
      setClinicData(getInitialClinicData());
      setShowBusinessPassword(false);
      setMunicipalitySuggestions([]);

      // Redirect al login dopo 2 secondi per permettere all'utente di leggere il messaggio di successo
      setTimeout(() => {
        navigate('/login?page=authentication');
      }, 2000);
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
    } finally {
      setIsSubmittingBusiness(false);
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
              className="btn-login"
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

          <div className="col col-12 section-break">
            <h5 className="section-divider">{t('authentication.address', 'Indirizzo studio')}</h5>
          </div>

        </div>
        <div className="row">
          <div className="col col-12 col-xl-3 col-lg-3 col-md-4 col-sm-12">
            <div className="form-group label-floating is-select">
              <label className="control-label" htmlFor="doctor-street-type">
                {t('authentication.street_type', 'Tipo via')}
              </label>
              <SimpleSelect
                value={doctorData.address.streetType}
                onChange={handleDoctorAddressChange}
                name="streetType"
                options={STREET_TYPES}
                placeholder="Seleziona tipo via"
              />
            </div>
          </div>
        </div>

        <div className="row">

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

          <div className="col col-12 col-xl-6 col-lg-6 col-md-6 col-sm-12">
            <div className="form-group label-floating is-empty" style={{ position: 'relative' }}>
              <label className="control-label" htmlFor="doctor-municipality">
                {t('authentication.city', 'Comune')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="doctor-municipality"
                  name="municipality"
                  className="form-control"
                  value={doctorData.address.municipality}
                  onChange={handleDoctorAddressChange}
                  required
                  autoComplete="off"
                  style={{ paddingRight: isLoadingMunicipalities ? '45px' : '12px' }}
                />
                {isLoadingMunicipalities && (
                  <span className="municipality-loading-icon" style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#e42080',
                    fontSize: '16px',
                    zIndex: 10
                  }}>
                    <i className="fa fa-spinner fa-spin"></i>
                  </span>
                )}
              </div>
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


          <div className="col col-12 form-section-break">
            <div className="row-break"></div>
          </div>

          <div className="col col-12 col-xl-6 col-lg-6 col-md-6 col-sm-12">
            <div className="form-group label-floating is-select">
              <label className="control-label" htmlFor="doctor-medical-title">
                {t('authentication.specialized_in', 'Specializzato in')}
              </label>
              <select
                name="medicalTitle"
                className="form-select"
                value={doctorData.medicalTitle}
                onChange={handleDoctorInputChange}
                required
              >
                <option value="">Seleziona specializzazione</option>
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
                name="gender"
                className="form-select"
                value={doctorData.gender}
                onChange={handleDoctorInputChange}
              >
                <option value="">Seleziona genere</option>
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

          <div className="col col-12 button-container">
            <button
              type="submit"
              className="btn btn-primary btn-register"
              style={{
                opacity: isSubmittingBusiness ? 0.7 : 1,
                cursor: isSubmittingBusiness ? 'not-allowed' : 'pointer',
                pointerEvents: isSubmittingBusiness ? 'none' : 'auto'
              }}
              disabled={isSubmittingBusiness}
            >
              {isSubmittingBusiness ? (
                <>
                  <i className="fa fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                  {t('authentication.registering', 'Registrazione in corso...')}
                </>
              ) : (
                t('authentication.complete_registration', 'Completa registrazione')
              )}
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

          <div className="col col-12 section-break">
            <h5 className="section-divider">{t('authentication.address', 'Indirizzo struttura')}</h5>
          </div>

        </div>
        <div className="row">
          <div className="col col-12 col-md-3">
            <div className="form-group label-floating is-select">
              <label className="control-label" htmlFor="clinic-street-type">
                {t('authentication.street_type', 'Tipo via')}
              </label>
              <select
                name="streetType"
                className="form-select"
                value={clinicData.address.streetType}
                onChange={handleClinicAddressChange}
                required
              >
                <option value="">Seleziona tipo via</option>
                {STREET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="row">

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

          <div className="col col-12 col-md-9">
            <div className="form-group label-floating is-empty" style={{ position: 'relative' }}>
              <label className="control-label" htmlFor="clinic-municipality">
                {t('authentication.city', 'Comune')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="clinic-municipality"
                  name="municipality"
                  className="form-control"
                  value={clinicData.address.municipality}
                  onChange={handleClinicAddressChange}
                  required
                  autoComplete="off"
                  style={{ paddingRight: isLoadingMunicipalities ? '45px' : '12px' }}
                />
                {isLoadingMunicipalities && (
                  <span className="municipality-loading-icon" style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#e42080',
                    fontSize: '16px',
                    zIndex: 10
                  }}>
                    <i className="fa fa-spinner fa-spin"></i>
                  </span>
                )}
              </div>
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


          <div className="col col-12 form-section-break">
            <div className="row-break"></div>
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

          <div className="col col-12 button-container">
            <button
              type="submit"
              className="btn btn-primary btn-register"
              style={{
                opacity: isSubmittingBusiness ? 0.7 : 1,
                cursor: isSubmittingBusiness ? 'not-allowed' : 'pointer',
                pointerEvents: isSubmittingBusiness ? 'none' : 'auto'
              }}
              disabled={isSubmittingBusiness}
            >
              {isSubmittingBusiness ? (
                <>
                  <i className="fa fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                  {t('authentication.registering', 'Registrazione in corso...')}
                </>
              ) : (
                t('authentication.complete_registration', 'Completa registrazione')
              )}
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
