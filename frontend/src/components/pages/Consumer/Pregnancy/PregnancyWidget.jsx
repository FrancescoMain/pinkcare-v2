import React, { useState, useEffect, useCallback } from 'react';
import PregnancyApi from '../../../../services/pregnancyApi';
import PregnancyCalculatorDialog from './PregnancyCalculatorDialog';
import TerminatePregnancyDialog from './TerminatePregnancyDialog';
import './Pregnancy.css';

/**
 * PregnancyWidget - Replica esatta del widget "Calcola data parto" nella sidebar legacy
 *
 * Stato "nessuna gravidanza": pulsante arancione "Calcola data parto"
 * Stato "gravidanza attiva": mostra data parto + settimana gestazionale + pulsanti Ricalcola/Termina
 */
const PregnancyWidget = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showTerminate, setShowTerminate] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await PregnancyApi.getStatus();
      setStatus(res);
    } catch (error) {
      console.error('Error fetching pregnancy status:', error);
      setStatus({ active: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSaved = () => {
    setShowCalculator(false);
    fetchStatus();
  };

  const handleTerminated = () => {
    setShowTerminate(false);
    fetchStatus();
  };

  const handleRecalculate = () => {
    setShowCalculator(true);
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

  if (loading) {
    return (
      <div className="widget w-build-fav btn-wid calcola-parto">
        <div className="ibm">
          <h4>Caricamento...</h4>
        </div>
      </div>
    );
  }

  // Active pregnancy state
  if (status?.active) {
    const week = status.weekNumber;
    const isOverdue = week > 40;

    return (
      <>
        <div className="widget w-build-fav calcola-parto-active">
          <div className="pregnancy-active-content">
            <h4 className="pregnancy-due-date">
              Data parto: {formatDate(status.childbirthdate)}
            </h4>
            {!isOverdue ? (
              <p className="pregnancy-week-info">
                Ti trovi nella <strong>{week}ª</strong> settimana gestazionale
              </p>
            ) : (
              <p className="pregnancy-week-info pregnancy-overdue">
                Hai superato di <strong>{week - 40}</strong> settimane la data presunto parto
              </p>
            )}
            <div className="pregnancy-actions">
              <button
                className="btn-pregnancy-widget btn-recalculate"
                onClick={handleRecalculate}
              >
                Ricalcola
              </button>
              <button
                className="btn-pregnancy-widget btn-terminate"
                onClick={() => setShowTerminate(true)}
              >
                Termina
              </button>
            </div>
          </div>
        </div>

        <PregnancyCalculatorDialog
          isOpen={showCalculator}
          onClose={() => setShowCalculator(false)}
          onSaved={handleSaved}
          knownLastMensesDate={status.lastMensesDate}
          knownDurationPeriod={status.durationPeriod}
        />

        <TerminatePregnancyDialog
          isOpen={showTerminate}
          onClose={() => setShowTerminate(false)}
          onTerminated={handleTerminated}
          ovulationDate={status.ovulationDate}
        />
      </>
    );
  }

  // No active pregnancy state
  return (
    <>
      <div
        className="widget w-build-fav btn-wid calcola-parto"
        onClick={() => setShowCalculator(true)}
      >
        <div className="ibm">
          <h4>Calcola data parto</h4>
        </div>
      </div>

      <PregnancyCalculatorDialog
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        onSaved={handleSaved}
        knownLastMensesDate={status?.lastMensesDate}
        knownDurationPeriod={status?.durationPeriod}
      />
    </>
  );
};

export default PregnancyWidget;
