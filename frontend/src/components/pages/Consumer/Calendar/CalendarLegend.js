import React from 'react';

/**
 * CalendarLegend - Legend showing event type colors
 * Displays color codes for different event types (legacy PrimeFaces style)
 *
 * @param {boolean} inline - If true, render inline version for header
 */
const CalendarLegend = ({ inline = false, hasPregnancy = false }) => {
  const legendItems = [
    { colorClass: 'menses', label: 'Ciclo', icon: 'fa-square', iconStyle: { color: '#f39ac6' } },
    { colorClass: 'expectation', label: 'Prossimo Ciclo' },
    { colorClass: 'ovulation', label: 'Ovulazione' },
    { colorClass: 'fertility', label: 'Periodo fertile' },
    { colorClass: 'event', label: 'Evento', icon: 'fa-circle', iconStyle: { color: '#4caf50', fontSize: '11px' } }
  ];

  // Inline version for header
  if (inline) {
    return (
      <div className="legend-inline">
        {legendItems.map((item, index) => (
          <span key={index} className="legend-item">
            {item.icon ? (
              <i className={`fas ${item.icon}`} style={item.iconStyle}></i>
            ) : (
              <span className={`legend-color ${item.colorClass}`}></span>
            )}
            <span className="legend-label">{item.label}</span>
          </span>
        ))}
      </div>
    );
  }

  // Full version for bottom of calendar
  return (
    <div className="calendar-legend">
      <h5>Legenda</h5>
      <div className="legend-items">
        {legendItems.map((item, index) => (
          <div key={index} className="legend-item">
            {item.icon ? (
              <i className={`fas ${item.icon}`} style={item.iconStyle}></i>
            ) : (
              <span className={`legend-color ${item.colorClass}`}></span>
            )}
            <span className="legend-label">{item.label}</span>
          </div>
        ))}

        {/* Pregnancy Trimesters (shown only when pregnant) */}
        {hasPregnancy && (
          <>
            <div className="legend-item pregnancy-legend pregnancy-1">
              <span className="legend-color pregnancy-1"></span>
              <span className="legend-label">Primo Trimestre di gravidanza</span>
            </div>
            <div className="legend-item pregnancy-legend pregnancy-2">
              <span className="legend-color pregnancy-2"></span>
              <span className="legend-label">Secondo Trimestre di gravidanza</span>
            </div>
            <div className="legend-item pregnancy-legend pregnancy-3">
              <span className="legend-color pregnancy-3"></span>
              <span className="legend-label">Terzo Trimestre di gravidanza</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarLegend;
