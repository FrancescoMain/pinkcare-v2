import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/authService';
import './MainContainer.css';

const MainContainer = ({ userVO = null, children, errorHandler }) => {
  const { t } = useTranslation();
  const { showSuccessMessage, showErrorMessage } = errorHandler;
  const navigate = useNavigate();
  const { login } = useAuth();

  // Stati per form di login mobile
  const [mobileLoginData, setMobileLoginData] = useState({
    j_username: '',
    j_password: '',
    _spring_security_remember_me: false
  });

  const handleMobileLoginChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMobileLoginData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMobileLogin = async (e) => {
    e.preventDefault();
    console.log('Mobile Login:', mobileLoginData);

    try {
      const response = await login(
        mobileLoginData.j_username,
        mobileLoginData.j_password,
        mobileLoginData._spring_security_remember_me
      );

      console.log('✅ Mobile Login response received:', response);
      showSuccessMessage('Login Mobile', 'Login effettuato con successo');

      // Navigate to profile page after successful login
      navigate('/profile');

    } catch (error) {
      console.error('❌ Mobile Login error:', error);
      showErrorMessage(t('authentication.authentication_error', 'Errore di autenticazione'));
    }
  };


  const handlePasswordForgot = async () => {
    if (!mobileLoginData.j_username) {
      showErrorMessage('Errore', 'Inserisci prima il tuo indirizzo email');
      return;
    }

    try {
      console.log('Password dimenticata per:', mobileLoginData.j_username);
      await AuthService.forgotPassword(mobileLoginData.j_username);
      showSuccessMessage('Recovery', 'Email di recupero inviata');
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      showErrorMessage('Errore', 'Errore durante l\'invio della email di recupero');
    }
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

          {/* Start Content Area */}
          {children}
          {/* End Content Area */}
        </div>
      </div>
    </>
  );
};

export default MainContainer;