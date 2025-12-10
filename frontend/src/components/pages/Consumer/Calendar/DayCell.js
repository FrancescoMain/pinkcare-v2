import React from 'react';

/**
 * DayCell - Individual day cell in the calendar grid
 * Shows date number and event indicators with legacy-style coloring
 */

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

const DayCell = ({ date, events, isToday, onDayClick }) => {
  if (!date) {
    return <div className="day-cell empty-cell"></div>;
  }

  // Check event types for this day
  const hasMenses = events.some(e => parseInt(e.typeId) === EVENT_TYPES.MENSES && !e.calculated);
  const hasOvulation = events.some(e => parseInt(e.typeId) === EVENT_TYPES.OVULATION);
  const hasFertility = events.some(e => parseInt(e.typeId) === EVENT_TYPES.FERTILITY);
  const hasExpectation = events.some(e => parseInt(e.typeId) === EVENT_TYPES.MENSES_EXPECTATION);

  // Check for pregnancy trimesters
  const pregnancyEvent = events.find(e => parseInt(e.typeId) === EVENT_TYPES.PREGNANCY);
  const pregnancyTrimester = pregnancyEvent?.trimester || null;

  // Check for other events (symptoms, drugs, moods, weight, temperature)
  const hasOtherEvents = events.some(e =>
    [EVENT_TYPES.SYMPTOMS, EVENT_TYPES.DRUGS, EVENT_TYPES.MOODS,
      EVENT_TYPES.WEIGHT, EVENT_TYPES.TEMPERATURE].includes(parseInt(e.typeId))
  );

  const dayNumber = date.getDate();

  // Build class list based on event types (legacy style)
  const cellClasses = [
    'day-cell',
    isToday ? 'today' : '',
    hasMenses ? 'menses-day' : '',
    hasOvulation && !hasMenses ? 'ovulation-day' : '',
    hasFertility && !hasMenses && !hasOvulation ? 'fertility-day' : '',
    hasExpectation && !hasMenses ? 'expectation-day' : '',
    pregnancyTrimester === 1 ? 'pregnancy-1-trimester' : '',
    pregnancyTrimester === 2 ? 'pregnancy-2-trimester' : '',
    pregnancyTrimester === 3 ? 'pregnancy-3-trimester' : '',
    hasOtherEvents ? 'has-other-events' : '',
    events.length > 0 ? 'has-events' : ''
  ].filter(Boolean).join(' ');

  // Handle click
  const handleClick = () => {
    if (onDayClick) {
      onDayClick(date, events);
    }
  };

  return (
    <div className={cellClasses} onClick={handleClick} role="button" tabIndex={0}>
      <div className="day-number">{dayNumber}</div>

      {/* Visual indicators for specific event types */}
      <div className="event-indicators">
        {hasMenses && (
          <span
            className="event-dot"
            style={{ backgroundColor: '#e42080' }}
            title="Ciclo mestruale"
          />
        )}
        {hasOvulation && !hasMenses && (
          <span
            className="event-dot"
            style={{ backgroundColor: '#ff9800' }}
            title="Ovulazione"
          />
        )}
        {hasFertility && !hasMenses && !hasOvulation && (
          <span
            className="event-dot"
            style={{ backgroundColor: '#4caf50' }}
            title="Periodo fertile"
          />
        )}
        {hasExpectation && !hasMenses && (
          <span
            className="event-dot"
            style={{ backgroundColor: '#f8bbd9' }}
            title="Prossimo ciclo previsto"
          />
        )}
        {events.some(e => parseInt(e.typeId) === EVENT_TYPES.SYMPTOMS) && (
          <span
            className="event-dot"
            style={{ backgroundColor: '#ff5722' }}
            title="Sintomi"
          />
        )}
        {events.some(e => parseInt(e.typeId) === EVENT_TYPES.WEIGHT) && (
          <span
            className="event-dot"
            style={{ backgroundColor: '#2196f3' }}
            title="Peso"
          />
        )}
        {events.some(e => parseInt(e.typeId) === EVENT_TYPES.TEMPERATURE) && (
          <span
            className="event-dot"
            style={{ backgroundColor: '#9c27b0' }}
            title="Temperatura"
          />
        )}
        {events.some(e => parseInt(e.typeId) === EVENT_TYPES.DRUGS) && (
          <span
            className="event-dot"
            style={{ backgroundColor: '#00bcd4' }}
            title="Farmaci"
          />
        )}
        {events.some(e => parseInt(e.typeId) === EVENT_TYPES.MOODS) && (
          <span
            className="event-dot"
            style={{ backgroundColor: '#ffeb3b' }}
            title="Stati d'animo"
          />
        )}
      </div>
    </div>
  );
};

export default DayCell;
