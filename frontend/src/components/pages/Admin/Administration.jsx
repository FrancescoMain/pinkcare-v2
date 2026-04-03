import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ThreeColumnLayout from '../../layout/ThreeColumnLayout';
import UserProfileSidebar from '../../layout/UserProfileSidebar';
import AdvertisingSidebar from '../../layout/AdvertisingSidebar';
import ConsumerList from './ConsumerList';
import BusinessList from './BusinessList';
import './Administration.css';

const Administration = () => {
  const [searchParams] = useSearchParams();

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

  return (
    <ThreeColumnLayout
      leftSidebar={<UserProfileSidebar />}
      rightSidebar={<AdvertisingSidebar />}
      leftColSize={2}
      centerColSize={8}
      rightColSize={2}
    >
      <div className="admin-page">
        <div className="admin-content">
          {activeTab === 0 && <ConsumerList />}
          {activeTab === 1 && <BusinessList />}
        </div>
      </div>
    </ThreeColumnLayout>
  );
};

export default Administration;
