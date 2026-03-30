import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ConsumerList from './ConsumerList';
import BusinessList from './BusinessList';
import './Administration.css';

const Administration = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam ? parseInt(tabParam, 10) : 0;
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam !== null) {
      setActiveTab(parseInt(tabParam, 10));
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab: tab.toString() });
  };

  return (
    <div className="admin-page">
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 0 ? 'active' : ''}`}
          onClick={() => handleTabChange(0)}
        >
          <i className="fas fa-users"></i>
          {t('admin.consumers')}
        </button>
        <button
          className={`admin-tab ${activeTab === 1 ? 'active' : ''}`}
          onClick={() => handleTabChange(1)}
        >
          <i className="fas fa-building"></i>
          {t('admin.businesses')}
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 0 && <ConsumerList />}
        {activeTab === 1 && <BusinessList />}
      </div>
    </div>
  );
};

export default Administration;
