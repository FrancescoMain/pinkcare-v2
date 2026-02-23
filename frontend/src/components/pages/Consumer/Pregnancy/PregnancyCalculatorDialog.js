import React, { useState } from 'react';
import PregnancyApi from '../../../../services/pregnancyApi';
import { toast } from 'react-toastify';
import './Pregnancy.css';

/**
 * PregnancyCalculatorDialog - Replica esatta del childbirthDatePnl del legacy
 * Step 1: Input data ultima mestruazione + durata ciclo → Calcola
 * Step 2: Mostra risultato → Salva o Chiudi
 */
const PregnancyCalculatorDialog = ({ isOpen, onClose, onSaved, knownLastMensesDate, knownDurationPeriod }) => {
  const [lastMensesDate, setLastMensesDate] = useState('');
  const [durationPeriod, setDurationPeriod] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Step 2 state (after calculation)
  const [calculated, setCalculated] = useState(false);
  const [result, setResult] = useState(null);

  const resetForm = () => {
    setLastMensesDate('');
    setDurationPeriod('');
    setCalculated(false);
    setResult(null);
    setCalculating(false);
    setSaving(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCalculate = async () => {
    if (!lastMensesDate) {
      toast.error('Inserisci la data dell\'ultima mestruazione');
      return;
    }

    const duration = parseInt(durationPeriod);
    if (!duration || duration < 22 || duration > 45) {
      toast.error('La durata del ciclo deve essere tra 22 e 45 giorni');
      return;
    }

    // Validate date is not in the future
    if (new Date(lastMensesDate) > new Date()) {
      toast.error('La data non può essere nel futuro');
      return;
    }

    try {
      setCalculating(true);
      const res = await PregnancyApi.calculate(lastMensesDate, duration);
      setResult(res);
      setCalculated(true);
    } catch (error) {
      toast.error(error.message || 'Errore nel calcolo');
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    try {
      setSaving(true);
      await PregnancyApi.save(result.childbirthdate, result.ovulationDate);
      toast.success('Gravidanza salvata con successo');
      resetForm();
      onSaved();
    } catch (error) {
      toast.error(error.message || 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Max date for date picker: today
  const today = new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

  return (
    <div className="pregnancy-dialog-overlay" onClick={handleClose}>
      <div className="pregnancy-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="pregnancy-dialog-header">
          <h3>Calcola la data parto e la settimana di gravidanza</h3>
          <button className="pregnancy-dialog-close" onClick={handleClose}>&times;</button>
        </div>

        <div className="pregnancy-dialog-body">
          {!calculated ? (
            /* Step 1: Input form */
            <div className="pregnancy-calc-form">
              <div className="pregnancy-form-group">
                <label>Data dell'ultima mestruazione</label>
                <input
                  type="date"
                  value={lastMensesDate}
                  onChange={(e) => setLastMensesDate(e.target.value)}
                  max={today}
                  className="pregnancy-input"
                />
              </div>

              <div className="pregnancy-form-group">
                <label>
                  Lunghezza media del ciclo
                  <span className="pregnancy-tooltip-container">
                    <i className="fas fa-info-circle pregnancy-info-icon"></i>
                    <span className="pregnancy-tooltip-text">
                      Si intende la durata in giorni tra l'inizio di un periodo mestruale e il successivo
                    </span>
                  </span>
                </label>
                <input
                  type="number"
                  value={durationPeriod}
                  onChange={(e) => setDurationPeriod(e.target.value)}
                  min="22"
                  max="45"
                  placeholder="Da 22 a 45 (in genere 28)"
                  className="pregnancy-input"
                />
              </div>

              {/* Sezione "Il sistema ha calcolato i seguenti dati" - REPLICA ESATTA del legacy */}
              {(knownLastMensesDate || knownDurationPeriod) && (
                <div className="pregnancy-system-data">
                  <p className="pregnancy-system-data-title">
                    <strong>Il sistema ha calcolato i seguenti dati</strong>
                  </p>
                  <div className="pregnancy-system-data-row">
                    {knownLastMensesDate && (
                      <span className="pregnancy-system-data-item">
                        <em>Data dell'ultima mestruazione:</em>{' '}
                        {formatDate(knownLastMensesDate)}
                      </span>
                    )}
                    {knownDurationPeriod && (
                      <span className="pregnancy-system-data-item">
                        <em>Lunghezza media del ciclo:</em>{' '}
                        {knownDurationPeriod}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Results */
            <div className="pregnancy-calc-result">
              <p className="pregnancy-result-line">
                <strong>Data orientativa del parto: {formatDate(result.childbirthdate)}</strong>
              </p>
              <p className="pregnancy-result-line">
                Ti trovi nella settimana gestazionale numero <strong>{result.weekNumber}</strong>
              </p>

              {result.hasOverlap && (
                <p className="pregnancy-overlap-warning">
                  Attenzione: è stata trovata una gravidanza sovrapposta nel periodo calcolato.
                </p>
              )}

              {!result.hasOverlap && (
                <p className="pregnancy-result-info">
                  Se desideri ricevere le nostre indicazioni settimana per settimana fino alla data
                  prevista del parto, clicca su Salva
                </p>
              )}
            </div>
          )}
        </div>

        <div className="pregnancy-dialog-footer">
          {!calculated ? (
            <button
              className="btn-pregnancy-primary"
              onClick={handleCalculate}
              disabled={calculating}
            >
              {calculating ? 'Calcolo...' : 'Calcola'}
            </button>
          ) : (
            <>
              {!result.hasOverlap && (
                <button
                  className="btn-pregnancy-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Salvataggio...' : 'Salva'}
                </button>
              )}
              <button className="btn-pregnancy-secondary" onClick={handleClose}>
                Chiudi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PregnancyCalculatorDialog;
