import React, { useState, useEffect, useCallback } from 'react';
import CalendarApi from '../../../../services/calendarApi';
import CalendarHeader from './CalendarHeader';
import MonthView from './MonthView';
import CalendarLegend from './CalendarLegend';
import PrerequisiteDialog from './PrerequisiteDialog';
import { toast } from 'react-toastify';
import './calendar.css';

/**
 * MensesCalendar - Menstrual Calendar Component
 * Main component for tracking menstrual cycle, symptoms, weight, etc.
 */
const MensesCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPrerequisiteDialog, setShowPrerequisiteDialog] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);

      // Helper: Get first day of month
      const getMonthStart = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1);
      };

      // Helper: Get last day of month
      const getMonthEnd = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
      };

      // Helper: Format date as YYYY-MM-DD
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Calculate start and end dates for the month
      const startDate = getMonthStart(currentMonth);
      const endDate = getMonthEnd(currentMonth);

      const startStr = formatDate(startDate);
      const endStr = formatDate(endDate);

      const response = await CalendarApi.getEvents(startStr, endStr);

      setEvents(response.events || []);
      // userProfile will be used in future for displaying cycle info
      // setUserProfile(response.userProfile || null);

    } catch (error) {
      // Check if it's a prerequisite error
      if (error.response?.data?.requiresProfileUpdate) {
        setShowPrerequisiteDialog(true);
        toast.error(error.response.data.error || 'Compila prima il tuo profilo');
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

  return (
    <div className="menses-calendar">
      <div className="calendar-container">
        <CalendarHeader
          currentMonth={currentMonth}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
        />

        {loading ? (
          <div className="calendar-loading">
            <p>Caricamento calendario...</p>
          </div>
        ) : (
          <>
            <MonthView
              currentMonth={currentMonth}
              events={events}
              onRefresh={loadEvents}
            />

            <CalendarLegend />
          </>
        )}
      </div>

      {showPrerequisiteDialog && (
        <PrerequisiteDialog
          isOpen={showPrerequisiteDialog}
          onClose={() => setShowPrerequisiteDialog(false)}
        />
      )}
    </div>
  );
};

export default MensesCalendar;
