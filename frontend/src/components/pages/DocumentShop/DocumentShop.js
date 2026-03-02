import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import DocumentShopApi from '../../../services/documentShopApi';
import ThreeColumnLayout from '../../layout/ThreeColumnLayout';
import UserProfileSidebar from '../../layout/UserProfileSidebar';
import AdvertisingSidebar from '../../layout/AdvertisingSidebar';
import './documentShop.css';

const PAGE_SIZE = 15;

/**
 * DocumentShop — Main component
 * Routes to ClinicView or DoctorView based on user's team type
 */
const DocumentShop = () => {
  const { user } = useAuth();
  const teamType = user?.team?.type?.id;

  return (
    <ThreeColumnLayout
      leftSidebar={<UserProfileSidebar />}
      rightSidebar={<AdvertisingSidebar />}
      leftColSize={2}
      centerColSize={8}
      rightColSize={2}
    >
      {teamType === 'CLINIC' ? <ClinicView /> : <DoctorView />}
    </ThreeColumnLayout>
  );
};

/**
 * ClinicView — Clinic users: select doctor, upload/manage documents
 */
const ClinicView = () => {
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  // Doctor autocomplete
  const [doctorQuery, setDoctorQuery] = useState('');
  const [doctorSuggestions, setDoctorSuggestions] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Search doctors autocomplete
  useEffect(() => {
    if (doctorQuery.length < 3) {
      setDoctorSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await DocumentShopApi.searchDoctors(doctorQuery);
        setDoctorSuggestions(results);
        setShowSuggestions(true);
      } catch (err) {
        setDoctorSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [doctorQuery]);

  // Load documents when doctor selected or page changes
  const loadDocuments = useCallback(async (pageNum = 0) => {
    if (!selectedDoctor) return;
    setLoading(true);
    try {
      const res = await DocumentShopApi.getDocuments({
        doctorId: selectedDoctor.id,
        page: pageNum
      });
      setDocuments(res.documents || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 0);
    } catch (err) {
      toast.error('Errore nel caricamento dei documenti');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (selectedDoctor) {
      loadDocuments(page);
    }
  }, [page, selectedDoctor, loadDocuments]);

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setDoctorQuery('');
    setShowSuggestions(false);
    setPage(0);
  };

  const handleClearDoctor = () => {
    setSelectedDoctor(null);
    setDocuments([]);
    setTotal(0);
    setTotalPages(0);
    setPage(0);
  };

  const handleDownload = async (doc) => {
    try {
      await DocumentShopApi.downloadDocument(doc.id, doc.nameFile);
    } catch (err) {
      toast.error('Errore nel download');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm('Sei sicuro di voler rimuovere il documento?')) return;
    try {
      await DocumentShopApi.deleteDocument(doc.id);
      toast.success('Documento eliminato');
      loadDocuments(page);
    } catch (err) {
      toast.error("Errore nell'eliminazione");
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
    <div className="document-shop">
      <h4 className="section-title">Invio Relazioni</h4>

      {/* Doctor autocomplete */}
      {!selectedDoctor ? (
        <div className="autocomplete-wrapper" ref={suggestionsRef}>
          <div className="filter-group">
            <label>Seleziona Medico</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={doctorQuery}
              onChange={(e) => setDoctorQuery(e.target.value)}
              placeholder="Cerca per nome, cognome o email (min 3 caratteri)"
            />
            {showSuggestions && doctorSuggestions.length > 0 && (
              <ul className="autocomplete-suggestions">
                {doctorSuggestions.map((doc) => (
                  <li key={doc.id} onClick={() => handleSelectDoctor(doc)}>
                    {doc.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="selected-doctor">
          <span><strong>Medico:</strong> {selectedDoctor.surname} {selectedDoctor.name} ({selectedDoctor.email})</span>
          <button className="btn-clear" onClick={handleClearDoctor} title="Cambia medico">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Upload button */}
      {selectedDoctor && (
        <a href="#" className="upload-link" onClick={(e) => { e.preventDefault(); setShowUploadModal(true); }}>
          <i className="fas fa-plus"></i> Carica documento
        </a>
      )}

      {/* Documents table */}
      {selectedDoctor && (
        <>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>Caricamento...</p>
          ) : (
            <>
              <ul className="table-careers">
                <li className="head">
                  <span>Data</span>
                  <span>Nome</span>
                  <span>Cognome</span>
                  <span>Nome file</span>
                  <span>Note</span>
                  <span style={{ width: '10%' }}></span>
                </li>
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <li key={doc.id}>
                      <span className="date">{formatDate(doc.dataLoad)}</span>
                      <span>{doc.namePatient}</span>
                      <span className="bold">{doc.surnamePatient}</span>
                      <span>{doc.nameFile}</span>
                      <span>{doc.notes || ''}</span>
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
        </>
      )}

      {/* Upload modal */}
      {showUploadModal && selectedDoctor && (
        <UploadModal
          doctorId={selectedDoctor.id}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
};

/**
 * DoctorView — Doctor users: view their documents (optionally filter by clinic)
 */
const DoctorView = () => {
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async (pageNum = 0) => {
    setLoading(true);
    try {
      const res = await DocumentShopApi.getDocuments({ page: pageNum });
      setDocuments(res.documents || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 0);
    } catch (err) {
      toast.error('Errore nel caricamento dei documenti');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments(page);
  }, [page, loadDocuments]);

  const handleDownload = async (doc) => {
    try {
      await DocumentShopApi.downloadDocument(doc.id, doc.nameFile);
    } catch (err) {
      toast.error('Errore nel download');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm('Sei sicuro di voler rimuovere il documento?')) return;
    try {
      await DocumentShopApi.deleteDocument(doc.id);
      toast.success('Documento eliminato');
      loadDocuments(page);
    } catch (err) {
      toast.error("Errore nell'eliminazione");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <div className="document-shop">
      <h4 className="section-title">Documenti Shop</h4>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '20px' }}>Caricamento...</p>
      ) : (
        <>
          <ul className="table-careers">
            <li className="head">
              <span>Data</span>
              <span>Nome file</span>
              <span>Note</span>
              <span style={{ width: '10%' }}></span>
            </li>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <li key={doc.id}>
                  <span className="date">{formatDate(doc.dataLoad)}</span>
                  <span className="bold">{doc.nameFile}</span>
                  <span>{doc.notes || ''}</span>
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
    </div>
  );
};

/**
 * UploadModal — Upload dialog for clinic users
 */
const UploadModal = ({ doctorId, onClose, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [namePatient, setNamePatient] = useState('');
  const [surnamePatient, setSurnamePatient] = useState('');
  const [notes, setNotes] = useState('');
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
    if (!file || !namePatient || !surnamePatient) {
      toast.error('Nome, cognome e file sono obbligatori');
      return;
    }
    setUploading(true);
    try {
      await DocumentShopApi.uploadDocument(file, {
        name_patient: namePatient,
        surname_patient: surnamePatient,
        notes,
        doctorId
      });
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
          <label>Nome paziente *</label>
          <input
            type="text"
            value={namePatient}
            onChange={(e) => setNamePatient(e.target.value)}
            placeholder="Nome"
          />
        </div>
        <div className="form-group">
          <label>Cognome paziente *</label>
          <input
            type="text"
            value={surnamePatient}
            onChange={(e) => setSurnamePatient(e.target.value)}
            placeholder="Cognome"
          />
        </div>
        <div className="form-group">
          <label>Note</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note opzionali"
          />
        </div>
        <div className="form-group">
          <label>File *</label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
          />
        </div>
        <div className="modal-actions">
          <button
            className="btn-upload"
            onClick={handleUpload}
            disabled={!file || !namePatient || !surnamePatient || uploading}
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

export default DocumentShop;
