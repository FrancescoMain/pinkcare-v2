import React from 'react';

/**
 * DayCell - Individual day cell in the calendar grid
 * Shows date number and event indicators
 */
const DayCell = ({ date, events, isToday, onRefresh }) => {
  if (!date) {
    return <div className="day-cell empty-cell"></div>;
  }

  // Event type constants (from backend)
  const EVENT_TYPES = {
    MENSES: 20,
    TEMPERATURE: 21,
    WEIGHT: 22,
    SYMPTOMS: 23,
    DRUGS: 24,
    MOODS: 25,
    OVULATION: 26,
    FERTILITY: 27,
    MENSES_EXPECTATION: 28,
    PREGNANCY: 29
  };

  // Get event indicators (colored dots) for this day
  const getEventIndicators = () => {
    const indicators = [];

    // Check for menses (actual period)
    const hasMenses = events.some(e => e.typeId === EVENT_TYPES.MENSES && !e.calculated);
    if (hasMenses) {
      indicators.push({ type: 'menses', label: 'Ciclo', color: '#ff0000' });
    }

    // Check for ovulation (calculated)
    const hasOvulation = events.some(e => e.typeId === EVENT_TYPES.OVULATION && e.calculated);
    if (hasOvulation) {
      indicators.push({ type: 'ovulation', label: 'Ovulazione', color: '#ffa500' });
    }

    // Check for fertility window (calculated)
    const hasFertility = events.some(e => e.typeId === EVENT_TYPES.FERTILITY && e.calculated);
    if (hasFertility) {
      indicators.push({ type: 'fertility', label: 'Periodo fertile', color: '#90ee90' });
    }

    // Check for predicted menses
    const hasPrediction = events.some(e => e.typeId === EVENT_TYPES.MENSES_EXPECTATION && e.calculated);
    if (hasPrediction) {
      indicators.push({ type: 'prediction', label: 'Prossimo ciclo', color: '#ffb6c1' });
    }

    // Check for other events (symptoms, drugs, moods, weight, temperature)
    const hasOtherEvents = events.some(e =>
      [EVENT_TYPES.SYMPTOMS, EVENT_TYPES.DRUGS, EVENT_TYPES.MOODS,
       EVENT_TYPES.WEIGHT, EVENT_TYPES.TEMPERATURE].includes(e.typeId)
    );
    if (hasOtherEvents) {
      indicators.push({ type: 'event', label: 'Evento', color: '#4169e1' });
    }

    return indicators;
  };

  const indicators = getEventIndicators();
  const dayNumber = date.getDate();

  const cellClasses = [
    'day-cell',
    isToday ? 'today' : '',
    indicators.length > 0 ? 'has-events' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={cellClasses}>
      <div className="day-number">{dayNumber}</div>
      <div className="event-indicators">
        {indicators.map((indicator, index) => (
          <span
            key={index}
            className="event-dot"
            style={{ backgroundColor: indicator.color }}
            title={indicator.label}
          />
        ))}
      </div>
    </div>
  );
};

export default DayCell;
