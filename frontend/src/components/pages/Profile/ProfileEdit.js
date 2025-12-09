import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { ApiClient } from '../../../config/api';
import ThreeColumnLayout from '../../layout/ThreeColumnLayout';
import UserProfileSidebar from '../../layout/UserProfileSidebar';
import AdvertisingSidebar from '../../layout/AdvertisingSidebar';
import './ProfileEdit.css';

/**
 * ProfileEdit Component
 * Replica ESATTA di pinkcare/WEB-INF/flows/profile/personal_form.xhtml
 * Layout identico al legacy usando ThreeColumnLayout con proporzioni 2-8-2:
 * - Sidebar sinistra (UserProfileSidebar)
 * - Form centrale (solo campi legacy: nome, cognome, email, password)
 * - Sidebar destra (AdvertisingSidebar)
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

  return (
    <ThreeColumnLayout
      leftSidebar={<UserProfileSidebar />}
      rightSidebar={<AdvertisingSidebar />}
      leftColSize={2}
      centerColSize={8}
      rightColSize={2}
    >
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
    </ThreeColumnLayout>
  );
};

export default ProfileEdit;
