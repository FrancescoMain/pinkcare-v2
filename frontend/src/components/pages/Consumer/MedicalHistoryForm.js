import React, { useState, useEffect, useCallback } from 'react';
import { getThematicAreas } from '../../../services/questionnaireService';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import './MedicalHistoryForm.css';

/**
 * MedicalHistoryForm - REPLICA ESATTA dell'interfaccia storia clinica legacy
 * Mostra tutte le aree tematiche come accordion collassabile
 * Replica comportamento di consumer_form.xhtml del legacy
 */
const MedicalHistoryForm = () => {
  const { showErrorMessage } = useErrorHandler();
  const [thematicAreas, setThematicAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});

  const loadThematicAreas = useCallback(async () => {
    try {
      setLoading(true);
      const areas = await getThematicAreas();
      setThematicAreas(areas);
    } catch (error) {
      console.error('Error loading thematic areas:', error);
      showErrorMessage('Errore', 'Impossibile caricare le aree tematiche');
    } finally {
      setLoading(false);
    }
  }, [showErrorMessage]);

  useEffect(() => {
    loadThematicAreas();
  }, [loadThematicAreas]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleSaveAll = () => {
    // TODO: Implementare salvataggio completo
    console.log('Save all and show results');
  };

  if (loading) {
    return (
      <div className="medical-history-form">
        <div className="loading">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="medical-history-form">
      {/* Accordion sections per ogni area tematica */}
      <div className="thematic-areas-accordion">
        {thematicAreas.map((area) => (
          <div key={area.id} className="accordion-section">
            <div
              className={`accordion-header ${expandedSections[area.id] ? 'expanded' : ''}`}
              onClick={() => toggleSection(area.id)}
            >
              <span>{area.label}</span>
              <i className={`fas fa-chevron-${expandedSections[area.id] ? 'up' : 'down'}`}></i>
            </div>
            {expandedSections[area.id] && (
              <div className="accordion-content">
                <p className="placeholder-text">
                  Contenuto per {area.label} (da implementare)
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pulsante "Salva Tutto e Mostra risultati" */}
      <div className="form-actions">
        <button
          className="btn-save-all"
          onClick={handleSaveAll}
        >
          Salva Tutto e Mostra risultati
        </button>
      </div>
    </div>
  );
};

export default MedicalHistoryForm;
