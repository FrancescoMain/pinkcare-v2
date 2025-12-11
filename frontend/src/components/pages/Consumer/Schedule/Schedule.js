import React, { useState, useEffect, useCallback } from 'react';
import ScheduleApi from '../../../../services/scheduleApi';
import ScheduleMonthView from './ScheduleMonthView';
import ScheduleWeekView from './ScheduleWeekView';
import ScheduleDayView from './ScheduleDayView';
import ScheduleEventDialog from './ScheduleEventDialog';
import { toast } from 'react-toastify';
import './schedule.css';

/**
 * Schedule - Personal Agenda Component
 * Main component for managing personal calendar events/appointments
 * Replicates legacy PrimeFaces schedule functionality
 */
// Legend colors for exam types (from legacy)
const EXAM_LEGEND = [
  { id: 'ui-event-lavander', label: 'Esami prenotati', hex: '#7986cb' },
  { id: 'ui-event-red-purple', label: 'Esami periodici', hex: '#8e24aa' }
];

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month'); // 'month', 'week', 'day'
  const [events, setEvents] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Event dialog state
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Helper: Format date as YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get date range based on view type
  const getDateRange = useCallback((date, view) => {
    let start, end;

    if (view === 'month') {
      start = new Date(date.getFullYear(), date.getMonth(), 1);
      end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    } else if (view === 'week') {
      const dayOfWeek = date.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Start from Monday
      start = new Date(date);
      start.setDate(date.getDate() + mondayOffset);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else { // day
      start = new Date(date);
      start.setHours(0, 0, 0, 0);
      end = new Date(date);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }, []);

  // Load events for the current view
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);

      const { start, end } = getDateRange(currentDate, viewType);
      const startStr = formatDate(start);
      const endStr = formatDate(end);

      const response = await ScheduleApi.getEvents(startStr, endStr);
      setEvents(response.events || []);

    } catch (error) {
      console.error('Error loading schedule events:', error);
      toast.error('Errore nel caricamento degli eventi');
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewType, getDateRange]);

  // Load available colors
  const loadColors = useCallback(async () => {
    try {
      const response = await ScheduleApi.getColors();
      setColors(response.colors || []);
    } catch (error) {
      console.error('Error loading colors:', error);
    }
  }, []);

  // Load events when month changes
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Load colors on mount
  useEffect(() => {
    loadColors();
  }, [loadColors]);

  // Navigate to previous period (based on view type)
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  // Navigate to next period (based on view type)
  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get the title based on view type
  const getViewTitle = () => {
    if (viewType === 'month') {
      return currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    } else if (viewType === 'week') {
      const { start, end } = getDateRange(currentDate, 'week');
      return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  // Handle day click - open dialog to create new event
  const handleDayClick = (date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setShowEventDialog(true);
  };

  // Handle event click - open dialog to edit event
  const handleEventClick = (event) => {
    setSelectedDate(new Date(event.start));
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  // Close event dialog
  const handleCloseDialog = () => {
    setShowEventDialog(false);
    setSelectedDate(null);
    setSelectedEvent(null);
  };

  // Handle event saved (create or update)
  const handleEventSaved = async () => {
    handleCloseDialog();
    await loadEvents();
    toast.success(selectedEvent ? 'Evento aggiornato' : 'Evento creato');
  };

  // Handle event deleted
  const handleEventDeleted = async () => {
    handleCloseDialog();
    await loadEvents();
    toast.success('Evento eliminato');
  };

  return (
    <div className="schedule-calendar">
      {/* Title Block - replica esatta del legacy */}
      <div className="schedule-title-block">
        <h5 className="title">Agenda</h5>
        <div className="schedule-legend-inline">
          {EXAM_LEGEND.map((item, index) => (
            <span key={index} className="legend-item">
              <i className="fas fa-square" style={{ color: item.hex }}></i>
              <span className="legend-label">{item.label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="schedule-container">
        {/* Calendar Header - same as menses calendar */}
        <div className="calendar-header">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={goToPrevious}
            title="Precedente"
          >
            <i className="fas fa-chevron-left"></i>
          </button>

          <h2 className="calendar-title">{getViewTitle()}</h2>

          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={goToNext}
            title="Successivo"
          >
            <i className="fas fa-chevron-right"></i>
          </button>

          <button
            className="btn btn-sm btn-primary ms-3"
            onClick={goToToday}
            title="Vai a oggi"
          >
            Oggi
          </button>
        </div>

        {/* View Switcher - Segmented Control */}
        <div className="schedule-view-tabs">
          <div className="schedule-view-tabs-container">
            <button
              className={`view-tab ${viewType === 'month' ? 'active' : ''}`}
              onClick={() => setViewType('month')}
            >
              Mese
            </button>
            <button
              className={`view-tab ${viewType === 'week' ? 'active' : ''}`}
              onClick={() => setViewType('week')}
            >
              Settimana
            </button>
            <button
              className={`view-tab ${viewType === 'day' ? 'active' : ''}`}
              onClick={() => setViewType('day')}
            >
              Giorno
            </button>
          </div>
        </div>

        {loading ? (
          <div className="schedule-loading">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Caricamento...</span>
            </div>
            <p>Caricamento agenda...</p>
          </div>
        ) : viewType === 'month' ? (
          <ScheduleMonthView
            currentMonth={currentDate}
            events={events}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        ) : viewType === 'week' ? (
          <ScheduleWeekView
            currentDate={currentDate}
            events={events}
            onTimeClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        ) : (
          <ScheduleDayView
            currentDate={currentDate}
            events={events}
            onTimeClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {/* Event Dialog */}
      {showEventDialog && (
        <ScheduleEventDialog
          isOpen={showEventDialog}
          onClose={handleCloseDialog}
          selectedDate={selectedDate}
          event={selectedEvent}
          colors={colors}
          onSaved={handleEventSaved}
          onDeleted={handleEventDeleted}
        />
      )}
    </div>
  );
};

export default Schedule;
