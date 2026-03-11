import React, { useMemo } from 'react';

/**
 * ScheduleDayView - Daily calendar view with time slots
 * Similar to PrimeFaces schedule day view
 */
const ScheduleDayView = ({ currentDate, events, onTimeClick, onEventClick }) => {
  // Hours to display (6:00 - 22:00)
  const hours = useMemo(() => {
    return Array.from({ length: 17 }, (_, i) => i + 6);
  }, []);

  // Check if the current date is today
  const isToday = useMemo(() => {
    const today = new Date();
    return currentDate.getDate() === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  }, [currentDate]);

  // Get events for a specific hour
  const getEventsForHour = (hour) => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      return eventStart.toDateString() === currentDate.toDateString() &&
             eventStart.getHours() === hour;
    });
  };

  // Handle time slot click
  const handleSlotClick = (hour) => {
    const clickedDate = new Date(currentDate);
    clickedDate.setHours(hour, 0, 0, 0);
    onTimeClick(clickedDate);
  };

  // Format the day header
  const dayHeader = currentDate.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="schedule-day-view">
      {/* Header */}
      <div className="day-header">
        <span className={`day-title ${isToday ? 'today' : ''}`}>
          {dayHeader}
        </span>
      </div>

      {/* Time grid */}
      <div className="day-body">
        {hours.map(hour => {
          const hourEvents = getEventsForHour(hour);
          return (
            <div key={hour} className="time-row">
              <div className="time-label">
                {String(hour).padStart(2, '0')}:00
              </div>
              <div
                className={`time-slot ${isToday ? 'today' : ''}`}
                onClick={() => handleSlotClick(hour)}
              >
                {hourEvents.map((event, eventIndex) => (
                  <div
                    key={event.id || eventIndex}
                    className={`day-event ${event.color || ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                  >
                    <div className="event-time">
                      {new Date(event.start).toLocaleTimeString('it-IT', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {event.end && (
                        <> - {new Date(event.end).toLocaleTimeString('it-IT', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</>
                      )}
                    </div>
                    <div className="event-title">{event.title}</div>
                    {event.description && (
                      <div className="event-description">{event.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleDayView;
