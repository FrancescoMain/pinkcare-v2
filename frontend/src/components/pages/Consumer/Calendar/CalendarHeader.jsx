import React from 'react';

/**
 * CalendarHeader - Month navigation header
 * Shows current month/year with navigation buttons
 */
const CalendarHeader = ({ currentMonth, onPreviousMonth, onNextMonth, onToday }) => {
  // Format month and year for display
  const monthName = currentMonth.toLocaleDateString('it-IT', { month: 'long' });
  const year = currentMonth.getFullYear();

  return (
    <div className="calendar-header">
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={onPreviousMonth}
        title="Mese precedente"
      >
        <i className="fas fa-chevron-left"></i>
      </button>

      <h2 className="calendar-title">
        {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}
      </h2>

      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={onNextMonth}
        title="Mese successivo"
      >
        <i className="fas fa-chevron-right"></i>
      </button>

      <button
        className="btn btn-sm btn-primary ms-3"
        onClick={onToday}
        title="Vai a oggi"
      >
        Oggi
      </button>
    </div>
  );
};

export default CalendarHeader;
