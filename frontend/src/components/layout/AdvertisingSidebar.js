import React from 'react';
import './AdvertisingSidebar.css';

/**
 * AdvertisingSidebar - REPLICA ESATTA della sidebar destra del legacy (ProfileEdit)
 * Componente riutilizzabile per tutte le pagine consumer con banner pubblicitari
 */
const AdvertisingSidebar = () => {
  return (
    <div className="ui-block">
      {/* Banner Pubblicitario */}
      <div className="widget w-banner">
        <img
          src="/styles/olympus/assets/images/muscle-pharm-fish-oil-banner.jpg"
          alt="Banner"
          style={{ width: '100%', borderRadius: '5px' }}
        />
      </div>
    </div>
  );
};

export default AdvertisingSidebar;
