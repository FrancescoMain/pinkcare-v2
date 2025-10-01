import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import ProfileEdit from './ProfileEdit';
import './Profile.css';

/**
 * Profile Component
 * Wrapper per ProfileEdit con error handling
 * Replica comportamento di /app/profile legacy
 */
const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const errorHandler = useErrorHandler();

  const handleLogout = () => {
    logout();
    navigate('/login?page=authentication');
  };

  return (
    <div className="profile-page">
      <div className="container">
        {/* ProfileEdit Component - replica esatta di personal_form.xhtml */}
        <ProfileEdit errorHandler={errorHandler} />
      </div>
    </div>
  );
};

export default Profile;
