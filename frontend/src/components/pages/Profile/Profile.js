import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import ProfileEdit from './ProfileEdit';
import NotificationList from './NotificationList';
import './Profile.css';

/**
 * Profile Component
 * Wrapper per ProfileEdit e NotificationList con tab routing
 * Replica comportamento di /app/profile legacy
 * tab=0: Cambia Password (ProfileEdit)
 * tab=2: Lista Notifiche (NotificationList)
 */
const Profile = () => {
  const [searchParams] = useSearchParams();
  const errorHandler = useErrorHandler();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab !== null) {
      setActiveTab(parseInt(tab));
    }
  }, [searchParams]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 2:
        return <NotificationList errorHandler={errorHandler} />;
      case 0:
      default:
        return <ProfileEdit errorHandler={errorHandler} />;
    }
  };

  return (
    <div className="profile-page">
      {renderTabContent()}
    </div>
  );
};

export default Profile;
