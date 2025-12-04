import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getThematicAreas } from '../../../services/questionnaireService';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { useAuth } from '../../../context/AuthContext';
import './Questionnaire.css';

/**
 * QuestionnaireChoice - REPLICA ESATTA della scelta iniziale in advanced_screening.xhtml
 * L'utente può scegliere:
 * 1. Screening basato sull'età
 * 2. Screening basato su un'area tematica specifica
 */
const QuestionnaireChoice = () => {
  const navigate = useNavigate();
  const { showErrorMessage } = useErrorHandler();
  const { user } = useAuth();
  const [thematicAreas, setThematicAreas] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleAgeBasedScreening = () => {
    // screeningType = -1 per screening basato sull'età
    navigate('/consumer?tab=3&type=-1');
  };

  const handleThematicAreaScreening = (thematicAreaId) => {
    // screeningType = id dell'area tematica
    navigate(`/consumer?tab=3&type=${thematicAreaId}`);
  };

  if (loading) {
    return (
      <div className="questionnaire-choice">
        <div className="loading">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="questionnaire-choice">
      {/* Accordion per ogni area tematica - stile legacy */}
      <div className="thematic-areas-accordion">
        {/* Screening basato sull'età come prima sezione */}
        <div className="accordion-section">
          <div
            className="accordion-header"
            onClick={handleAgeBasedScreening}
            style={{ cursor: 'pointer' }}
          >
            <span>Screening su <strong>{user?.age || 'la tua'}</strong> età</span>
            <i className="fas fa-chevron-right"></i>
          </div>
        </div>

        {/* Altre aree tematiche */}
        {thematicAreas.map((ta) => (
          <div key={ta.id} className="accordion-section">
            <div
              className="accordion-header"
              onClick={() => handleThematicAreaScreening(ta.id)}
              style={{ cursor: 'pointer' }}
            >
              <span>{ta.label}</span>
              <i className="fas fa-chevron-right"></i>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionnaireChoice;
