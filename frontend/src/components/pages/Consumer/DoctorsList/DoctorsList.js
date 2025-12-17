import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DoctorsFilters from './DoctorsFilters';
import DoctorCard from './DoctorCard';
import DoctorDetail from './DoctorDetail';
import DoctorsApi from '../../../../services/doctorsApi';
import './doctorsList.css';

/**
 * DoctorsList - REPLICA ESATTA del layout business_list.xhtml
 * Componente principale per la lista medici/cliniche
 *
 * Features:
 * - Filtri (esame, patologia, città)
 * - Lista paginata di medici/cliniche
 * - Vista dettaglio singolo medico
 * - Dialog autorizzazione (per consumer)
 */
const DoctorsList = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Inizializza type e examination direttamente dal URL per evitare doppio fetch
  const getInitialType = () => {
    const typeParam = searchParams.get('type');
    return typeParam ? parseInt(typeParam, 10) : null;
  };

  const getInitialExamination = () => {
    const examParam = searchParams.get('exam_id');
    return examParam ? parseInt(examParam, 10) : null;
  };

  // State
  const [filters, setFilters] = useState(() => ({
    type: getInitialType(), // 3=DOCTOR, 4=CLINIC, null=both
    examination: getInitialExamination(),
    pathology: null,
    municipalityId: null,
    municipalityName: null,
    lat: null,
    lon: null,
    radius: null,
    query: null
  }));

  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 15,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vista dettaglio - inizializza da URL
  const [selectedDoctorId, setSelectedDoctorId] = useState(() => {
    const doctorIdParam = searchParams.get('doctorId');
    return doctorIdParam ? parseInt(doctorIdParam, 10) : null;
  });

  // Dialog autorizzazione
  const [authorizationDialog, setAuthorizationDialog] = useState({
    visible: false,
    doctor: null,
    codFisc: '',
    codice: ''
  });

  // Aggiorna stato quando cambiano i searchParams (navigazione)
  useEffect(() => {
    const typeParam = searchParams.get('type');
    const examParam = searchParams.get('exam_id');
    const doctorIdParam = searchParams.get('doctorId');

    setSelectedDoctorId(doctorIdParam ? parseInt(doctorIdParam, 10) : null);

    // Aggiorna type e examination in base all'URL
    setFilters(prev => ({
      ...prev,
      type: typeParam ? parseInt(typeParam, 10) : null,
      examination: examParam ? parseInt(examParam, 10) : prev.examination
    }));
  }, [searchParams]);

  // Fetch doctors
  const fetchDoctors = useCallback(async (currentFilters, page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const result = await DoctorsApi.search(currentFilters, page, pagination.size);

      setDoctors(result.doctors || []);
      setPagination(result.pagination || {
        page: 1,
        size: 15,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      });
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError(err.message || 'Errore nel caricamento dei medici');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.size]);

  // Fetch on filter change
  useEffect(() => {
    if (!selectedDoctorId) {
      fetchDoctors(filters, 1);
    }
  }, [filters, fetchDoctors, selectedDoctorId]);

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePreviousPage = () => {
    if (pagination.hasPrevious) {
      const newPage = pagination.page - 1;
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchDoctors(filters, newPage);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNext) {
      const newPage = pagination.page + 1;
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchDoctors(filters, newPage);
    }
  };

  // Handle view details
  const handleViewDetails = (doctorId) => {
    setSelectedDoctorId(doctorId);
    setSearchParams(prev => {
      prev.set('doctorId', doctorId);
      return prev;
    });
  };

  // Handle back from detail
  const handleBackFromDetail = () => {
    setSelectedDoctorId(null);
    setSearchParams(prev => {
      prev.delete('doctorId');
      return prev;
    });
  };

  // Handle authorize
  const handleAuthorize = (doctor) => {
    setAuthorizationDialog({
      visible: true,
      doctor,
      codFisc: '',
      codice: ''
    });
  };

  // Close authorization dialog
  const closeAuthorizationDialog = () => {
    setAuthorizationDialog({
      visible: false,
      doctor: null,
      codFisc: '',
      codice: ''
    });
  };

  // Submit authorization
  const handleSubmitAuthorization = async () => {
    // TODO: Implementare chiamata API per autorizzazione
    console.log('Authorization submitted:', {
      doctorId: authorizationDialog.doctor?.id,
      codFisc: authorizationDialog.codFisc,
      codice: authorizationDialog.codice
    });
    closeAuthorizationDialog();
  };

  // Se è selezionato un medico, mostra il dettaglio
  if (selectedDoctorId) {
    return (
      <DoctorDetail
        doctorId={selectedDoctorId}
        onBack={handleBackFromDetail}
      />
    );
  }

  return (
    <div className="doctors-list-container">
      {/* Filtri */}
      <DoctorsFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        searchType={filters.type}
      />

      {/* Lista medici */}
      {loading ? (
        <div className="ui-block loading-block">
          <div className="loading-container">
            <i className="fas fa-spinner fa-spin"></i>
            <span>{t('resourceBundle.Loading', 'Caricamento...')}</span>
          </div>
        </div>
      ) : error ? (
        <div className="ui-block error-block">
          <div className="error-container">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{error}</span>
          </div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="ui-block empty-block">
          <div className="empty-container">
            <i className="fas fa-search"></i>
            <span>{t('resourceBundle.No_results', 'Nessun risultato trovato')}</span>
          </div>
        </div>
      ) : (
        <>
          {/* Lista */}
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              cityName={filters.municipalityName}
              onViewDetails={handleViewDetails}
              onAuthorize={handleAuthorize}
            />
          ))}

          {/* Paginazione - REPLICA ESATTA del legacy */}
          {pagination.totalPages > 0 && (
            <div className="pagination-container">
              <div className="ui-block pagination-block">
                <table align="center" id="pagination">
                  <tbody>
                    <tr>
                      <td align="center" style={{ width: '20%' }}>
                        {pagination.hasPrevious && (
                          <button
                            className="btn btn-pagination"
                            onClick={handlePreviousPage}
                          >
                            &lt;
                          </button>
                        )}
                      </td>
                      <td align="center" colSpan="3">
                        <span>
                          {t('resourceBundle.Page', 'Pagina')} {pagination.page} {t('resourceBundle.Of', 'di')} {pagination.totalPages}
                        </span>
                      </td>
                      <td align="center" style={{ width: '20%' }}>
                        {pagination.hasNext && (
                          <button
                            className="btn btn-pagination"
                            onClick={handleNextPage}
                          >
                            &gt;
                          </button>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialog Autorizzazione - REPLICA ESATTA del legacy pnl_dlg_send_code */}
      {authorizationDialog.visible && (
        <div className="dialog-overlay" onClick={closeAuthorizationDialog}>
          <div className="dialog pnl_dlg" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <span>{t('resourceBundle.Code_identification', 'Identificazione codice')}</span>
            </div>
            <div className="dialog-content">
              {authorizationDialog.doctor?.typeId === 3 ? (
                <>
                  <p style={{ fontWeight: 400 }}>
                    Per consentire al medico {authorizationDialog.doctor?.name} di caricare documenti, il sistema deve identificare il paziente.
                  </p>
                  <p style={{ fontWeight: 400 }}>
                    Inserisci il codice consegnato dal medico insieme al codice fiscale che hai fornito per la generazione del codice
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontWeight: 400 }}>
                    Per consentire alla clinica {authorizationDialog.doctor?.name} di caricare documenti, il sistema deve identificare il paziente.
                  </p>
                  <p style={{ fontWeight: 400 }}>
                    Inserisci il codice consegnato dalla clinica insieme al codice fiscale che hai fornito per la generazione del codice
                  </p>
                </>
              )}

              <div className="row">
                <div className="col col-12 col-sm-12">
                  <label>{t('resourceBundle.Tax_code', 'Codice Fiscale')}</label>
                  <input
                    type="text"
                    value={authorizationDialog.codFisc}
                    onChange={(e) => setAuthorizationDialog(prev => ({
                      ...prev,
                      codFisc: e.target.value.toUpperCase()
                    }))}
                    style={{ textTransform: 'uppercase' }}
                    className="form-control"
                  />
                </div>
                <div className="col col-12 col-sm-12">
                  <label>{t('resourceBundle.Code', 'Codice')}</label>
                  <input
                    type="text"
                    value={authorizationDialog.codice}
                    onChange={(e) => setAuthorizationDialog(prev => ({
                      ...prev,
                      codice: e.target.value
                    }))}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
            <div className="dialog-footer">
              <div className="row">
                <div className="col col-12 col-sm-12 col-md-6">
                  <button
                    className="btn btn-secondary"
                    onClick={closeAuthorizationDialog}
                  >
                    {t('resourceBundle.CLOSE', 'Chiudi')}
                  </button>
                </div>
                <div className="col col-12 col-sm-12 col-md-6">
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmitAuthorization}
                  >
                    {t('resourceBundle.checkCode', 'Verifica codice')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
