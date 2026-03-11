import React, { useMemo } from 'react';

/**
 * ScheduleWeekView - Weekly calendar view with time slots
 * Similar to PrimeFaces schedule week view
 */
const ScheduleWeekView = ({ currentDate, events, onTimeClick, onEventClick }) => {
  // Hours to display (6:00 - 22:00)
  const hours = useMemo(() => {
    return Array.from({ length: 17 }, (_, i) => i + 6);
  }, []);

  // Get the week days (Monday to Sunday)
  const weekDays = useMemo(() => {
    const days = [];
    const dayOfWeek = currentDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + mondayOffset + i);
      days.push(date);
    }
    return days;
  }, [currentDate]);

  // Day names in Italian
  const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Get events for a specific day and hour
  const getEventsForSlot = (date, hour) => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = event.end ? new Date(event.end) : new Date(eventStart.getTime() + 60 * 60 * 1000);

      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Check if event overlaps with this slot
      return eventStart.toDateString() === date.toDateString() &&
             eventStart.getHours() === hour;
    });
  };

  // Handle time slot click
  const handleSlotClick = (date, hour) => {
    const clickedDate = new Date(date);
    clickedDate.setHours(hour, 0, 0, 0);
    onTimeClick(clickedDate);
  };

  return (
    <div className="schedule-week-view">
      {/* Header with day names */}
      <div className="week-header">
        <div className="time-column-header"></div>
        {weekDays.map((date, index) => (
          <div
            key={index}
            className={`day-column-header ${isToday(date) ? 'today' : ''}`}
          >
            <span className="day-name">{dayNames[index]}</span>
            <span className="day-number">{date.getDate()}</span>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="week-body">
        {hours.map(hour => (
          <div key={hour} className="time-row">
            <div className="time-label">
              {String(hour).padStart(2, '0')}:00
            </div>
            {weekDays.map((date, dayIndex) => {
              const slotEvents = getEventsForSlot(date, hour);
              return (
                <div
                  key={dayIndex}
                  className={`time-slot ${isToday(date) ? 'today' : ''}`}
                  onClick={() => handleSlotClick(date, hour)}
                >
                  {slotEvents.map((event, eventIndex) => (
                    <div
                      key={event.id || eventIndex}
                      className={`week-event ${event.color || ''}`}
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
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleWeekView;
