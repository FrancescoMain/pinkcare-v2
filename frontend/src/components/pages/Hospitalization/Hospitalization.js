import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import HospitalizationApi from '../../../services/hospitalizationApi';
import './hospitalization.css';

const PAGE_SIZE = 15;

const Hospitalization = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');

  if (tab === 'generateCode') {
    return <GenerateCode />;
  }

  return <PatientList />;
};

/**
 * PatientList — Main view: lista pazienti + sotto-vista documenti
 */
const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search filters
  const [searchName, setSearchName] = useState('');
  const [searchSurname, setSearchSurname] = useState('');
  const [searchCodFisc, setSearchCodFisc] = useState('');

  // Document sub-view
  const [selectedPatient, setSelectedPatient] = useState(null);

  const loadPatients = useCallback(async (pageNum = 0) => {
    setLoading(true);
    try {
      const params = { page: pageNum };
      if (searchName) params.name = searchName;
      if (searchSurname) params.surname = searchSurname;
      if (searchCodFisc) params.codFisc = searchCodFisc;

      const res = await HospitalizationApi.getPatients(params);
      setPatients(res.patients || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 0);
    } catch (err) {
      toast.error('Errore nel caricamento dei pazienti');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [searchName, searchSurname, searchCodFisc]);

  useEffect(() => {
    loadPatients(page);
  }, [page, loadPatients]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    loadPatients(0);
  };

  const handleApprove = async (patientId) => {
    try {
      await HospitalizationApi.approvePatient(patientId);
      toast.success('Paziente approvato');
      loadPatients(page);
    } catch (err) {
      toast.error('Errore nell\'approvazione');
    }
  };

  const handleOpenDocuments = (patient) => {
    setSelectedPatient(patient);
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  // Show document sub-view if a patient is selected
  if (selectedPatient) {
    return (
      <DocumentList
        patient={selectedPatient}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="hospitalization">
      <h4 className="section-title">Lista utenti</h4>

      {/* Search form */}
      <form className="search-form" onSubmit={handleSearch}>
        <div className="filter-group">
          <label>Nome</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Cognome</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={searchSurname}
            onChange={(e) => setSearchSurname(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Codice Fiscale</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={searchCodFisc}
            onChange={(e) => setSearchCodFisc(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <button type="submit" className="btn btn-sm btn-primary">
            CERCA
          </button>
        </div>
      </form>

      {/* Patient table */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '20px' }}>Caricamento...</p>
      ) : (
        <>
          <ul className="table-careers">
            <li className="head">
              <span>Data Identificazione</span>
              <span>Nome</span>
              <span>Cognome</span>
              <span>Data di nascita</span>
              <span>Codice Fiscale</span>
              <span>Codice</span>
              <span style={{ width: '15%' }}>Email</span>
              <span>Status</span>
              <span style={{ width: '5%' }}></span>
            </li>
            {patients.length > 0 ? (
              patients.map((patient) => (
                <li key={patient.ucId}>
                  <span className="date">{formatDate(patient.dataRequest)}</span>
                  <span>{patient.name}</span>
                  <span className="bold">{patient.surname}</span>
                  <span>{formatDate(patient.birthday)}</span>
                  <span>{patient.codFisc || ''}</span>
                  <span>{patient.code || ''}</span>
                  <span style={{ width: '15%', wordBreak: 'break-all' }}>{patient.email}</span>
                  <span>
                    {patient.status === 'approved' ? (
                      <span className="status-badge approved">Identificato</span>
                    ) : (
                      <span
                        className="status-badge toapprove"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleApprove(patient.id)}
                        title="Clicca per approvare"
                      >
                        Da identificare
                      </span>
                    )}
                  </span>
                  <span className="actions">
                    {patient.status === 'approved' && (
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleOpenDocuments(patient); }}
                        title="Documenti"
                      >
                        <i className="far fa-file-pdf"></i>
                      </a>
                    )}
                  </span>
                </li>
              ))
            ) : (
              <li style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                <span>Nessun paziente trovato</span>
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
                &lt;
              </button>
              <span className="page-info">
                Pag. {page + 1} di {totalPages}
              </span>
              <button
                className="btn btn-sm btn-default"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
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

/**
 * DocumentList — Sub-view: documenti per paziente selezionato
 */
const DocumentList = ({ patient, onBack }) => {
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const loadDocuments = useCallback(async (pageNum = 0) => {
    setLoading(true);
    try {
      const res = await HospitalizationApi.getDocuments(patient.id, pageNum);
      setDocuments(res.documents || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 0);
    } catch (err) {
      toast.error('Errore nel caricamento dei documenti');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [patient.id]);

  useEffect(() => {
    loadDocuments(page);
  }, [page, loadDocuments]);

  const handleDownload = async (doc) => {
    try {
      await HospitalizationApi.downloadDocument(doc.id, doc.nameFile);
    } catch (err) {
      toast.error('Errore nel download');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm('Eliminare questo documento?')) return;
    try {
      await HospitalizationApi.deleteDocument(doc.id);
      toast.success('Documento eliminato');
      loadDocuments(page);
    } catch (err) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    loadDocuments(page);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <div className="hospitalization">
      <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); onBack(); }}>
        <i className="fas fa-arrow-left"></i> Torna alla lista
      </a>

      <div className="documents-header">
        <p>Lista dei documenti caricati per la/il paziente: <strong>{patient.name} {patient.surname}</strong></p>
      </div>

      <a href="#" className="upload-link" onClick={(e) => { e.preventDefault(); setShowUploadModal(true); }}>
        <i className="fas fa-plus"></i> Carica documento
      </a>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '20px' }}>Caricamento...</p>
      ) : (
        <>
          <ul className="table-careers">
            <li className="head">
              <span>Data caricamento</span>
              <span>Nome File</span>
              <span>Dettagli</span>
              <span style={{ width: '15%' }}></span>
            </li>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <li key={doc.id}>
                  <span className="date">{formatDate(doc.dataLoad)}</span>
                  <span className="bold">{doc.nameFile}</span>
                  <span>{doc.details || ''}</span>
                  <span className="actions">
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); handleDownload(doc); }}
                      title="Scarica"
                    >
                      <i className="fas fa-download"></i>
                    </a>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); handleDelete(doc); }}
                      title="Elimina"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </a>
                  </span>
                </li>
              ))
            ) : (
              <li style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                <span>Nessun documento presente</span>
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
                &lt;
              </button>
              <span className="page-info">
                Pag. {page + 1} di {totalPages}
              </span>
              <button
                className="btn btn-sm btn-default"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                &gt;
              </button>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          patientId={patient.id}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
};

/**
 * UploadModal — Dialog modale per upload documenti
 */
const UploadModal = ({ patientId, onClose, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [details, setDetails] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type !== 'application/pdf') {
      toast.error('Solo file PDF sono ammessi');
      e.target.value = '';
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await HospitalizationApi.uploadDocument(patientId, file, details);
      toast.success('Documento caricato con successo');
      onUploadComplete();
    } catch (err) {
      toast.error(err.message || 'Errore nel caricamento del documento');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Carica documento (.pdf)</h3>
        <div className="form-group">
          <label>File</label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
          />
        </div>
        <div className="form-group">
          <label>Dettagli</label>
          <input
            type="text"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Descrizione opzionale"
          />
        </div>
        <div className="modal-actions">
          <button
            className="btn-upload"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Caricamento...' : 'Upload'}
          </button>
          <button className="btn-close-modal" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * GenerateCode — Tab: genera codice per paziente
 */
const GenerateCode = () => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [codFisc, setCodFisc] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !surname || !codFisc) {
      toast.error('Tutti i campi sono obbligatori');
      return;
    }

    setLoading(true);
    setGeneratedCode(null);
    try {
      const res = await HospitalizationApi.generateCode({
        name,
        surname,
        codFisc: codFisc.toUpperCase()
      });
      setGeneratedCode(res);
      toast.success('Codice generato con successo');
    } catch (err) {
      toast.error(err.message || 'Errore nella generazione del codice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hospitalization">
      <h4 className="section-title">Genera codice</h4>

      <form className="generate-code-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Cognome *</label>
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Codice Fiscale *</label>
          <input
            type="text"
            value={codFisc}
            onChange={(e) => setCodFisc(e.target.value.toUpperCase())}
            required
            maxLength={16}
            style={{ textTransform: 'uppercase' }}
          />
        </div>
        <button
          type="submit"
          className="btn-generate"
          disabled={loading}
        >
          {loading ? 'Generazione...' : 'Genera codice'}
        </button>
      </form>

      {generatedCode && (
        <div className="code-result">
          <div className="code-value">{generatedCode.code}</div>
          <p>Codice generato per: {generatedCode.name} {generatedCode.surname} ({generatedCode.codFisc})</p>
        </div>
      )}
    </div>
  );
};

export default Hospitalization;
