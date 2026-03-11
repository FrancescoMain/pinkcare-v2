import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ProfileSidebar.css';

/**
 * ProfileSidebar - REPLICA ESATTA della sidebar sinistra del layout standard.xhtml
 * Contiene: foto profilo, nome utente, età, bottone "Modifica storia clinica", "Calcola data parto"
 */
const ProfileSidebar = () => {
  const { user } = useAuth();

  // Calcola età dall'utente
  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const userAge = user?.birthday ? calculateAge(user.birthday) : null;
  const defaultAvatar = '/styles/olympus/assets/images/avatar.jpg';
  const userAvatar = user?.avatar || defaultAvatar;

  return (
    <div className="profile-sidebar">
      {/* Widget con foto profilo e info utente */}
      <div className="ui-block">
        <div className="top-header-author">
          <div className="widget-thumb author-thumb">
            <img
              src={userAvatar}
              alt="User"
              className="user_img"
            />
          </div>

          <div className="user_info">
            <span className="h4 name">
              {user?.name} {user?.surname}
            </span>
            {userAge && (
              <p>ETA: <strong>{userAge} ANNI</strong></p>
            )}
          </div>
        </div>

        {/* Link "Modifica storia clinica" */}
        <div className="edit_anagraphic d-none d-lg-block">
          <Link to="/consumer?tab=0">Modifica storia clinica</Link>
        </div>
      </div>

      {/* Widget "Calcola data parto" - sempre visibile per consumer */}
      <div className="ui-block">
        <Link to="#" className="widget-link">
          <div className="widget w-build-fav btn-wid" style={{ backgroundColor: '#f29811', padding: '10px' }}>
            <div className="ibm">
              <h4 style={{ margin: 0, color: 'white' }}>Calcola data parto</h4>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default ProfileSidebar;
