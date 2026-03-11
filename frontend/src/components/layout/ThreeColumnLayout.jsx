import React from 'react';
import './ThreeColumnLayout.css';

/**
 * ThreeColumnLayout - Layout riutilizzabile a 3 colonne REPLICA ESATTA del legacy
 * Layout full-width con:
 * - Sidebar sinistra (default: col-xl-3, 25%)
 * - Contenuto centrale (default: col-xl-6, 50%)
 * - Sidebar destra (default: col-xl-3, 25%)
 *
 * Props:
 * - leftSidebar: contenuto sidebar sinistra
 * - children: contenuto centrale
 * - rightSidebar: contenuto sidebar destra (opzionale)
 * - leftColSize: dimensione colonna sinistra (default: 3)
 * - centerColSize: dimensione colonna centrale (default: 6)
 * - rightColSize: dimensione colonna destra (default: 3)
 */
const ThreeColumnLayout = ({
  leftSidebar,
  children,
  rightSidebar,
  leftColSize = 3,
  centerColSize = 6,
  rightColSize = 3
}) => {
  return (
    <div className="three-column-layout">
      <div className="three-column-row">
        {/* Sidebar Sinistra */}
        {leftSidebar && (
          <div className={`col sidebar-left col-xl-${leftColSize} order-xl-1 col-lg-${leftColSize} order-lg-1 col-md-12 order-md-2 col-sm-12 col-12`}>
            {leftSidebar}
          </div>
        )}

        {/* Contenuto Centrale */}
        <div className={`col col-xl-${centerColSize} order-xl-2 col-lg-${centerColSize} order-lg-2 col-md-12 order-md-1 col-sm-12 col-12`}>
          {children}
        </div>

        {/* Sidebar Destra */}
        {rightSidebar && (
          <div className={`col sidebar-right col-xl-${rightColSize} order-xl-3 col-lg-${rightColSize} order-lg-3 col-md-12 order-md-3 col-sm-12 col-12`}>
            {rightSidebar}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreeColumnLayout;
