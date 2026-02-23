import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import DocumentApi from '../../../../services/documentApi';
import './myDocuments.css';

const PAGE_SIZE = 15;

const MyDocuments = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // recomm parameter: when set, user came from "Carica referto" in exams
  const recommExamId = searchParams.get('recomm');

  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);

  // Filters
  const [typology, setTypology] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [teamsList, setTeamsList] = useState([]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Load teams list when typology changes
  useEffect(() => {
    if (!typology) {
      setTeamsList([]);
      return;
    }
    const loadTeams = async () => {
      try {
        const res = await DocumentApi.getBusinessTeams(typology);
        setTeamsList(res.teams || []);
      } catch (err) {
        setTeamsList([]);
      }
    };
    loadTeams();
  }, [typology]);

  const loadDocuments = useCallback(async (pageNum = 0) => {
    setLoading(true);
    try {
      const params = { page: pageNum };
      if (typology) params.typology = typology;
      if (clinicId) params.clinicId = clinicId;

      const res = await DocumentApi.getDocuments(params);
      setDocuments(res.documents || []);
      setTotal(res.total || 0);
      if (res.selectedExam) {
        setSelectedExam(res.selectedExam);
      }
    } catch (err) {
      toast.error(t('documents.error_loading') || 'Errore nel caricamento dei documenti');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [typology, clinicId, t]);

  useEffect(() => {
    loadDocuments(page);
  }, [page, loadDocuments]);

  const handleTypologyChange = (newTypology) => {
    setTypology(newTypology);
    setClinicId('');
    setPage(0);
  };

  const handleClinicChange = (newClinicId) => {
    setClinicId(newClinicId);
    setPage(0);
  };

  const handleDownload = async (doc) => {
    try {
      await DocumentApi.downloadDocument(doc.id, doc.nameFile);
    } catch (err) {
      toast.error(t('documents.error_downloading') || 'Errore nel download');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm('Sei sicuro di voler rimuovere il documento?')) return;
    try {
      await DocumentApi.deleteDocument(doc.id);
      toast.success(t('documents.deleted') || 'Documento eliminato');
      loadDocuments(page);
    } catch (err) {
      toast.error(t('documents.error_deleting') || 'Errore nell\'eliminazione');
    }
  };

  const handleAttachToExam = async (doc) => {
    if (!recommExamId) return;
    try {
      await DocumentApi.attachToExam(doc.id, recommExamId);
      toast.success('Referto associato all\'esame con successo');
      setSearchParams({ tab: '2' });
    } catch (err) {
      toast.error(t('documents.error_attaching') || 'Errore nell\'associazione del referto');
    }
  };

  const handleAttachLink = (doc) => {
    setSearchParams({ tab: '2', refert: String(doc.id) });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <div className="my-documents">
      {/* Header: show exam info when in recomm mode */}
      {recommExamId && selectedExam && (
        <div className="recomm-header">
          <p>
            Seleziona il referto da allegare per il seguente esame:{' '}
            <strong>{selectedExam.label}</strong>
            {selectedExam.controlDate && ` del ${formatDate(selectedExam.controlDate)}`}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="documents-filters">
        <div className="filter-group">
          <label>Tipologia</label>
          <select
            className="form-control form-control-sm"
            value={typology}
            onChange={(e) => handleTypologyChange(e.target.value)}
          >
            <option value="">---</option>
            <option value="4">Clinica</option>
            <option value="3">Medico</option>
          </select>
        </div>

        {/* Secondary dropdown: Clinica (when typology = 4) */}
        {typology === '4' && (
          <div className="filter-group">
            <label>Clinica</label>
            <select
              className="form-control form-control-sm"
              value={clinicId}
              onChange={(e) => handleClinicChange(e.target.value)}
            >
              <option value="">---</option>
              {teamsList.map(c => (
                <option key={c.clinicId} value={c.clinicId}>
                  {c.denomination}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Secondary dropdown: Cognome Medico (when typology = 3) */}
        {typology === '3' && (
          <div className="filter-group">
            <label>Cognome Medico</label>
            <select
              className="form-control form-control-sm"
              value={clinicId}
              onChange={(e) => handleClinicChange(e.target.value)}
            >
              <option value="">---</option>
              {teamsList.map(c => (
                <option key={c.clinicId} value={c.clinicId}>
                  {c.denomination}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '20px' }}>Caricamento...</p>
      ) : (
        <>
          <table className="table table-hover documents-table">
            <thead>
              <tr>
                <th style={{ width: '10%' }}>Data caricamento</th>
                <th>Nome</th>
                <th>Dettagli</th>
                <th>Denominazione</th>
                <th style={{ width: '15%' }}></th>
              </tr>
            </thead>
            <tbody>
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>{formatDate(doc.dataLoad)}</td>
                    <td className="bold">{doc.nameFile}</td>
                    <td>{doc.details || ''}</td>
                    <td>{doc.denomination || ''}</td>
                    <td className="actions">
                      {/* Attach to exam - when in recomm mode */}
                      {recommExamId && (
                        <a href="#" onClick={(e) => { e.preventDefault(); handleAttachToExam(doc); }}
                          title="Allega referto all'esame">
                          <i className="fas fa-paperclip"></i>
                        </a>
                      )}
                      {/* Download */}
                      <a href="#" onClick={(e) => { e.preventDefault(); handleDownload(doc); }}
                        title="Download">
                        <i className="fas fa-download"></i>
                      </a>
                      {/* Attach link - only when NOT in recomm mode */}
                      {!recommExamId && (
                        <a href="#" onClick={(e) => { e.preventDefault(); handleAttachLink(doc); }}
                          title="Allega referto ad un esame">
                          <i className="fas fa-paperclip"></i>
                        </a>
                      )}
                      {/* Delete - only when NOT in recomm mode */}
                      {!recommExamId && (
                        <a href="#" onClick={(e) => { e.preventDefault(); handleDelete(doc); }}
                          title="Rimuovi">
                          <i className="fas fa-trash-alt"></i>
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                    Nessun documento presente
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="btn btn-sm btn-default"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                style={{ width: '40px' }}
              >
                &lt;
              </button>
              <span className="page-info">
                Pagina {page + 1} di {totalPages}
              </span>
              <button
                className="btn btn-sm btn-default"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                style={{ width: '40px' }}
              >
                &gt;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyDocuments;
