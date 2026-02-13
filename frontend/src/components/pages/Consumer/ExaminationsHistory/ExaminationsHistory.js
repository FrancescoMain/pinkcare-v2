import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import ExaminationApi from '../../../../services/examinationApi';
import './examinationsHistory.css';

/**
 * ExaminationsHistory - Replica esatta di examinations_history.xhtml
 * 2 sezioni accordion:
 * 1. Esami suggeriti (unconfirmed) - tabella con calendar inline + allegati
 * 2. Storico esami (confirmed) - tabella con paperclip allegati
 */
const ExaminationsHistory = () => {
  const { t } = useTranslation();
  const [, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const [suggestedExams, setSuggestedExams] = useState([]);
  const [historyExams, setHistoryExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calendar state
  const [selectedExam, setSelectedExam] = useState(null);
  const [pickerDate, setPickerDate] = useState('');
  const [noteText, setNoteText] = useState('');

  // Attachment dialog state
  const [attachmentDialog, setAttachmentDialog] = useState(null); // { examId, examLabel }
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Accordion state
  const [openSections, setOpenSections] = useState({ suggested: true, history: true });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [suggestedRes, historyRes] = await Promise.all([
        ExaminationApi.getSuggestedExaminations(),
        ExaminationApi.getExaminationHistory()
      ]);
      setSuggestedExams(suggestedRes.examinations || []);
      setHistoryExams(historyRes.examinations || []);
    } catch (err) {
      console.error('Error loading examinations:', err);
      setError(t('examinations.error_loading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const isDateFuture = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) > now;
  };

  const isDatePastOrToday = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) <= new Date(new Date().setHours(23, 59, 59, 999));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Calendar handlers
  const openDatePicker = (examId, exam) => {
    setSelectedExam(examId);
    setPickerDate(exam.controlDate ? exam.controlDate.substring(0, 16) : '');
    setNoteText('');
  };

  const closeDatePicker = () => {
    setSelectedExam(null);
    setPickerDate('');
    setNoteText('');
  };

  const handleSaveDate = async (exam) => {
    if (!pickerDate) return;
    if (!isDateFuture(pickerDate)) {
      toast.warning(t('examinations.future_date_required'));
      return;
    }
    try {
      await ExaminationApi.markExamDate(exam.id || 'new', new Date(pickerDate).toISOString(), exam.examinationId, exam.protocolRuleId);
      toast.success(t('examinations.date_saved'));
      closeDatePicker();
      loadData();
    } catch (err) {
      toast.error(t('examinations.error_saving'));
    }
  };

  const handleConfirmExam = async (exam) => {
    if (!pickerDate) return;
    if (!window.confirm(t('examinations.confirm_question'))) return;
    try {
      if (!exam.id) {
        const saveRes = await ExaminationApi.markExamDate('new', new Date(pickerDate).toISOString(), exam.examinationId, exam.protocolRuleId);
        const newId = saveRes.examination?.id;
        if (newId) await ExaminationApi.confirmExamination(newId, noteText || null);
      } else {
        await ExaminationApi.markExamDate(exam.id, new Date(pickerDate).toISOString(), exam.examinationId, exam.protocolRuleId);
        await ExaminationApi.confirmExamination(exam.id, noteText || null);
      }
      toast.success(t('examinations.exam_confirmed'));
      closeDatePicker();
      loadData();
    } catch (err) {
      toast.error(t('examinations.error_confirming'));
    }
  };

  const handleRemoveReservation = async (exam) => {
    if (!exam.id) return;
    try {
      await ExaminationApi.removeDate(exam.id);
      toast.success(t('examinations.date_removed'));
      closeDatePicker();
      loadData();
    } catch (err) {
      toast.error(t('examinations.error_removing'));
    }
  };

  const goToNearestSolution = (examinationId) => {
    setSearchParams({ tab: '6', exam_id: examinationId });
  };

  // Attachment handlers
  const openAttachmentDialog = async (examId, examLabel) => {
    setAttachmentDialog({ examId, examLabel });
    setLoadingAttachments(true);
    setUploadSuccess(false);
    setSelectedFile(null);
    try {
      const res = await ExaminationApi.getAttachments(examId);
      setAttachments(res.attachments || []);
    } catch (err) {
      toast.error(t('examinations.error_loading_attachments'));
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const closeAttachmentDialog = () => {
    setAttachmentDialog(null);
    setAttachments([]);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file || null);
  };

  const handleUploadClick = async () => {
    if (!selectedFile || !attachmentDialog) return;
    setUploading(true);
    try {
      await ExaminationApi.uploadAttachment(attachmentDialog.examId, selectedFile);
      setUploadSuccess(true);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Refresh attachments
      const res = await ExaminationApi.getAttachments(attachmentDialog.examId);
      setAttachments(res.attachments || []);
    } catch (err) {
      toast.error(t('examinations.error_uploading'));
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId, fileName) => {
    try {
      await ExaminationApi.downloadAttachment(attachmentId, fileName);
    } catch (err) {
      toast.error(t('examinations.error_downloading') || 'Errore nel download del file');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm(t('examinations.confirm_delete'))) return;
    try {
      await ExaminationApi.deleteAttachment(attachmentId);
      toast.success(t('examinations.file_deleted'));
      // Refresh attachments
      if (attachmentDialog) {
        const res = await ExaminationApi.getAttachments(attachmentDialog.examId);
        setAttachments(res.attachments || []);
      }
    } catch (err) {
      toast.error(t('examinations.error_deleting'));
    }
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Status icon for suggested exams table
  const getStatusCell = (exam) => {
    if (exam.controlDate && isDateFuture(exam.controlDate)) {
      return (
        <span>
          <a href="#" onClick={(e) => { e.preventDefault(); openDatePicker(exam.id, exam); }}
            title={t('examinations.control_date')}>
            <i className="far fa-calendar-alt"></i>
          </a>
        </span>
      );
    }
    if (exam.controlDate && isDatePastOrToday(exam.controlDate)) {
      return (
        <span>
          <a href="#" onClick={(e) => { e.preventDefault(); openDatePicker(exam.id, exam); }}
            title={t('examinations.confirm_control_date')}>
            <i className="far fa-question-circle" style={{ color: '#e18a17' }}></i>
          </a>
        </span>
      );
    }
    return <span></span>;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Caricamento...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#dc3545' }}>{error}</div>;
  }

  return (
    <div>
      <div id="accordion" role="tablist" aria-multiselectable="true" className="accordion-exams_history">
        <div className="card">

          {/* Sezione 1: Esami suggeriti (unconfirmed) */}
          <div className="ui-block-title" role="tab">
            <div className="h6 mb-0">
              <a href="#" onClick={(e) => { e.preventDefault(); toggleSection('suggested'); }}
                aria-expanded={openSections.suggested}
                className={openSections.suggested ? '' : 'collapsed'}>
                {t('examinations.suggested_examinations')}
                <span className="icons-wrap"><i className="fas fa-angle-down"></i></span>
              </a>
              <br />
              <span style={{ fontWeight: 100 }}>{t('examinations.suggested_examinations_subtitle')}</span>
            </div>
          </div>

          {openSections.suggested && (
            <div className="row">
              <div className="col col-12 col-sm-12 col-lg-10 m-auto">
                <ul className="table-careers svg_icon">
                  <li className="head">
                    <span>{t('examinations.examination')}</span>
                    <span>{t('examinations.control_date')}</span>
                    <span>{t('examinations.manage_reservation')}</span>
                    <span>{t('examinations.calculated_control_date')}</span>
                  </li>
                  {suggestedExams.length > 0 ? (
                    suggestedExams.map((exam) => (
                      <React.Fragment key={exam.id || `v-${exam.examinationId}-${exam.protocolRuleId}`}>
                        <li>
                          <span className="available-widget">
                            <div>{exam.label}</div>
                            <div className="more">
                              <i className="fas fa-ellipsis-h"></i>
                              <ul className="more-dropdown">
                                {exam.examinationId && (
                                  <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); goToNearestSolution(exam.examinationId); }}>
                                      {t('examinations.nearest_solution')}
                                    </a>
                                  </li>
                                )}
                                <li>
                                  <a href="#" onClick={(e) => { e.preventDefault(); selectedExam === exam.id ? closeDatePicker() : openDatePicker(exam.id, exam); }}>
                                    {exam.controlDate ? t('examinations.view_details') : t('examinations.mark_date')}
                                  </a>
                                </li>
                                {exam.controlDate && exam.id && (
                                  <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleRemoveReservation(exam); }}>
                                      {t('examinations.remove_reservation')}
                                    </a>
                                  </li>
                                )}
                              </ul>
                            </div>
                          </span>
                          <span className="date">{formatDateTime(exam.controlDate)}</span>
                          {getStatusCell(exam)}
                          <span className="date">{formatDate(exam.calculatedDate)}</span>
                        </li>

                        {/* Inline calendar */}
                        {selectedExam === exam.id && (
                          <li className="calendar-row">
                            <div className="inline_calendar" style={{ width: '100%' }}>
                              <div className="form-group">
                                <label>{t('examinations.date_and_time')}</label>
                                <input
                                  type="datetime-local"
                                  value={pickerDate}
                                  onChange={(e) => setPickerDate(e.target.value)}
                                  className="form-control"
                                />
                              </div>
                              {pickerDate && isDatePastOrToday(pickerDate) && (
                                <div className="form-group">
                                  <textarea
                                    className="form-control"
                                    placeholder={t('examinations.note_placeholder')}
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    rows={2}
                                  />
                                </div>
                              )}
                              <div className="calendar-buttons">
                                {exam.id && (
                                  <button className="btn btn-sm btn-default"
                                    onClick={() => openAttachmentDialog(exam.id, exam.label)}>
                                    {t('examinations.attached')}
                                  </button>
                                )}
                                {pickerDate && isDateFuture(pickerDate) && (
                                  <button className="btn btn-sm btn-primary" onClick={() => handleSaveDate(exam)}>
                                    {t('examinations.save')}
                                  </button>
                                )}
                                {pickerDate && isDatePastOrToday(pickerDate) && (
                                  <button className="btn btn-sm btn-primary" onClick={() => handleConfirmExam(exam)}>
                                    {t('examinations.confirm')}
                                  </button>
                                )}
                                <button className="btn btn-sm btn-default" onClick={closeDatePicker}>
                                  {t('examinations.close')}
                                </button>
                              </div>
                            </div>
                          </li>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <li style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                      <span>{t('examinations.no_suggested_exams')}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Sezione 2: Storico esami (confirmed) */}
          <div className="ui-block-title" role="tab">
            <h6 className="mb-1">
              <a href="#" onClick={(e) => { e.preventDefault(); toggleSection('history'); }}
                aria-expanded={openSections.history}
                className={openSections.history ? '' : 'collapsed'}>
                {t('examinations.examinations_history')}
                <span className="icons-wrap"><i className="fas fa-angle-down"></i></span>
              </a>
            </h6>
          </div>

          {openSections.history && (
            <div className="row">
              <div className="col col-12 col-sm-12 col-lg-10 m-auto">
                <ul className="table-careers">
                  <li className="head">
                    <span>{t('examinations.control_date')}</span>
                    <span>{t('examinations.next_control_date')}</span>
                    <span>{t('examinations.examination')}</span>
                    <span>{t('examinations.result')}</span>
                  </li>
                  {historyExams.length > 0 ? (
                    historyExams.map((exam) => (
                      <li key={exam.id}>
                        <span className="date">{formatDateTime(exam.controlDate)}</span>
                        <span className="date">{formatDate(exam.nextControlDate)}</span>
                        <span className="type bold">
                          {exam.label}&nbsp;
                          {exam.id && (
                            <a href="#" onClick={(e) => { e.preventDefault(); openAttachmentDialog(exam.id, exam.label); }}
                              title={t('examinations.show_report')}>
                              <i className="fas fa-paperclip"></i>
                            </a>
                          )}
                        </span>
                        <span>{exam.note || ''}</span>
                      </li>
                    ))
                  ) : (
                    <li style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                      <span>{t('examinations.no_history')}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Dialog Allegati - Replica esatta di dlg_historical_attachments del legacy */}
      {attachmentDialog && (
        <div className="dlg-overlay" onClick={closeAttachmentDialog}>
          <div className="dlg-content" onClick={(e) => e.stopPropagation()}>
            <div className="dlg-header">
              <h6>{t('examinations.attached')}</h6>
            </div>
            <div className="dlg-body">
              {uploadSuccess && (
                <h5 style={{ color: 'green', marginBottom: '10px' }}>Referto caricato con successo</h5>
              )}
              {loadingAttachments ? (
                <p>Caricamento...</p>
              ) : attachments.length === 0 && !uploadSuccess ? (
                <p>{t('examinations.no_file_attached')}</p>
              ) : (
                attachments.map((att) => (
                  <div key={att.id} className="attachment-row">
                    <span className="att-name">{att.publicName}</span>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleDownloadAttachment(att.id, att.publicName); }}
                      title={t('examinations.view')}>
                      <i className="far fa-eye" style={{ fontSize: '14px' }}></i>
                    </a>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleDeleteAttachment(att.id); }}
                      title={t('examinations.delete')} style={{ marginLeft: '5px' }}>
                      <i className="fa fa-times" style={{ fontSize: '14px' }}></i>
                    </a>
                  </div>
                ))
              )}
              <div className="upload-section">
                <label className="file-upload-label">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <i className="fa fa-plus"></i>
                  <span>{selectedFile ? selectedFile.name : t('examinations.add_file_from_pc')}</span>
                </label>
              </div>
            </div>
            <div className="dlg-footer">
              <button
                className="btn btn-default"
                onClick={handleUploadClick}
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Caricamento...' : t('examinations.upload')}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => { closeAttachmentDialog(); setSearchParams({ tab: '10', recomm: String(attachmentDialog.examId) }); }}
              >
                {t('examinations.upload_report')}
              </button>
              <button className="btn btn-default" onClick={closeAttachmentDialog}>
                {t('examinations.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExaminationsHistory;
