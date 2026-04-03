import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import ProfileEdit from './ProfileEdit';
import NotificationList from './NotificationList';
import CollaboratorsList from './CollaboratorsList';
import ExamPathologyList from './ExamPathologyList';
import BlogCategoryList from './BlogCategoryList';
import './Profile.css';

/**
 * Profile Component
 * Wrapper per ProfileEdit e NotificationList con tab routing
 * Replica comportamento di /app/profile legacy
 * tab=0: Cambia Password (ProfileEdit)
 * tab=1: Collaboratori (CollaboratorsList)
 * tab=2: Lista Notifiche (NotificationList)
 * tab=3: Esami e Patologie (ExamPathologyList)
 * tab=4: Categorie del blog (BlogCategoryList)
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
      case 1:
        return <CollaboratorsList errorHandler={errorHandler} />;
      case 2:
        return <NotificationList errorHandler={errorHandler} />;
      case 3:
        return <ExamPathologyList errorHandler={errorHandler} />;
      case 4:
        return <BlogCategoryList errorHandler={errorHandler} />;
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
