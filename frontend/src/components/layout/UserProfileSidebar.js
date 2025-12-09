import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import './UserProfileSidebar.css';

/**
 * UserProfileSidebar - REPLICA ESATTA della sidebar sinistra del legacy (ProfileEdit)
 * Componente riutilizzabile per tutte le pagine consumer
 */
const UserProfileSidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  // Calcola BMI (IBM = Indice di Massa Corporea)
  const calculateBMI = (weight, height) => {
    if (!weight || !height || height <= 0) return null;
    // height è in cm, convertiamo in metri
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  // Descrizione BMI basata sul valore - REPLICA ESATTA del legacy
  // Soglie: <18.5 Sottopeso, 18.5-24.99 Normopeso, 25-29.99 Sovrappeso, >=30 Obesità
  const getBMIDescription = (bmi) => {
    if (!bmi) return '';
    if (bmi < 18.5) return t('resourceBundle.Underweight', 'Sottopeso');
    if (bmi < 25) return t('resourceBundle.Normal_weight', 'Normopeso');
    if (bmi < 30) return t('resourceBundle.Overweight', 'Sovrappeso');
    return t('resourceBundle.Obese', 'Obesità');
  };

  // Capitalizza prima lettera
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const userAge = user?.birthday ? calculateAge(user.birthday) : null;
  // Arrotondiamo a 2 decimali per coerenza tra display e classificazione
  const rawBMI = calculateBMI(user?.weight, user?.height);
  const userBMI = rawBMI ? Math.round(rawBMI * 100) / 100 : null;

  const handleModificaStoriaClinica = () => {
    // Naviga a Consumer tab=0 (Storia Clinica)
    navigate('/consumer?tab=0');
  };

  const handleCalcolaDataParto = () => {
    // TODO: Implementare calcolo data parto (calendario mestruale?)
    navigate('/consumer?tab=5');
  };

  return (
    <div className="ui-block">
      {/* User Card - REPLICA ESATTA del legacy top-header-author */}
      <div className="top-header-author">
        {/* Avatar centrato come legacy */}
        <div className="widget-thumb author-thumb">
          <img
            src="/styles/olympus/assets/images/avatar.jpg"
            alt="author"
            className="user_img"
          />
        </div>

        {/* Nome e età come legacy */}
        <div className="user_info">
          <span className="h4 name">
            {capitalize(user?.name) || ''} {capitalize(user?.surname) || ''}
          </span>
          {userAge && (
            <p>ETA: <strong>{userAge} ANNI</strong></p>
          )}
        </div>
      </div>

      {/* Pulsante Modifica Storia Clinica - REPLICA ESATTA del legacy edit_anagraphic */}
      <div className="edit_anagraphic" onClick={handleModificaStoriaClinica}>
        <span>Modifica storia clinica</span>
      </div>

      {/* Eventi del mese - REPLICA ESATTA del legacy */}
      <div className="widget w-build-fav btn-wid">
        <div className="widget-thumb sched_list">
          <h6 style={{ borderBottom: '1px solid #ddd' }}>Eventi del mese</h6>
          <div className="nothing-found">
            <span>No records found.</span>
          </div>
        </div>
      </div>

      {/* IBM (BMI) - REPLICA ESATTA del legacy: mostrato solo se peso e altezza sono presenti */}
      {userBMI && userBMI > 0 && (
        <div className="ui-block">
          <div className="widget w-build-fav bmi-widget">
            <div className="ibm">
              <h4>{t('resourceBundle.Your_bmi_label', 'Il tuo indice di massa corporea è')}:</h4>
              <div className="bmi-value-container">
                <h3 className="bmi-value">{userBMI.toFixed(2)}</h3>
                <i className="fas fa-info-circle bmi-info-icon"></i>
                <span className="bmi-tooltip">
                  {t('resourceBundle.bmi_info', 'È un indice che ti aiuta a capire se il tuo peso è nella norma')}
                </span>
              </div>
              <h3 className="bmi-description">{getBMIDescription(userBMI)}</h3>
              <button
                className="btn btn-xs bg-outline-w"
                onClick={handleModificaStoriaClinica}
              >
                {t('resourceBundle.Recalculate', 'Ricalcola')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pulsante Calcola Data Parto - REPLICA ESATTA del legacy */}
      <div className="widget w-build-fav btn-wid calcola-parto" onClick={handleCalcolaDataParto}>
        <div className="ibm">
          <h4>Calcola data parto</h4>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSidebar;
