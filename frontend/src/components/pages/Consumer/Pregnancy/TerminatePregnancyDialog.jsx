import React, { useState } from 'react';
import PregnancyApi from '../../../../services/pregnancyApi';
import { toast } from 'react-toastify';
import './Pregnancy.css';

/**
 * TerminatePregnancyDialog - Replica esatta del terminatePregnancyPnl del legacy
 * Date picker per selezionare quando è terminata la gravidanza + Salva/Chiudi
 */
const TerminatePregnancyDialog = ({ isOpen, onClose, onTerminated, ovulationDate }) => {
  const [pregnancyEndedDate, setPregnancyEndedDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setPregnancyEndedDate('');
    setSaving(false);
    onClose();
  };

  const handleSave = async () => {
    if (!pregnancyEndedDate) {
      toast.error('Seleziona la data di termine della gravidanza');
      return;
    }

    try {
      setSaving(true);
      await PregnancyApi.terminate(pregnancyEndedDate);
      toast.success('Gravidanza terminata');
      setPregnancyEndedDate('');
      onTerminated();
    } catch (error) {
      toast.error(error.message || 'Errore nella terminazione');
    } finally {
      setSaving(false);
    }
  };

  // Min date: ovulation date; Max date: today
  const today = new Date().toISOString().split('T')[0];
  const minDate = ovulationDate
    ? new Date(ovulationDate).toISOString().split('T')[0]
    : undefined;

  if (!isOpen) return null;

  return (
    <div className="pregnancy-dialog-overlay" onClick={handleClose}>
      <div className="pregnancy-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="pregnancy-dialog-header">
          <h3>Termine gravidanza</h3>
          <button className="pregnancy-dialog-close" onClick={handleClose}>&times;</button>
        </div>

        <div className="pregnancy-dialog-body">
          <div className="pregnancy-form-group">
            <label>Quando è terminata la tua gravidanza?</label>
            <input
              type="date"
              value={pregnancyEndedDate}
              onChange={(e) => setPregnancyEndedDate(e.target.value)}
              min={minDate}
              max={today}
              className="pregnancy-input"
            />
          </div>
        </div>

        <div className="pregnancy-dialog-footer">
          <button
            className="btn-pregnancy-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
          <button className="btn-pregnancy-secondary" onClick={handleClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default TerminatePregnancyDialog;
