import React, { useState, useEffect } from 'react';
import ScheduleApi from '../../../../services/scheduleApi';
import { toast } from 'react-toastify';

/**
 * ScheduleEventDialog - Modal for creating/editing schedule events
 */
const ScheduleEventDialog = ({
  isOpen,
  onClose,
  selectedDate,
  event,
  colors,
  onSaved,
  onDeleted
}) => {
  const [formData, setFormData] = useState({
    heading: '',
    message: '',
    eventBeginning: '',
    eventEnding: '',
    reminder: '',
    color: ''
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = !!event;

  // Format date for datetime-local input
  const formatDateTimeLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Editing existing event
        setFormData({
          heading: event.title || '',
          message: event.description || '',
          eventBeginning: formatDateTimeLocal(event.start),
          eventEnding: formatDateTimeLocal(event.end),
          reminder: event.reminder ? formatDateTimeLocal(event.reminder) : '',
          color: event.color || ''
        });
      } else if (selectedDate) {
        // Creating new event - default to 9:00 AM on selected date
        const defaultStart = new Date(selectedDate);
        defaultStart.setHours(9, 0, 0, 0);
        const defaultEnd = new Date(selectedDate);
        defaultEnd.setHours(10, 0, 0, 0);

        setFormData({
          heading: '',
          message: '',
          eventBeginning: formatDateTimeLocal(defaultStart),
          eventEnding: formatDateTimeLocal(defaultEnd),
          reminder: '',
          color: colors.length > 0 ? colors[0].id : ''
        });
      }
    }
  }, [isOpen, event, selectedDate, colors]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle color selection
  const handleColorSelect = (colorClass) => {
    setFormData(prev => ({
      ...prev,
      color: colorClass
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.heading.trim()) {
      toast.error('Il titolo è obbligatorio');
      return;
    }

    if (!formData.eventBeginning) {
      toast.error('La data di inizio è obbligatoria');
      return;
    }

    try {
      setSaving(true);

      const eventData = {
        heading: formData.heading.trim(),
        message: formData.message.trim() || null,
        eventBeginning: new Date(formData.eventBeginning).toISOString(),
        eventEnding: formData.eventEnding ? new Date(formData.eventEnding).toISOString() : null,
        reminder: formData.reminder ? new Date(formData.reminder).toISOString() : null,
        color: formData.color || null
      };

      if (isEditing) {
        await ScheduleApi.updateEvent(event.id, eventData);
      } else {
        await ScheduleApi.createEvent(eventData);
      }

      onSaved();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(error.message || 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!event || !window.confirm('Sei sicuro di voler eliminare questo evento?')) {
      return;
    }

    try {
      setDeleting(true);
      await ScheduleApi.deleteEvent(event.id);
      onDeleted();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(error.message || 'Errore nell\'eliminazione');
    } finally {
      setDeleting(false);
    }
  };

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop show" onClick={handleOverlayClick}>
      <div className="modal schedule-event-dialog show" style={{ display: 'block' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header">
              <h5 className="modal-title">
                <i className={`fas ${isEditing ? 'fa-edit' : 'fa-calendar-plus'} me-2`}></i>
                {isEditing ? 'Modifica Evento' : 'Nuovo Evento'}
              </h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                disabled={saving || deleting}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Body */}
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                {/* Title */}
                <div className="mb-3">
                  <label htmlFor="heading" className="form-label">
                    Titolo <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="heading"
                    name="heading"
                    value={formData.heading}
                    onChange={handleChange}
                    placeholder="Inserisci il titolo dell'evento"
                    maxLength={255}
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label htmlFor="message" className="form-label">
                    Descrizione
                  </label>
                  <textarea
                    className="form-control"
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Descrizione opzionale"
                    rows={3}
                    maxLength={5000}
                  />
                </div>

                {/* Start Date/Time */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="eventBeginning" className="form-label">
                      Data/Ora Inizio <span className="text-danger">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      id="eventBeginning"
                      name="eventBeginning"
                      value={formData.eventBeginning}
                      onChange={handleChange}
                    />
                  </div>

                  {/* End Date/Time */}
                  <div className="col-md-6">
                    <label htmlFor="eventEnding" className="form-label">
                      Data/Ora Fine
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      id="eventEnding"
                      name="eventEnding"
                      value={formData.eventEnding}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Reminder */}
                <div className="mb-3">
                  <label htmlFor="reminder" className="form-label">
                    Promemoria
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    id="reminder"
                    name="reminder"
                    value={formData.reminder}
                    onChange={handleChange}
                  />
                  <small className="text-muted">
                    Imposta un promemoria per questo evento
                  </small>
                </div>

                {/* Color Selection */}
                <div className="mb-3">
                  <label className="form-label">Colore</label>
                  <div className="color-picker">
                    {colors.map((color, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`color-option ${formData.color === color.id ? 'selected' : ''}`}
                        style={{ backgroundColor: color.hex }}
                        onClick={() => handleColorSelect(color.id)}
                        title={color.label}
                      >
                        {formData.color === color.id && (
                          <i className="fas fa-check"></i>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="event-actions" style={{ display: 'flex', flexDirection: 'row', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
                  {isEditing && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleDelete}
                      disabled={saving || deleting}
                      style={{ flex: 'none' }}
                    >
                      {deleting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Eliminazione...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-trash me-2"></i>
                          Elimina
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={onClose}
                    disabled={saving || deleting}
                    style={{ flex: 1 }}
                  >
                    ANNULLA
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving || deleting}
                    style={{ flex: 1 }}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        {isEditing ? 'Aggiorna' : 'Crea'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleEventDialog;
