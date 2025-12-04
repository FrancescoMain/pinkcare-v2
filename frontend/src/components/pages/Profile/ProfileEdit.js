import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { ApiClient } from '../../../config/api';
import './ProfileEdit.css';

/**
 * ProfileEdit Component
 * Replica ESATTA di pinkcare/WEB-INF/flows/profile/personal_form.xhtml
 * Layout identico al legacy con:
 * - Sidebar sinistra (user card + menu)
 * - Form centrale (solo campi legacy: nome, cognome, email, password)
 * - Sidebar destra (banner pubblicitari)
 */
const ProfileEdit = ({ errorHandler }) => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { showSuccessMessage, showErrorMessage } = errorHandler || {};

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    emailConfirmation: ''
  });

  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', className: '' });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carica dati utente
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        surname: user.surname || '',
        email: user.email || '',
        emailConfirmation: ''  // REPLICA ESATTA legacy: conferma email sempre vuota
      });
    }
  }, [user]);

  // Calcola età
  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const userAge = user?.birthday ? calculateAge(user.birthday) : null;

  // Funzione per capitalizzare prima lettera
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const handlePasswordFocus = () => {
    setIsPasswordFocused(true);
  };

  const handlePasswordBlur = () => {
    setIsPasswordFocused(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const calculatePasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength({ score: 0, label: '', className: '' });
      return;
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Za-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[_@./#+-]/.test(password)) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;

    let label = '';
    let className = '';

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!showSuccessMessage || !showErrorMessage) {
      console.error('Error handler not available');
      alert('Error handler not available');
      return;
    }

    // Validazione email confirmation
    if (formData.email !== formData.emailConfirmation) {
      console.log('Email mismatch validation triggered');
      showErrorMessage('Errore', 'Le email non corrispondono');
      return;
    }

    // Validazione password (solo se compilata)
    const isChangingPassword = passwordData.password !== '' || passwordData.confirmPassword !== '';
    if (isChangingPassword) {
      console.log('Password validation triggered', {
        password: passwordData.password,
        confirmPassword: passwordData.confirmPassword
      });

      if (passwordData.password !== passwordData.confirmPassword) {
        console.log('Password mismatch');
        showErrorMessage('Errore', 'Le password non corrispondono');
        return;
      }

      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d_@./#+-]{8,}$/;
      if (!passwordRegex.test(passwordData.password)) {
        console.log('Password format invalid');
        showErrorMessage('Errore', 'La password deve contenere almeno 8 caratteri alfanumerici (lettere e numeri)');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const updatePayload = {
        name: formData.name,
        surname: formData.surname,
        email: formData.email
      };

      const profileResponse = await ApiClient.put('/api/users/profile', updatePayload);

      // REPLICA ESATTA legacy: invio solo newPassword e confirmPassword
      if (isChangingPassword) {
        await ApiClient.put('/api/users/password', {
          newPassword: passwordData.password,
          confirmPassword: passwordData.confirmPassword
        });
      }

      if (profileResponse.user) {
        updateUser(profileResponse.user);
      }

      showSuccessMessage('Profilo aggiornato', 'Le modifiche sono state salvate con successo');

      setPasswordData({
        password: '',
        confirmPassword: ''
      });
      setPasswordStrength({ score: 0, label: '', className: '' });

    } catch (error) {
      console.error('Profile update error:', error);

      if (error.details && Array.isArray(error.details)) {
        const errorMessages = error.details.map(detail => `* ${detail.msg}`).join('\n');
        showErrorMessage('Errore di validazione', errorMessages);
      } else {
        showErrorMessage('Errore', error.message || 'Impossibile aggiornare il profilo');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModificaStoriaClinica = () => {
    // TODO: Implementare navigazione a storia clinica (Fase 6)
    console.log('Navigazione a storia clinica');
  };

  const handleCalcolaDataParto = () => {
    // TODO: Implementare calcolo data parto
    console.log('Calcola data parto');
  };

  return (
    <div className="profile-page-legacy">
      <div className="profile-row">
          {/* SIDEBAR SINISTRA - User Card */}
          <div className="col col-xl-3 order-xl-1 col-lg-3 order-lg-1 col-md-12 order-md-2 col-sm-12 col-12">
            <div className="ui-block">
              {/* User Card - Layout semplice come legacy */}
              <div className="your-profile">
                {/* Avatar centrato */}
                <div className="author-thumb">
                  <img src="/styles/olympus/assets/images/avatar.jpg" alt="author"
                       className="profile-pic" />
                </div>

                {/* Nome centrato */}
                <div className="author-content">
                  <div className="author-name">
                    {capitalize(user?.name) || ''} {capitalize(user?.surname) || ''}
                  </div>
                  {userAge && (
                    <div className="country">ETA: {userAge} ANNI</div>
                  )}
                </div>

                {/* Pulsante Modifica Storia Clinica */}
                <div className="profile-menu">
                  <button
                    className="btn btn-primary btn-block"
                    onClick={handleModificaStoriaClinica}
                  >
                    {t('resourceBundle.Modify_Medical_History', 'Modifica storia clinica')}
                  </button>
                </div>

                {/* Eventi del mese */}
                <div className="events-section">
                  <h6 className="section-title">{t('resourceBundle.Events_Month', 'Eventi del mese')}</h6>
                  <div className="nothing-found">
                    <span>{t('resourceBundle.No_Records_Found', 'No records found.')}</span>
                  </div>
                </div>

                {/* Pulsante Calcola Data Parto */}
                <div className="profile-menu">
                  <button
                    className="btn btn-secondary btn-block"
                    onClick={handleCalcolaDataParto}
                  >
                    {t('resourceBundle.Calculate_Due_Date', 'Calcola data parto')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENUTO CENTRALE - Form Profilo */}
          <div className="col col-xl-6 order-xl-2 col-lg-6 order-lg-2 col-md-12 order-md-1 col-sm-12 col-12">
            <div className="ui-block">
              <div className="ui-block-title">
                <h6 className="title">{t('resourceBundle.Personal_Information', 'Informazioni Personali')}</h6>
              </div>
              <div className="ui-block-content">
                <form onSubmit={handleSubmit} autoComplete="off">
                  <div className="row">
                    {/* Nome */}
                    <div className="col col-lg-6 col-md-6 col-sm-12 col-12">
                      <div className="form-group label-floating">
                        <label className="control-label">
                          {t('resourceBundle.First_Name', 'Nome')} *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                        />
                      </div>
                    </div>

                    {/* Cognome */}
                    <div className="col col-lg-6 col-md-6 col-sm-12 col-12">
                      <div className="form-group label-floating">
                        <label className="control-label">
                          {t('resourceBundle.Last_Name', 'Cognome')} *
                        </label>
                        <input
                          type="text"
                          name="surname"
                          value={formData.surname}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col col-lg-6 col-md-6 col-sm-12 col-12">
                      <div className="form-group label-floating">
                        <label className="control-label">
                          {t('resourceBundle.Email', 'Email')} *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="form-control"
                          pattern="^(([a-zA-Z0-9_+.-]+)@([a-zA-Z0-9][a-zA-Z0-9_.-]+).([a-zA-Z]+))$"
                          required
                        />
                      </div>
                    </div>

                    {/* Conferma Email */}
                    <div className="col col-lg-6 col-md-6 col-sm-12 col-12">
                      <div className="form-group label-floating">
                        <label className="control-label">
                          {t('resourceBundle.Confirm_Email', 'Conferma Email')} *
                        </label>
                        <input
                          type="email"
                          name="emailConfirmation"
                          value={formData.emailConfirmation}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="col col-lg-6 col-md-6 col-sm-12 col-12">
                      <div className="form-group label-floating">
                        <label className="control-label">
                          {t('resourceBundle.Password', 'Password')}
                          <br />
                          <small>({t('authentication.min8chars_alphanumeric', 'min 8 caratteri alfanumerici')})</small>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={passwordData.password}
                            onChange={handlePasswordChange}
                            onFocus={handlePasswordFocus}
                            onBlur={handlePasswordBlur}
                            className="form-control"
                            autoComplete="new-password"
                            pattern="^$|^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d_@./#+-]{8,}$"
                          />
                          <span
                            className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} field-icon toggle-password`}
                            onClick={togglePasswordVisibility}
                          ></span>
                          {passwordStrength.label && isPasswordFocused && (
                            <div className={`password-strength-indicator ${passwordStrength.className}`}>
                              {passwordStrength.label}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Conferma Password */}
                    <div className="col col-lg-6 col-md-6 col-sm-12 col-12">
                      <div className="form-group label-floating">
                        <label className="control-label">
                          {t('resourceBundle.Confirm_Password', 'Conferma Password')}
                          <br />
                          <small style={{ visibility: 'hidden' }}>({t('authentication.min8chars_alphanumeric', 'min 8 caratteri alfanumerici')})</small>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="form-control"
                            autoComplete="new-password"
                            pattern="^$|^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d_@./#+-]{8,}$"
                          />
                          <span
                            className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} field-icon toggle-password`}
                            onClick={toggleConfirmPasswordVisibility}
                          ></span>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="col col-lg-12 col-md-12 col-sm-12 col-12">
                      <button
                        type="submit"
                        className="profile-save-btn"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? t('resourceBundle.Saving', 'Salvataggio...') : t('resourceBundle.Save', 'Salva')}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* SIDEBAR DESTRA - Banner Pubblicitari */}
          <div className="col col-xl-3 order-xl-3 col-lg-3 order-lg-3 col-md-12 order-md-3 col-sm-12 col-12">
            <div className="ui-block">
              {/* Banner Pubblicitario */}
              <div className="widget w-banner">
                <img
                  src="/styles/olympus/assets/images/muscle-pharm-fish-oil-banner.jpg"
                  alt="Banner"
                  style={{ width: '100%', borderRadius: '5px' }}
                />
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
