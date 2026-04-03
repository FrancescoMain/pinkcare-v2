import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import ThreeColumnLayout from '../../layout/ThreeColumnLayout';
import UserProfileSidebar from '../../layout/UserProfileSidebar';
import AdvertisingSidebar from '../../layout/AdvertisingSidebar';
import AdminApi from '../../../services/adminApi';
import '../Admin/Administration.css';

/**
 * ExamPathologyList Component
 * Replica della pagina "Esami E Patologie" del legacy.
 * Due sezioni separate: Esami (examination=true) e Patologie (examination=false)
 * dalla tabella app_examination_pathology.
 */
const ExamPathologyList = ({ errorHandler }) => {
  const { t } = useTranslation();

  // Examinations state
  const [exams, setExams] = useState([]);
  const [examsPage, setExamsPage] = useState(1);
  const [examsTotalPages, setExamsTotalPages] = useState(1);
  const [examsLoading, setExamsLoading] = useState(true);
  const [newExamLabel, setNewExamLabel] = useState('');
  const [newExamDays, setNewExamDays] = useState('');
  const [editingExamId, setEditingExamId] = useState(null);
  const [editingExamLabel, setEditingExamLabel] = useState('');
  const [editingExamDays, setEditingExamDays] = useState('');
  const [savingExam, setSavingExam] = useState(false);

  // Pathologies state
  const [pathologies, setPathologies] = useState([]);
  const [pathologiesPage, setPathologiesPage] = useState(1);
  const [pathologiesTotalPages, setPathologiesTotalPages] = useState(1);
  const [pathologiesLoading, setPathologiesLoading] = useState(true);
  const [newPathLabel, setNewPathLabel] = useState('');
  const [editingPathId, setEditingPathId] = useState(null);
  const [editingPathLabel, setEditingPathLabel] = useState('');
  const [savingPath, setSavingPath] = useState(false);

  const fetchExaminations = useCallback(async (page = 1) => {
    try {
      setExamsLoading(true);
      const result = await AdminApi.getExaminations(page, 15);
      setExams(result.items || []);
      setExamsPage(result.page || 1);
      setExamsTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error('Error fetching examinations:', error);
      toast.error('Errore nel caricamento degli esami');
    } finally {
      setExamsLoading(false);
    }
  }, []);

  const fetchPathologies = useCallback(async (page = 1) => {
    try {
      setPathologiesLoading(true);
      const result = await AdminApi.getPathologies(page, 15);
      setPathologies(result.items || []);
      setPathologiesPage(result.page || 1);
      setPathologiesTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error('Error fetching pathologies:', error);
      toast.error('Errore nel caricamento delle patologie');
    } finally {
      setPathologiesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExaminations();
    fetchPathologies();
  }, [fetchExaminations, fetchPathologies]);

  // --- Examinations handlers ---

  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!newExamLabel.trim()) {
      toast.error('Inserire un\'etichetta');
      return;
    }
    try {
      setSavingExam(true);
      await AdminApi.createExamination({
        label: newExamLabel.trim(),
        periodicalControlDays: newExamDays ? parseInt(newExamDays) : null
      });
      toast.success('Esame aggiunto');
      setNewExamLabel('');
      setNewExamDays('');
      fetchExaminations(1);
    } catch (error) {
      console.error('Error creating examination:', error);
      toast.error('Errore nella creazione');
    } finally {
      setSavingExam(false);
    }
  };

  const handleEditExam = (item) => {
    setEditingExamId(item.id);
    setEditingExamLabel(item.label);
    setEditingExamDays(item.periodicalControlDays != null ? String(item.periodicalControlDays) : '');
  };

  const handleCancelEditExam = () => {
    setEditingExamId(null);
    setEditingExamLabel('');
    setEditingExamDays('');
  };

  const handleSaveEditExam = async (id) => {
    if (!editingExamLabel.trim()) {
      toast.error('Inserire un\'etichetta');
      return;
    }
    try {
      setSavingExam(true);
      await AdminApi.updateExamination(id, {
        label: editingExamLabel.trim(),
        periodicalControlDays: editingExamDays ? parseInt(editingExamDays) : null
      });
      toast.success('Esame aggiornato');
      setEditingExamId(null);
      setEditingExamLabel('');
      setEditingExamDays('');
      fetchExaminations(examsPage);
    } catch (error) {
      console.error('Error updating examination:', error);
      toast.error('Errore nell\'aggiornamento');
    } finally {
      setSavingExam(false);
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm('Eliminare questo esame?')) {
      return;
    }
    try {
      await AdminApi.deleteExamination(id);
      toast.success('Esame eliminato');
      fetchExaminations(examsPage);
    } catch (error) {
      console.error('Error deleting examination:', error);
      toast.error('Errore nell\'eliminazione');
    }
  };

  // --- Pathologies handlers ---

  const handleAddPath = async (e) => {
    e.preventDefault();
    if (!newPathLabel.trim()) {
      toast.error('Inserire un\'etichetta');
      return;
    }
    try {
      setSavingPath(true);
      await AdminApi.createPathology({ label: newPathLabel.trim() });
      toast.success('Patologia aggiunta');
      setNewPathLabel('');
      fetchPathologies(1);
    } catch (error) {
      console.error('Error creating pathology:', error);
      toast.error('Errore nella creazione');
    } finally {
      setSavingPath(false);
    }
  };

  const handleEditPath = (item) => {
    setEditingPathId(item.id);
    setEditingPathLabel(item.label);
  };

  const handleCancelEditPath = () => {
    setEditingPathId(null);
    setEditingPathLabel('');
  };

  const handleSaveEditPath = async (id) => {
    if (!editingPathLabel.trim()) {
      toast.error('Inserire un\'etichetta');
      return;
    }
    try {
      setSavingPath(true);
      await AdminApi.updatePathology(id, { label: editingPathLabel.trim() });
      toast.success('Patologia aggiornata');
      setEditingPathId(null);
      setEditingPathLabel('');
      fetchPathologies(pathologiesPage);
    } catch (error) {
      console.error('Error updating pathology:', error);
      toast.error('Errore nell\'aggiornamento');
    } finally {
      setSavingPath(false);
    }
  };

  const handleDeletePath = async (id) => {
    if (!window.confirm('Eliminare questa patologia?')) {
      return;
    }
    try {
      await AdminApi.deletePathology(id);
      toast.success('Patologia eliminata');
      fetchPathologies(pathologiesPage);
    } catch (error) {
      console.error('Error deleting pathology:', error);
      toast.error('Errore nell\'eliminazione');
    }
  };

  // --- Pagination renderer ---

  const renderPagination = (currentPage, totalPages, onPageChange) => {
    if (totalPages <= 1) return null;
    return (
      <div className="admin-pagination">
        <button
          className="btn btn-sm btn-outline-secondary"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          &lt;
        </button>
        <span className="admin-pagination-info">
          Pag. {currentPage} Di {totalPages}
        </span>
        <button
          className="btn btn-sm btn-outline-secondary"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          &gt;
        </button>
      </div>
    );
  };

  return (
    <ThreeColumnLayout
      leftSidebar={<UserProfileSidebar />}
      rightSidebar={<AdvertisingSidebar />}
      leftColSize={2}
      centerColSize={8}
      rightColSize={2}
    >
      <div className="admin-page">
        <div className="admin-content">
          <div className="admin-list">
            <h5 className="admin-title">Esami E Patologie</h5>

            {/* ===== ESAMI SECTION ===== */}
            <h6>Esami</h6>
            <hr />

            {/* Add exam form */}
            <form className="admin-search-form" onSubmit={handleAddExam}>
              <div className="admin-search-fields">
                <input
                  type="text"
                  placeholder="Etichetta"
                  value={newExamLabel}
                  onChange={(e) => setNewExamLabel(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Ripetere ogni? (gg)"
                  value={newExamDays}
                  onChange={(e) => setNewExamDays(e.target.value)}
                  min="0"
                />
              </div>
              <div className="admin-search-actions">
                <button type="submit" className="btn btn-primary" disabled={savingExam}>
                  {savingExam ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </form>

            {/* Exams table */}
            {examsLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
              </div>
            ) : exams.length === 0 ? (
              <div className="admin-empty">Nessun esame trovato</div>
            ) : (
              <>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Etichetta</th>
                      <th>Controllo periodico in giorni</th>
                      <th style={{ width: '15%' }}>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {editingExamId === item.id ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="text"
                                value={editingExamLabel}
                                onChange={(e) => setEditingExamLabel(e.target.value)}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '13px',
                                  border: '1px solid #d0d8f0',
                                  borderRadius: '4px',
                                  flex: 1
                                }}
                              />
                            </div>
                          ) : (
                            item.label
                          )}
                        </td>
                        <td>
                          {editingExamId === item.id ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="number"
                                value={editingExamDays}
                                onChange={(e) => setEditingExamDays(e.target.value)}
                                min="0"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '13px',
                                  border: '1px solid #d0d8f0',
                                  borderRadius: '4px',
                                  width: '100px'
                                }}
                              />
                              <button
                                className="toggle-btn"
                                onClick={() => handleSaveEditExam(item.id)}
                                title="Salva"
                                disabled={savingExam}
                              >
                                <i className="fas fa-check" style={{ color: '#2da54e' }}></i>
                              </button>
                              <button
                                className="toggle-btn"
                                onClick={handleCancelEditExam}
                                title="Annulla"
                              >
                                <i className="fas fa-ban" style={{ color: '#999' }}></i>
                              </button>
                            </div>
                          ) : (
                            item.periodicalControlDays != null ? `${item.periodicalControlDays} gg` : ''
                          )}
                        </td>
                        <td>
                          {editingExamId !== item.id && (
                            <>
                              <button
                                className="toggle-btn"
                                onClick={() => handleEditExam(item)}
                                title="Modifica"
                              >
                                <i className="fas fa-edit" style={{ color: '#515365' }}></i>
                              </button>
                              <button
                                className="toggle-btn"
                                onClick={() => handleDeleteExam(item.id)}
                                title="Eliminare"
                              >
                                <i className="fas fa-times" style={{ color: '#d20000' }}></i>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {renderPagination(examsPage, examsTotalPages, (p) => fetchExaminations(p))}
              </>
            )}

            {/* ===== PATOLOGIE SECTION ===== */}
            <h6 style={{ marginTop: '30px' }}>Patologie</h6>
            <hr />

            {/* Add pathology form */}
            <form className="admin-search-form" onSubmit={handleAddPath}>
              <div className="admin-search-fields">
                <input
                  type="text"
                  placeholder="Etichetta"
                  value={newPathLabel}
                  onChange={(e) => setNewPathLabel(e.target.value)}
                />
              </div>
              <div className="admin-search-actions">
                <button type="submit" className="btn btn-primary" disabled={savingPath}>
                  {savingPath ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </form>

            {/* Pathologies table */}
            {pathologiesLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
              </div>
            ) : pathologies.length === 0 ? (
              <div className="admin-empty">Nessuna patologia trovata</div>
            ) : (
              <>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Etichetta</th>
                      <th style={{ width: '15%' }}>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pathologies.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {editingPathId === item.id ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="text"
                                value={editingPathLabel}
                                onChange={(e) => setEditingPathLabel(e.target.value)}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '13px',
                                  border: '1px solid #d0d8f0',
                                  borderRadius: '4px',
                                  flex: 1
                                }}
                              />
                              <button
                                className="toggle-btn"
                                onClick={() => handleSaveEditPath(item.id)}
                                title="Salva"
                                disabled={savingPath}
                              >
                                <i className="fas fa-check" style={{ color: '#2da54e' }}></i>
                              </button>
                              <button
                                className="toggle-btn"
                                onClick={handleCancelEditPath}
                                title="Annulla"
                              >
                                <i className="fas fa-ban" style={{ color: '#999' }}></i>
                              </button>
                            </div>
                          ) : (
                            item.label
                          )}
                        </td>
                        <td>
                          {editingPathId !== item.id && (
                            <>
                              <button
                                className="toggle-btn"
                                onClick={() => handleEditPath(item)}
                                title="Modifica"
                              >
                                <i className="fas fa-edit" style={{ color: '#515365' }}></i>
                              </button>
                              <button
                                className="toggle-btn"
                                onClick={() => handleDeletePath(item.id)}
                                title="Eliminare"
                              >
                                <i className="fas fa-times" style={{ color: '#d20000' }}></i>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {renderPagination(pathologiesPage, pathologiesTotalPages, (p) => fetchPathologies(p))}
              </>
            )}
          </div>
        </div>
      </div>
    </ThreeColumnLayout>
  );
};

export default ExamPathologyList;
