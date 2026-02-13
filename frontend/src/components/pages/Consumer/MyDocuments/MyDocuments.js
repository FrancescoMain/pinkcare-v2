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
  const [doctorId, setDoctorId] = useState('');

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const loadDocuments = useCallback(async (pageNum = 0) => {
    setLoading(true);
    try {
      const params = { page: pageNum };
      if (typology) params.typology = typology;
      if (clinicId) params.clinicId = clinicId;
      if (doctorId) params.doctorId = doctorId;

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
  }, [typology, clinicId, doctorId, t]);

  useEffect(() => {
    loadDocuments(page);
  }, [page, loadDocuments]);

  const handleFind = () => {
    setPage(0);
    loadDocuments(0);
  };

  const handleDownload = async (doc) => {
    try {
      await DocumentApi.downloadDocument(doc.id, doc.nameFile);
    } catch (err) {
      toast.error(t('documents.error_downloading') || 'Errore nel download');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(t('documents.confirm_delete') || 'Eliminare?')) return;
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
      // Navigate back to examinations history
      setSearchParams({ tab: '2' });
    } catch (err) {
      toast.error(t('documents.error_attaching') || 'Errore nell\'associazione del referto');
    }
  };

  const handleAttachLink = (doc) => {
    // Navigate to tab 2 (exam history) with refert parameter
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
          <label>{t('documents.typology') || 'Tipologia'}</label>
          <select
            className="form-control form-control-sm"
            value={typology}
            onChange={(e) => { setTypology(e.target.value); setClinicId(''); setDoctorId(''); }}
          >
            <option value="">{t('documents.all') || 'Tutte'}</option>
            <option value="4">{t('documents.clinic') || 'Clinica'}</option>
            <option value="3">{t('documents.doctor') || 'Medico'}</option>
          </select>
        </div>
        <div className="filter-group">
          <button className="btn btn-sm btn-primary" onClick={handleFind}>
            {t('documents.find') || 'Cerca'}
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '20px' }}>Caricamento...</p>
      ) : (
        <>
          <ul className="table-careers">
            <li className="head">
              <span>{t('documents.upload_date') || 'Data caricamento'}</span>
              <span>{t('documents.name') || 'Nome'}</span>
              <span>{t('documents.details') || 'Dettagli'}</span>
              <span>{t('documents.denomination') || 'Denominazione'}</span>
              <span style={{ width: '15%' }}></span>
            </li>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <li key={doc.id}>
                  <span className="date">{formatDate(doc.dataLoad)}</span>
                  <span className="type bold">{doc.nameFile}</span>
                  <span>{doc.details || ''}</span>
                  <span>{doc.denomination || ''}</span>
                  <span className="actions">
                    {/* Attach to exam - when in recomm mode */}
                    {recommExamId && (
                      <a href="#" onClick={(e) => { e.preventDefault(); handleAttachToExam(doc); }}
                        title="Allega all'esame">
                        <i className="fas fa-paperclip"></i>
                      </a>
                    )}
                    {/* Download */}
                    <a href="#" onClick={(e) => { e.preventDefault(); handleDownload(doc); }}
                      title={t('documents.download') || 'Scarica'}>
                      <i className="fas fa-download"></i>
                    </a>
                    {/* Attach link - only when NOT in recomm mode */}
                    {!recommExamId && (
                      <a href="#" onClick={(e) => { e.preventDefault(); handleAttachLink(doc); }}
                        title={t('documents.attach_to_exam') || 'Allega ad esame'}>
                        <i className="fas fa-paperclip"></i>
                      </a>
                    )}
                    {/* Delete - only when NOT in recomm mode */}
                    {!recommExamId && (
                      <a href="#" onClick={(e) => { e.preventDefault(); handleDelete(doc); }}
                        title={t('documents.delete') || 'Elimina'}
                        style={{ marginLeft: '5px' }}>
                        <i className="fas fa-trash"></i>
                      </a>
                    )}
                  </span>
                </li>
              ))
            ) : (
              <li style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                <span>{t('documents.no_documents') || 'Nessun documento presente'}</span>
              </li>
            )}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="btn btn-sm btn-default"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                {t('documents.previous') || 'Precedente'}
              </button>
              <span className="page-info">
                Pagina {page + 1} di {totalPages}
              </span>
              <button
                className="btn btn-sm btn-default"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                {t('documents.next') || 'Successivo'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyDocuments;
