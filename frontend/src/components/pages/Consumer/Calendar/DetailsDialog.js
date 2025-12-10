import React, { useState, useEffect, useCallback } from 'react';
import CalendarApi from '../../../../services/calendarApi';
import { toast } from 'react-toastify';

/**
 * DetailsDialog - Dialog for selecting symptoms, drugs, or moods
 * Replicates legacy PrimeFaces details dialog functionality
 */

// Event type constants
const EVENT_TYPES = {
  SYMPTOMS: 23,
  DRUGS: 24,
  MOODS: 25
};

// Type labels for display
const TYPE_LABELS = {
  [EVENT_TYPES.SYMPTOMS]: 'Sintomi',
  [EVENT_TYPES.DRUGS]: 'Farmaci',
  [EVENT_TYPES.MOODS]: 'Stati d\'animo'
};

const DetailsDialog = ({
  isOpen,
  onClose,
  eventType,
  selectedDate,
  existingEvent,
  onRefresh
}) => {
  const [detailTypes, setDetailTypes] = useState([]);
  const [selectedDetails, setSelectedDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load detail types when dialog opens
  const loadDetailTypes = useCallback(async () => {
    if (!isOpen || !eventType) return;

    try {
      setLoading(true);
      const response = await CalendarApi.getEventDetailTypes(eventType);
      setDetailTypes(response.detailTypes || []);

      // Initialize selected details from existing event
      if (existingEvent?.details && existingEvent.details.length > 0) {
        const initialDetails = {};
        existingEvent.details.forEach(d => {
          // Backend returns detailType.id, not detailTypeId
          const typeId = d.detailType?.id || d.detailTypeId;
          if (typeId) {
            initialDetails[typeId] = d.value || 1;
          }
        });
        setSelectedDetails(initialDetails);
      } else {
        setSelectedDetails({});
      }
    } catch (error) {
      console.error('Error loading detail types:', error);
      toast.error('Errore nel caricamento dei tipi di dettaglio');
    } finally {
      setLoading(false);
    }
  }, [isOpen, eventType, existingEvent]);

  useEffect(() => {
    loadDetailTypes();
  }, [loadDetailTypes]);

  if (!isOpen) return null;

  // Format date for API
  const formatApiDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Toggle detail selection for drugs (star-based)
  const toggleDetail = (detailTypeId) => {
    setSelectedDetails(prev => {
      const newDetails = { ...prev };
      if (newDetails[detailTypeId]) {
        delete newDetails[detailTypeId];
      } else {
        newDetails[detailTypeId] = 1;
      }
      return newDetails;
    });
  };

  // Set intensity for symptoms/moods (1-3)
  const setIntensity = (detailTypeId, intensity) => {
    setSelectedDetails(prev => {
      const newDetails = { ...prev };
      const currentIntensity = prev[detailTypeId] || 0;

      // If clicking the same intensity, toggle off
      if (currentIntensity === intensity) {
        delete newDetails[detailTypeId];
      } else {
        newDetails[detailTypeId] = intensity;
      }

      return newDetails;
    });
  };

  // Save details
  const handleSave = async () => {
    const detailsArray = Object.entries(selectedDetails).map(([detailTypeId, value]) => ({
      detailTypeId: parseInt(detailTypeId),
      value: value,
      selected: true
    }));

    try {
      setSaving(true);

      if (existingEvent) {
        // Update existing event
        await CalendarApi.updateEvent(existingEvent.id, {
          details: detailsArray
        });
      } else {
        // Create new event
        await CalendarApi.createEvent({
          typeId: eventType,
          beginning: formatApiDate(selectedDate),
          details: detailsArray
        });
      }

      toast.success('Salvato con successo');
      await onRefresh();
      onClose();
    } catch (error) {
      console.error('Error saving details:', error);
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  // Delete event
  const handleDelete = async () => {
    if (!existingEvent) return;
    if (!window.confirm('Rimuovere?')) return;

    try {
      setSaving(true);
      await CalendarApi.deleteEvent(existingEvent.id);
      toast.success('Rimosso con successo');
      await onRefresh();
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Errore nella rimozione');
    } finally {
      setSaving(false);
    }
  };

  // Check if we use intensity (symptoms, moods) or star (drugs)
  const useIntensity = eventType === EVENT_TYPES.SYMPTOMS || eventType === EVENT_TYPES.MOODS;

  return (
    <div className="modal-backdrop show" onClick={onClose}>
      <div className="modal show d-block event-dialog details-dialog" tabIndex="-1" onClick={e => e.stopPropagation()}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {eventType === EVENT_TYPES.SYMPTOMS && <i className="fas fa-bolt me-2"></i>}
                {eventType === EVENT_TYPES.DRUGS && <i className="fas fa-pills me-2"></i>}
                {eventType === EVENT_TYPES.MOODS && <i className="far fa-smile me-2"></i>}
                {TYPE_LABELS[eventType]}
              </h5>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Close"
                disabled={saving}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Caricamento...</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Action Buttons */}
                  <div className="d-flex gap-2 mb-3">
                    <button
                      className="btn btn-primary"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      <i className="fas fa-save me-2"></i>
                      Salva
                    </button>
                    {existingEvent && (
                      <button
                        className="btn btn-outline-danger"
                        onClick={handleDelete}
                        disabled={saving}
                      >
                        <i className="fas fa-trash me-2"></i>
                        Elimina
                      </button>
                    )}
                  </div>

                  {/* Details List */}
                  <ul className="details-list">
                    {detailTypes.map((detail) => (
                      <li key={detail.id} className="detail-item">
                        <span className="detail-label">{detail.label}</span>

                        {useIntensity ? (
                          // Intensity selector (1-3 circles) for symptoms and moods
                          <div className="intensity-selector">
                            {[1, 2, 3].map((intensity) => (
                              <button
                                key={intensity}
                                type="button"
                                className={`intensity-btn ${(selectedDetails[detail.id] || 0) >= intensity ? 'active' : ''}`}
                                onClick={() => setIntensity(detail.id, intensity)}
                                disabled={saving}
                                title={`Intensità ${intensity}`}
                              >
                                <i className={`fa${(selectedDetails[detail.id] || 0) >= intensity ? 's' : 'r'} fa-circle`}></i>
                              </button>
                            ))}
                          </div>
                        ) : (
                          // Star selector for drugs
                          <div className="star-selector">
                            <button
                              type="button"
                              className={`star-btn ${selectedDetails[detail.id] ? 'active' : ''}`}
                              onClick={() => toggleDetail(detail.id)}
                              disabled={saving}
                            >
                              <i className={`fa${selectedDetails[detail.id] ? 's' : 'r'} fa-star`}></i>
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>

                  {detailTypes.length === 0 && (
                    <div className="text-center text-muted py-4">
                      <p>Nessun tipo di dettaglio disponibile</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsDialog;
