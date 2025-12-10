import React from 'react';
import DayCell from './DayCell';

/**
 * MonthView - Monthly calendar grid
 * Displays a month grid with day cells
 */
const MonthView = ({ currentMonth, events, onRefresh, onDayClick }) => {
  // Get days to display in the month grid
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, ...

    // Get last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Build array of days to display
    const days = [];

    // Add empty cells for days before the 1st of the month
    // In Italy, week starts on Monday (1), so we need to adjust
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // Add actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    if (!date) return [];

    const dateStr = formatDate(date);

    return events.filter(event => {
      const eventStart = new Date(event.beginning);
      const eventEnd = event.ending ? new Date(event.ending) : eventStart;

      // Check if date is within event range
      const checkDate = new Date(dateStr);
      return checkDate >= new Date(formatDate(eventStart)) &&
             checkDate <= new Date(formatDate(eventEnd));
    });
  };

  // Helper: Format date as YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if a date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const days = getDaysInMonth();
  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <div className="month-view">
      {/* Week day headers */}
      <div className="calendar-grid">
        {weekDays.map(day => (
          <div key={day} className="weekday-header">
            {day}
          </div>
        ))}

        {/* Day cells */}
        {days.map((date, index) => (
          <DayCell
            key={index}
            date={date}
            events={getEventsForDate(date)}
            isToday={isToday(date)}
            onDayClick={onDayClick}
          />
        ))}
      </div>
    </div>
  );
};

export default MonthView;
