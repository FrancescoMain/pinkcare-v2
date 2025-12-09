import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * PrerequisiteDialog - Modal shown when user hasn't filled profile data
 * Prompts user to fill in duration_period and duration_menstruation
 */
const PrerequisiteDialog = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const goToProfile = () => {
    onClose();
    navigate('/consumer?tab=0'); // Go to Storia Clinica tab
  };

  return (
    <div className="modal-backdrop show">
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Completa il profilo</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <p>
                Per utilizzare il calendario mestruale è necessario compilare
                prima alcune informazioni nel tuo profilo:
              </p>
              <ul>
                <li>Durata del ciclo (in giorni)</li>
                <li>Durata della mestruazione (in giorni)</li>
              </ul>
              <p>
                Queste informazioni ci permettono di calcolare automaticamente
                l'ovulazione, il periodo fertile e le previsioni dei prossimi cicli.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Chiudi
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={goToProfile}
              >
                Vai al profilo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrerequisiteDialog;
