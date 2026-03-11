import React, { useState, useEffect } from 'react';
import CalendarApi from '../../../../services/calendarApi';
import { toast } from 'react-toastify';

/**
 * EventDialog - Main dialog for adding/editing calendar events
 * Replicates legacy PrimeFaces event dialog functionality
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

const EventDialog = ({
  isOpen,
  onClose,
  selectedDate,
  events = [],
  hasOpenPeriod,
  isInMensesPeriod,
  onRefresh,
  onOpenDetails
}) => {
  const [activeInput, setActiveInput] = useState(null); // 'weight' or 'temperature'
  const [weightValue, setWeightValue] = useState('');
  const [temperatureValue, setTemperatureValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Get existing events for this day
  const existingEvents = {
    weight: events.find(e => parseInt(e.typeId) === EVENT_TYPES.WEIGHT),
    temperature: events.find(e => parseInt(e.typeId) === EVENT_TYPES.TEMPERATURE),
    symptoms: events.find(e => parseInt(e.typeId) === EVENT_TYPES.SYMPTOMS),
    drugs: events.find(e => parseInt(e.typeId) === EVENT_TYPES.DRUGS),
    moods: events.find(e => parseInt(e.typeId) === EVENT_TYPES.MOODS),
    pregnancy: events.find(e => parseInt(e.typeId) === EVENT_TYPES.PREGNANCY)
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setActiveInput(null);
      setWeightValue(existingEvents.weight?.value?.toString() || '');
      setTemperatureValue(existingEvents.temperature?.value?.toString() || '');
    }
  }, [isOpen, events]);

  if (!isOpen) return null;

  // Format date for display
  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Format date for API
  const formatApiDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle Start Period
  const handleStartPeriod = async () => {
    if (isInMensesPeriod) {
      toast.error('Non puoi aggiungere il periodo di inizio in un altro periodo mestruale');
      return;
    }

    try {
      setLoading(true);
      await CalendarApi.startPeriod(formatApiDate(selectedDate));
      toast.success('Ciclo iniziato con successo');
      await onRefresh();
      onClose();
    } catch (error) {
      console.error('Error starting period:', error);
      toast.error(error.response?.data?.error || 'Errore nell\'avvio del ciclo');
    } finally {
      setLoading(false);
    }
  };

  // Handle End Period
  const handleEndPeriod = async () => {
    try {
      setLoading(true);
      await CalendarApi.endPeriod(formatApiDate(selectedDate));
      toast.success('Ciclo terminato con successo');
      await onRefresh();
      onClose();
    } catch (error) {
      console.error('Error ending period:', error);
      toast.error(error.response?.data?.error || 'Errore nella chiusura del ciclo');
    } finally {
      setLoading(false);
    }
  };

  // Handle Weight Save
  const handleSaveWeight = async () => {
    if (!weightValue || isNaN(parseFloat(weightValue))) {
      toast.error('Inserisci un valore valido per il peso');
      return;
    }

    try {
      setLoading(true);
      if (existingEvents.weight) {
        await CalendarApi.updateEvent(existingEvents.weight.id, {
          value: parseFloat(weightValue)
        });
      } else {
        await CalendarApi.createEvent({
          typeId: EVENT_TYPES.WEIGHT,
          beginning: formatApiDate(selectedDate),
          value: parseFloat(weightValue)
        });
      }
      toast.success('Peso salvato con successo');
      setActiveInput(null);
      await onRefresh();
    } catch (error) {
      console.error('Error saving weight:', error);
      toast.error('Errore nel salvataggio del peso');
    } finally {
      setLoading(false);
    }
  };

  // Handle Weight Delete
  const handleDeleteWeight = async () => {
    if (!existingEvents.weight) return;

    if (!window.confirm('Rimuovere il peso?')) return;

    try {
      setLoading(true);
      await CalendarApi.deleteEvent(existingEvents.weight.id);
      toast.success('Peso rimosso');
      setActiveInput(null);
      setWeightValue('');
      await onRefresh();
    } catch (error) {
      console.error('Error deleting weight:', error);
      toast.error('Errore nella rimozione del peso');
    } finally {
      setLoading(false);
    }
  };

  // Handle Temperature Save
  const handleSaveTemperature = async () => {
    if (!temperatureValue || isNaN(parseFloat(temperatureValue))) {
      toast.error('Inserisci un valore valido per la temperatura');
      return;
    }

    try {
      setLoading(true);
      if (existingEvents.temperature) {
        await CalendarApi.updateEvent(existingEvents.temperature.id, {
          value: parseFloat(temperatureValue)
        });
      } else {
        await CalendarApi.createEvent({
          typeId: EVENT_TYPES.TEMPERATURE,
          beginning: formatApiDate(selectedDate),
          value: parseFloat(temperatureValue)
        });
      }
      toast.success('Temperatura salvata con successo');
      setActiveInput(null);
      await onRefresh();
    } catch (error) {
      console.error('Error saving temperature:', error);
      toast.error('Errore nel salvataggio della temperatura');
    } finally {
      setLoading(false);
    }
  };

  // Handle Temperature Delete
  const handleDeleteTemperature = async () => {
    if (!existingEvents.temperature) return;

    if (!window.confirm('Rimuovere la temperatura?')) return;

    try {
      setLoading(true);
      await CalendarApi.deleteEvent(existingEvents.temperature.id);
      toast.success('Temperatura rimossa');
      setActiveInput(null);
      setTemperatureValue('');
      await onRefresh();
    } catch (error) {
      console.error('Error deleting temperature:', error);
      toast.error('Errore nella rimozione della temperatura');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Menses
  const handleDeleteMenses = async () => {
    if (!window.confirm('Rimuovere le mestruazioni?')) return;

    const mensesEvent = events.find(e => parseInt(e.typeId) === EVENT_TYPES.MENSES);
    if (!mensesEvent) return;

    try {
      setLoading(true);
      await CalendarApi.deleteEvent(mensesEvent.id);
      toast.success('Mestruazioni rimosse');
      await onRefresh();
      onClose();
    } catch (error) {
      console.error('Error deleting menses:', error);
      toast.error('Errore nella rimozione delle mestruazioni');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Pregnancy Prediction
  const handleDeletePregnancy = async () => {
    if (!existingEvents.pregnancy) return;

    if (!window.confirm('Rimuovere la previsione di gravidanza?')) return;

    try {
      setLoading(true);
      await CalendarApi.deleteEvent(existingEvents.pregnancy.id);
      toast.success('Previsione di gravidanza rimossa');
      await onRefresh();
      onClose();
    } catch (error) {
      console.error('Error deleting pregnancy:', error);
      toast.error('Errore nella rimozione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop show" onClick={onClose}>
      <div className="modal show d-block event-dialog" tabIndex="-1" onClick={e => e.stopPropagation()}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="far fa-calendar-alt me-2"></i>
                {formatDisplayDate(selectedDate)}
              </h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Close"
                disabled={loading}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              {/* Period Start/End Row */}
              <div className="event-buttons mb-3">
                <button
                  className="event-btn period-btn"
                  onClick={handleStartPeriod}
                  disabled={loading || isInMensesPeriod}
                  title={isInMensesPeriod ? 'Già in un periodo mestruale' : 'Inizia il ciclo'}
                >
                  <i className="far fa-play-circle"></i>
                  <span>Inizio periodo</span>
                </button>

                <button
                  className="event-btn period-btn"
                  onClick={handleEndPeriod}
                  disabled={loading || !hasOpenPeriod}
                  title={!hasOpenPeriod ? 'Nessun periodo aperto' : 'Termina il ciclo'}
                >
                  <i className="far fa-stop-circle"></i>
                  <span>Fine periodo</span>
                </button>
              </div>

              {/* Event Type Buttons */}
              <div className="event-buttons">
                {/* Symptoms */}
                <button
                  className={`event-btn ${existingEvents.symptoms ? 'has-value' : ''}`}
                  onClick={() => onOpenDetails(EVENT_TYPES.SYMPTOMS, existingEvents.symptoms)}
                  disabled={loading}
                >
                  <i className="fas fa-bolt"></i>
                  <span>Sintomi</span>
                </button>

                {/* Weight */}
                <button
                  className={`event-btn ${existingEvents.weight ? 'has-value' : ''} ${activeInput === 'weight' ? 'active' : ''}`}
                  onClick={() => setActiveInput(activeInput === 'weight' ? null : 'weight')}
                  disabled={loading}
                >
                  <i className="fas fa-weight"></i>
                  <span>Peso</span>
                </button>

                {/* Drugs */}
                <button
                  className={`event-btn ${existingEvents.drugs ? 'has-value' : ''}`}
                  onClick={() => onOpenDetails(EVENT_TYPES.DRUGS, existingEvents.drugs)}
                  disabled={loading}
                >
                  <i className="fas fa-pills"></i>
                  <span>Farmaci</span>
                </button>

                {/* Moods */}
                <button
                  className={`event-btn ${existingEvents.moods ? 'has-value' : ''}`}
                  onClick={() => onOpenDetails(EVENT_TYPES.MOODS, existingEvents.moods)}
                  disabled={loading}
                >
                  <i className="far fa-smile"></i>
                  <span>Stati d'animo</span>
                </button>

                {/* Temperature */}
                <button
                  className={`event-btn ${existingEvents.temperature ? 'has-value' : ''} ${activeInput === 'temperature' ? 'active' : ''}`}
                  onClick={() => setActiveInput(activeInput === 'temperature' ? null : 'temperature')}
                  disabled={loading}
                >
                  <i className="fas fa-thermometer-half"></i>
                  <span>Temperatura basale</span>
                </button>
              </div>

              {/* Weight Input Section */}
              {activeInput === 'weight' && (
                <div className="value-input-section">
                  <label>Peso (kg)</label>
                  <div className="d-flex align-items-center gap-2">
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        value={weightValue}
                        onChange={(e) => setWeightValue(e.target.value)}
                        placeholder="Es. 65.5"
                        step="0.1"
                        min="20"
                        max="300"
                        disabled={loading}
                      />
                      <span className="input-group-text">kg</span>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveWeight}
                      disabled={loading || !weightValue}
                    >
                      <i className="fas fa-check"></i>
                    </button>
                    {existingEvents.weight && (
                      <button
                        className="btn btn-outline-danger"
                        onClick={handleDeleteWeight}
                        disabled={loading}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Temperature Input Section */}
              {activeInput === 'temperature' && (
                <div className="value-input-section">
                  <label>Temperatura basale (°C)</label>
                  <div className="d-flex align-items-center gap-2">
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        value={temperatureValue}
                        onChange={(e) => setTemperatureValue(e.target.value)}
                        placeholder="Es. 36.5"
                        step="0.1"
                        min="35"
                        max="42"
                        disabled={loading}
                      />
                      <span className="input-group-text">°C</span>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveTemperature}
                      disabled={loading || !temperatureValue}
                    >
                      <i className="fas fa-check"></i>
                    </button>
                    {existingEvents.temperature && (
                      <button
                        className="btn btn-outline-danger"
                        onClick={handleDeleteTemperature}
                        disabled={loading}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Delete Menses Button (shown if in menses period) */}
              {isInMensesPeriod && (
                <div className="event-actions">
                  <button
                    className="btn btn-danger"
                    onClick={handleDeleteMenses}
                    disabled={loading}
                  >
                    <i className="fas fa-trash me-2"></i>
                    Rimuovere Mestruazioni
                  </button>
                </div>
              )}

              {/* Delete Pregnancy Button (shown if pregnancy exists) */}
              {existingEvents.pregnancy && (
                <div className="event-actions">
                  <button
                    className="btn btn-danger"
                    onClick={handleDeletePregnancy}
                    disabled={loading}
                  >
                    <i className="fas fa-trash me-2"></i>
                    Rimuovere previsione di gravidanza
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDialog;
