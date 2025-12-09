import React from 'react';

/**
 * CalendarLegend - Legend showing event type colors
 * Displays color codes for different event types
 */
const CalendarLegend = () => {
  const legendItems = [
    { color: '#ff0000', label: 'Ciclo' },
    { color: '#ffb6c1', label: 'Prossimo Ciclo' },
    { color: '#ffa500', label: 'Ovulazione' },
    { color: '#90ee90', label: 'Periodo fertile' },
    { color: '#4169e1', label: 'Evento' }
  ];

  return (
    <div className="calendar-legend">
      <h5>Legenda</h5>
      <div className="legend-items">
        {legendItems.map((item, index) => (
          <div key={index} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: item.color }}
            />
            <span className="legend-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarLegend;
