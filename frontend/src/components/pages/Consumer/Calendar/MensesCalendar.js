import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarApi from '../../../../services/calendarApi';
import CalendarHeader from './CalendarHeader';
import MonthView from './MonthView';
import CalendarLegend from './CalendarLegend';
import EventDialog from './EventDialog';
import DetailsDialog from './DetailsDialog';
import { toast } from 'react-toastify';
import './calendar.css';

/**
 * MensesCalendar - Menstrual Calendar Component
 * Main component for tracking menstrual cycle, symptoms, weight, etc.
 * Replicates legacy PrimeFaces calendar functionality
 */

// Event type constants
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

const MensesCalendar = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requiresProfileUpdate, setRequiresProfileUpdate] = useState(false);

  // Event dialog state
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);

  // Details dialog state (symptoms, drugs, moods)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailsEventType, setDetailsEventType] = useState(null);
  const [existingDetailsEvent, setExistingDetailsEvent] = useState(null);

  // Period state
  const [hasOpenPeriod, setHasOpenPeriod] = useState(false);
  const [openPeriodId, setOpenPeriodId] = useState(null);

  // Helper: Format date as YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load events for the current month
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setRequiresProfileUpdate(false); // Reset on each load

      // Get first day of month
      const getMonthStart = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1);
      };

      // Get last day of month
      const getMonthEnd = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
      };

      // Calculate start and end dates for the month
      const startDate = getMonthStart(currentMonth);
      const endDate = getMonthEnd(currentMonth);

      const startStr = formatDate(startDate);
      const endStr = formatDate(endDate);

      // First call getEvents which has the prerequisite check
      // This way we catch requiresProfileUpdate error properly
      let eventsResponse;
      try {
        eventsResponse = await CalendarApi.getEvents(startStr, endStr);
      } catch (eventsError) {
        // Check if it's a prerequisite error from getEvents
        // Note: ApiClient uses fetch, so error structure is:
        // - eventsError.details.requiresProfileUpdate (ApiError from fetch)
        // - eventsError.response?.data?.requiresProfileUpdate (axios pattern, fallback)
        const requiresUpdate =
          eventsError.details?.requiresProfileUpdate ||
          eventsError.response?.data?.requiresProfileUpdate;

        if (requiresUpdate) {
          setRequiresProfileUpdate(true);
          setLoading(false);
          return; // Stop here, don't call other APIs
        }
        throw eventsError; // Re-throw other errors
      }

      // Set events from getEvents response
      const loadedEvents = eventsResponse.events || [];
      setEvents(loadedEvents);

      // Only fetch menses info if events loaded successfully
      // This is optional - if it fails, calendar still works
      try {
        const mensesInfo = await CalendarApi.getLastMenses();
        setHasOpenPeriod(mensesInfo.hasOpenPeriod || false);
        setOpenPeriodId(mensesInfo.openPeriodId || null);
      } catch (mensesError) {
        // getLastMenses failed but getEvents succeeded
        // Calendar can still work without this info
        console.warn('Could not load menses info:', mensesError);
        setHasOpenPeriod(false);
        setOpenPeriodId(null);
      }

      return loadedEvents;

    } catch (error) {
      // Check if it's a prerequisite error (fallback)
      if (error.response?.data?.requiresProfileUpdate) {
        setRequiresProfileUpdate(true);
      } else {
        console.error('Error loading calendar events:', error);
        toast.error('Errore nel caricamento del calendario');
      }
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  // Load events when month changes
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Handle day click - open event dialog
  const handleDayClick = (date, dayEvents) => {
    setSelectedDate(date);
    setSelectedDayEvents(dayEvents);
    setShowEventDialog(true);
  };

  // Close event dialog
  const handleCloseEventDialog = () => {
    setShowEventDialog(false);
    setSelectedDate(null);
    setSelectedDayEvents([]);
  };

  // Open details dialog (symptoms, drugs, moods)
  const handleOpenDetails = (eventType, existingEvent) => {
    setDetailsEventType(eventType);
    setExistingDetailsEvent(existingEvent || null);
    setShowDetailsDialog(true);
    setShowEventDialog(false); // Close event dialog when opening details
  };

  // Close details dialog
  const handleCloseDetailsDialog = () => {
    setShowDetailsDialog(false);
    setDetailsEventType(null);
    setExistingDetailsEvent(null);
    // Reopen event dialog if we were coming from there
    if (selectedDate) {
      setShowEventDialog(true);
    }
  };

  // Refresh and reopen event dialog
  const handleRefreshAndReopen = async () => {
    const freshEvents = await loadEvents();
    // Update selected day events after refresh using the returned events
    if (selectedDate && freshEvents) {
      const dateStr = formatDate(selectedDate);
      const updatedEvents = freshEvents.filter(event => {
        const eventStart = new Date(event.beginning);
        const eventEnd = event.ending ? new Date(event.ending) : eventStart;
        const checkDate = new Date(dateStr);
        return checkDate >= new Date(formatDate(eventStart)) &&
               checkDate <= new Date(formatDate(eventEnd));
      });
      setSelectedDayEvents(updatedEvents);
    }
  };

  // Check if selected date is within an active menses period
  const isDateInMensesPeriod = () => {
    if (!selectedDate) return false;

    const dateStr = formatDate(selectedDate);
    return selectedDayEvents.some(e =>
      parseInt(e.typeId) === EVENT_TYPES.MENSES && !e.calculated
    );
  };

  return (
    <div className="menses-calendar">
      {/* Title Block (Legacy style) */}
      <div className="calendar-title-block">
        <h5>Calendario Mestruale</h5>
        <CalendarLegend inline />
      </div>

      <div className="calendar-container">
        <CalendarHeader
          currentMonth={currentMonth}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
        />

        {loading ? (
          <div className="calendar-loading">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Caricamento...</span>
            </div>
            <p>Caricamento calendario...</p>
          </div>
        ) : requiresProfileUpdate ? (
          <div className="calendar-prerequisite-message">
            <div className="prerequisite-content">
              <i className="fas fa-info-circle prerequisite-icon"></i>
              <h5>Completa il tuo profilo</h5>
              <p>
                Per utilizzare il calendario mestruale è necessario compilare
                prima alcune informazioni nel tuo profilo:
              </p>
              <ul>
                <li><strong>Durata del ciclo</strong> (in giorni)</li>
                <li><strong>Durata della mestruazione</strong> (in giorni)</li>
              </ul>
              <p className="prerequisite-info">
                Queste informazioni ci permettono di calcolare automaticamente
                l'ovulazione, il periodo fertile e le previsioni dei prossimi cicli.
              </p>
              <button
                className="btn btn-primary btn-go-profile"
                onClick={() => navigate('/consumer?tab=0')}
              >
                <i className="fas fa-user-edit me-2"></i>
                Vai alla Storia Clinica
              </button>
            </div>
          </div>
        ) : (
          <>
            <MonthView
              currentMonth={currentMonth}
              events={events}
              onRefresh={loadEvents}
              onDayClick={handleDayClick}
            />

            <CalendarLegend />
          </>
        )}
      </div>

      {/* Event Dialog */}
      {showEventDialog && selectedDate && (
        <EventDialog
          isOpen={showEventDialog}
          onClose={handleCloseEventDialog}
          selectedDate={selectedDate}
          events={selectedDayEvents}
          hasOpenPeriod={hasOpenPeriod}
          isInMensesPeriod={isDateInMensesPeriod()}
          onRefresh={handleRefreshAndReopen}
          onOpenDetails={handleOpenDetails}
        />
      )}

      {/* Details Dialog (Symptoms, Drugs, Moods) */}
      {showDetailsDialog && (
        <DetailsDialog
          isOpen={showDetailsDialog}
          onClose={handleCloseDetailsDialog}
          eventType={detailsEventType}
          selectedDate={selectedDate}
          existingEvent={existingDetailsEvent}
          onRefresh={handleRefreshAndReopen}
        />
      )}
    </div>
  );
};

export default MensesCalendar;
