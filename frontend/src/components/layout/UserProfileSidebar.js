import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './UserProfileSidebar.css';

/**
 * UserProfileSidebar - REPLICA ESATTA della sidebar sinistra del legacy (ProfileEdit)
 * Componente riutilizzabile per tutte le pagine consumer
 */
const UserProfileSidebar = () => {
  const { user } = useAuth();

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

  // Capitalizza prima lettera
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const userAge = user?.birthday ? calculateAge(user.birthday) : null;

  const handleModificaStoriaClinica = () => {
    // TODO: Implementare navigazione a storia clinica
    console.log('Navigazione a storia clinica');
  };

  const handleCalcolaDataParto = () => {
    // TODO: Implementare calcolo data parto
    console.log('Calcola data parto');
  };

  return (
    <div className="ui-block">
      {/* User Card - Layout semplice come legacy */}
      <div className="your-profile">
        {/* Avatar centrato */}
        <div className="author-thumb">
          <img
            src="/styles/olympus/assets/images/avatar.jpg"
            alt="author"
            className="profile-pic"
          />
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
            Modifica storia clinica
          </button>
        </div>

        {/* Eventi del mese */}
        <div className="events-section">
          <h6 className="section-title">Eventi del mese</h6>
          <div className="nothing-found">
            <span>No records found.</span>
          </div>
        </div>

        {/* Pulsante Calcola Data Parto */}
        <div className="profile-menu">
          <button
            className="btn btn-secondary btn-block"
            onClick={handleCalcolaDataParto}
          >
            Calcola data parto
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSidebar;
