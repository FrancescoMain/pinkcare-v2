import React from 'react';

/**
 * ScheduleMonthView - Month grid view for schedule/agenda
 * Displays a month calendar with event indicators
 */
const ScheduleMonthView = ({ currentMonth, events, onDayClick, onEventClick }) => {

  // Get all days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty days for padding (start of month)
    const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Format date as YYYY-MM-DD
  const formatDate = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get events for a specific day
  const getEventsForDay = (date) => {
    if (!date) return [];
    const dateStr = formatDate(date);

    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = event.end ? new Date(event.end) : eventStart;
      const checkDate = new Date(dateStr);

      // Check if the date falls within the event range
      const eventStartStr = formatDate(eventStart);
      const eventEndStr = formatDate(eventEnd);

      return checkDate >= new Date(eventStartStr) && checkDate <= new Date(eventEndStr);
    });
  };

  // Check if date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  // Weekday headers (Italian)
  const weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  const days = getDaysInMonth(currentMonth);

  return (
    <div className="schedule-month-view">
      <div className="schedule-grid">
        {/* Weekday Headers */}
        {weekdays.map((day, index) => (
          <div key={`header-${index}`} className="weekday-header">
            {day}
          </div>
        ))}

        {/* Day Cells */}
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="day-cell empty-cell"></div>;
          }

          const dayEvents = getEventsForDay(date);
          const hasEvents = dayEvents.length > 0;

          return (
            <div
              key={formatDate(date)}
              className={`day-cell ${isToday(date) ? 'today' : ''} ${hasEvents ? 'has-events' : ''}`}
              onClick={() => onDayClick(date)}
            >
              <span className="day-number">{date.getDate()}</span>

              {/* Event indicators */}
              {hasEvents && (
                <div className="event-list">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={event.id || eventIndex}
                      className={`event-item ${event.color || ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      title={event.title}
                    >
                      <span className="event-time">
                        {new Date(event.start).toLocaleTimeString('it-IT', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="event-title">{event.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="event-more">
                      +{dayEvents.length - 3} altri
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleMonthView;
