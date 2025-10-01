import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { ApiClient } from '../../../config/api';
import './ProfileEdit.css';

/**
 * ProfileEdit Component
 * Replica esatta di pinkcare/WEB-INF/flows/profile/personal_form.xhtml
 * Form per modifica dati personali + cambio password
 */
const ProfileEdit = ({ errorHandler }) => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { showSuccessMessage, showErrorMessage } = errorHandler || {};

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    emailConfirmation: '',
    nickName: '',
    birthday: '',
    gender: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
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
        emailConfirmation: user.email || '',
        nickName: user.nickName || '',
        birthday: user.birthday || '',
        gender: user.gender !== null && user.gender !== undefined ? String(user.gender) : ''
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

    // Calcola strength solo per new password
    if (name === 'newPassword') {
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

    // Determine strength label (replica legacy)
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
      console.warn('Error handler not available');
      return;
    }

    // Validazione email confirmation
    if (formData.email !== formData.emailConfirmation) {
      showErrorMessage('Errore', 'Le email non corrispondono');
      return;
    }

    // Validazione password (solo se compilata)
    const isChangingPassword = passwordData.newPassword !== '';
    if (isChangingPassword) {
      if (!passwordData.currentPassword) {
        showErrorMessage('Errore', 'Inserisci la password attuale per cambiarla');
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        showErrorMessage('Errore', 'Le nuove password non corrispondono');
        return;
      }
      // Regex validation come legacy
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d_@.\/#+-]{8,}$/;
      if (!passwordRegex.test(passwordData.newPassword)) {
        showErrorMessage('Errore', 'Formato password non corretto (min 8 caratteri alfanumerici)');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Update profile data
      const updatePayload = {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        nickName: formData.nickName,
        birthday: formData.birthday || null,
        gender: formData.gender === '' ? null : formData.gender === 'true'
      };

      const profileResponse = await ApiClient.put('/api/users/profile', updatePayload);

      // Update password if provided
      if (isChangingPassword) {
        await ApiClient.put('/api/users/password', {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        });
      }

      // Update user context
      if (profileResponse.user) {
        updateUser(profileResponse.user);
      }

      showSuccessMessage('Profilo aggiornato', 'Le modifiche sono state salvate con successo');

      // Reset password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
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
    <div className="profile-edit-page">
      {/* Replica esatta del layout legacy ui-block */}
      <div className="ui-block">
        <div className="ui-block-title">
          <h6 className="title">{t('resourceBundle.Personal_Information', 'Informazioni Personali')}</h6>
        </div>
        <div className="ui-block-content">
          {/* Personal Information Form */}
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="row">
              {/* Nome */}
              <div className="col col-lg-6 col-md-6 col-sm-12 col-12">
                <label htmlFor="first_name">{t('resourceBundle.First_Name', 'Nome')}</label>
                <input
                  type="text"
                  id="first_name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              {/* Cognome */}
              <div className="col col-lg-6 col-md-6 col-sm-12 col-12">
                <label htmlFor="last_name" className="control-label">
                  {t('resourceBundle.Last_Name', 'Cognome')}
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              {/* Email */}
              <div className="col col-lg-6 col-md-6 col-sm-12 col-12">
                <label htmlFor="email">{t('resourceBundle.Email', 'Email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-control"
                  pattern="^(([a-zA-Z0-9_+.-]+)@([a-zA-Z0-9][a-zA-Z0-9_.-]+).([a-zA-Z]+))$"
                  required
                />
              </div>

              {/* Conferma Email */}
              <div className="col col-lg-6 col-md-6 col-sm-12 col-12">
                <label className="control-label">
                  {t('resourceBundle.Confirm_Email', 'Conferma Email')}
                </label>
                <input
                  type="email"
                  name="emailConfirmation"
                  value={formData.emailConfirmation}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              {/* Password (opzionale per cambio) */}
              <div className="col col-lg-6 col-md-6 col-sm-12 col-12">
                <label className="control-label">
                  {t('resourceBundle.Password', 'Password')} <span style={{ fontSize: '0.9em' }}>({t('authentication.min8chars_alphanumeric', 'min 8 caratteri alfanumerici')})</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    placeholder={t('authentication.min8chars_alphanumeric', '(min 8 caratteri alfanumerici)')}
                    className="form-control"
                    autoComplete="new-password"
                    pattern="^$|^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d_@./#+-]{8,}$"
                  />
                  <span
                    className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} field-icon toggle-password`}
                    onClick={togglePasswordVisibility}
                    style={{ cursor: 'pointer' }}
                  ></span>
                  {passwordStrength.label && isPasswordFocused && (
                    <div className={`password-strength-indicator ${passwordStrength.className}`}>
                      {passwordStrength.label}
                    </div>
                  )}
                </div>
              </div>

              {/* Conferma Password */}
              <div className="col col-lg-6 col-md-6 col-sm-12 col-12">
                <label className="control-label">
                  {t('resourceBundle.Confirm_Password', 'Conferma Password')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm_password"
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
                    style={{ cursor: 'pointer' }}
                  ></span>
                </div>
              </div>

              {/* Password attuale (necessaria solo se si vuole cambiare password) */}
              {passwordData.newPassword && (
                <div className="col col-lg-12 col-md-12 col-sm-12 col-12">
                  <label className="control-label">
                    {t('resourceBundle.Current_Password', 'Password Attuale')} *
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="form-control"
                    autoComplete="current-password"
                    required={passwordData.newPassword !== ''}
                  />
                  <small className="form-text text-muted">
                    * Richiesta per confermare il cambio password
                  </small>
                </div>
              )}

              {/* Submit Button */}
              <div className="col col-lg-12 col-md-12 col-sm-12 col-12">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('resourceBundle.Saving', 'Salvataggio...') : t('resourceBundle.Save', 'Salva')}
                </button>
              </div>
            </div>
          </form>
          {/* ... end Personal Information Form */}
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
