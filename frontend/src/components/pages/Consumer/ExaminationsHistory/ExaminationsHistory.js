import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import ExaminationApi from '../../../../services/examinationApi';
import './examinationsHistory.css';

/**
 * ExaminationsHistory - Replica esatta di examinations_history.xhtml
 * 4 sezioni accordion:
 * 1. Esami Prenatali (visibile solo se gravidanza attiva)
 * 2. Esami Prenatali Successivi (visibile solo se gravidanza attiva)
 * 3. Esami suggeriti (unconfirmed) - tabella con calendar inline + allegati
 * 4. Storico esami (confirmed) - tabella con paperclip allegati
 */
const ExaminationsHistory = () => {
  const { t } = useTranslation();
  const [, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const [prenatalExams, setPrenatalExams] = useState([]);
  const [nextPrenatalExams, setNextPrenatalExams] = useState([]);
  const [suggestedExams, setSuggestedExams] = useState([]);
  const [historyExams, setHistoryExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calendar state — selectedExam stores a unique key like "prenatal-123" or "suggested-456"
  const [selectedExam, setSelectedExam] = useState(null);
  const [pickerDate, setPickerDate] = useState('');
  const [noteText, setNoteText] = useState('');

  // Attachment dialog state
  const [attachmentDialog, setAttachmentDialog] = useState(null); // { examId, examLabel, isHistory }
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Accordion state — prenatal open, nextPrenatal collapsed (like legacy)
  const [openSections, setOpenSections] = useState({
    prenatal: true,
    nextPrenatal: false,
    suggested: true,
    history: true
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [suggestedRes, historyRes, prenatalRes, nextPrenatalRes] = await Promise.all([
        ExaminationApi.getSuggestedExaminations(),
        ExaminationApi.getExaminationHistory(),
        ExaminationApi.getPrenatalExaminations().catch(() => ({ examinations: [] })),
        ExaminationApi.getNextPrenatalExaminations().catch(() => ({ examinations: [] }))
      ]);
      setSuggestedExams(suggestedRes.examinations || []);
      setHistoryExams(historyRes.examinations || []);
      setPrenatalExams(prenatalRes.examinations || []);
      setNextPrenatalExams(nextPrenatalRes.examinations || []);
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

  // Generate a unique key for an exam in a given section
  const examKey = (section, exam) => `${section}-${exam.id || `v-${exam.examinationId}-${exam.protocolRuleId}`}`;

  // Calendar handlers
  const openDatePicker = (key, exam) => {
    setSelectedExam(key);
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
  const openAttachmentDialog = async (examId, examLabel, isHistory = false) => {
    setAttachmentDialog({ examId, examLabel, isHistory });
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

  // Open attachment dialog for exams that may not have an id yet (virtual/prenatal)
  const openAttachmentForExam = async (exam) => {
    if (exam.id) {
      openAttachmentDialog(exam.id, exam.label);
      return;
    }
    // Virtual exam: create the DB record first (with null date) to get an id for attachments
    try {
      const saveRes = await ExaminationApi.markExamDate(
        'new',
        null,
        exam.examinationId,
        exam.protocolRuleId
      );
      const newId = saveRes.examination?.id;
      if (newId) {
        openAttachmentDialog(newId, exam.label);
        loadData();
      } else {
        toast.error(t('examinations.error_saving'));
      }
    } catch (err) {
      toast.error(t('examinations.error_saving'));
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

  // Date badge helper
  const renderDateBadge = (dateStr) => {
    if (!dateStr) {
      return (
        <span className="eh-badge eh-badge--none" title={t('examinations.control_date')}>
          <i className="far fa-calendar"></i> {t('examinations.no_date')}
        </span>
      );
    }
    if (isDateFuture(dateStr)) {
      return (
        <span className="eh-badge eh-badge--future" title={t('examinations.control_date')}>
          <i className="far fa-calendar-check"></i> {formatDateTime(dateStr)}
        </span>
      );
    }
    return (
      <span className="eh-badge eh-badge--past" title={t('examinations.confirm_control_date')}>
        <i className="far fa-question-circle"></i> {formatDateTime(dateStr)}
      </span>
    );
  };

  // Inline calendar panel (shared)
  const renderCalendarPanel = (exam) => (
    <div className="eh-calendar-panel">
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
      <div className="eh-calendar-buttons">
        <button className="eh-btn eh-btn--secondary"
          onClick={() => openAttachmentForExam(exam)}>
          <i className="fas fa-paperclip"></i> {t('examinations.attached')}
        </button>
        {pickerDate && isDateFuture(pickerDate) && (
          <button className="eh-btn eh-btn--primary" onClick={() => handleSaveDate(exam)}>
            <i className="far fa-save"></i> {t('examinations.save')}
          </button>
        )}
        {pickerDate && isDatePastOrToday(pickerDate) && (
          <button className="eh-btn eh-btn--primary" onClick={() => handleConfirmExam(exam)}>
            <i className="fas fa-check"></i> {t('examinations.confirm')}
          </button>
        )}
        <button className="eh-btn eh-btn--ghost" onClick={closeDatePicker}>
          {t('examinations.close')}
        </button>
      </div>
    </div>
  );

  /**
   * Render an exam row (unified for prenatal, nextPrenatal, and suggested sections)
   */
  const renderExamRow = (exam, sectionKey) => {
    const key = examKey(sectionKey, exam);
    const isOpen = selectedExam === key;
    return (
      <React.Fragment key={key}>
        <div className="eh-exam-item">
          <div className="eh-exam-name">
            {exam.label}
            {exam.examinationInfo && <small>{exam.examinationInfo}</small>}
          </div>
          {renderDateBadge(exam.controlDate)}
          {exam.intervalWeek && (
            <span className="eh-badge eh-badge--week" title={t('examinations.week_pertinence')}>
              <i className="far fa-clock"></i> <span dangerouslySetInnerHTML={{ __html: exam.intervalWeek }} />
            </span>
          )}
          {exam.calculatedDate && (
            <span className="eh-badge eh-badge--none" title={t('examinations.calculated_control_date')}>
              <i className="far fa-clock"></i> {formatDate(exam.calculatedDate)}
            </span>
          )}
          <div className="eh-actions">
            <button
              className={`eh-action-btn eh-action-btn--calendar${isOpen ? ' active' : ''}`}
              onClick={() => isOpen ? closeDatePicker() : openDatePicker(key, exam)}
              title={exam.controlDate ? t('examinations.view_details') : t('examinations.mark_date')}
            >
              <i className="far fa-calendar-alt"></i>
              <span className="eh-action-label">{exam.controlDate ? t('examinations.view_details') : t('examinations.mark_date')}</span>
            </button>
            {exam.examinationId && (
              <button
                className="eh-action-btn eh-action-btn--location"
                onClick={() => goToNearestSolution(exam.examinationId)}
                title={t('examinations.nearest_solution')}
              >
                <i className="fas fa-map-marker-alt"></i>
                <span className="eh-action-label">{t('examinations.nearest_solution')}</span>
              </button>
            )}
            {exam.controlDate && exam.id && (
              <button
                className="eh-action-btn eh-action-btn--remove"
                onClick={() => handleRemoveReservation(exam)}
                title={t('examinations.remove_reservation')}
              >
                <i className="fas fa-times"></i>
                <span className="eh-action-label">{t('examinations.remove_reservation')}</span>
              </button>
            )}
          </div>
        </div>

        {isOpen && renderCalendarPanel(exam)}
      </React.Fragment>
    );
  };

  if (loading) {
    return <div className="eh-loading">Caricamento...</div>;
  }

  if (error) {
    return <div className="eh-error">{error}</div>;
  }

  return (
    <div className="eh-container">

      {/* Sezione 1: Esami Prenatali */}
      {prenatalExams.length > 0 && (
        <div className="eh-section eh-section--prenatal">
          <div className="eh-section-header" onClick={() => toggleSection('prenatal')}>
            <div className="eh-section-icon">
              <i className="fas fa-baby"></i>
            </div>
            <div className="eh-section-title">
              {t('examinations.prenatal_examinations')}
            </div>
            <span className="eh-section-count">{prenatalExams.length}</span>
            <i className={`fas fa-chevron-down eh-chevron${openSections.prenatal ? ' eh-chevron--open' : ''}`}></i>
          </div>

          {openSections.prenatal && (
            <div className="eh-section-body">
              {prenatalExams.map((exam) => renderExamRow(exam, 'prenatal'))}
            </div>
          )}
        </div>
      )}

      {/* Sezione 2: Esami Prenatali Successivi */}
      {nextPrenatalExams.length > 0 && (
        <div className="eh-section eh-section--next-prenatal">
          <div className="eh-section-header" onClick={() => toggleSection('nextPrenatal')}>
            <div className="eh-section-icon">
              <i className="fas fa-baby"></i>
            </div>
            <div className="eh-section-title">
              {t('examinations.next_prenatal_examinations')}
            </div>
            <span className="eh-section-count">{nextPrenatalExams.length}</span>
            <i className={`fas fa-chevron-down eh-chevron${openSections.nextPrenatal ? ' eh-chevron--open' : ''}`}></i>
          </div>

          {openSections.nextPrenatal && (
            <div className="eh-section-body">
              {nextPrenatalExams.map((exam) => renderExamRow(exam, 'nextPrenatal'))}
            </div>
          )}
        </div>
      )}

      {/* Sezione 3: Esami suggeriti */}
      <div className="eh-section eh-section--suggested">
        <div className="eh-section-header" onClick={() => toggleSection('suggested')}>
          <div className="eh-section-icon">
            <i className="fas fa-clipboard-list"></i>
          </div>
          <div className="eh-section-title">
            {t('examinations.suggested_examinations')}
            <span className="eh-section-subtitle">{t('examinations.suggested_examinations_subtitle')}</span>
          </div>
          <span className="eh-section-count">{suggestedExams.length}</span>
          <i className={`fas fa-chevron-down eh-chevron${openSections.suggested ? ' eh-chevron--open' : ''}`}></i>
        </div>

        {openSections.suggested && (
          <div className="eh-section-body">
            {suggestedExams.length > 0 ? (
              suggestedExams.map((exam) => renderExamRow(exam, 'suggested'))
            ) : (
              <div className="eh-empty">
                <i className="fas fa-clipboard-list"></i>
                <span>{t('examinations.no_suggested_exams')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sezione 4: Storico esami — Timeline */}
      <div className="eh-section eh-section--history">
        <div className="eh-section-header" onClick={() => toggleSection('history')}>
          <div className="eh-section-icon">
            <i className="fas fa-history"></i>
          </div>
          <div className="eh-section-title">
            {t('examinations.examinations_history')}
          </div>
          <span className="eh-section-count">{historyExams.length}</span>
          <i className={`fas fa-chevron-down eh-chevron${openSections.history ? ' eh-chevron--open' : ''}`}></i>
        </div>

        {openSections.history && (
          <div className="eh-section-body">
            {historyExams.length > 0 ? (
              <div className="eh-timeline">
                {historyExams.map((exam) => (
                  <div className="eh-timeline-item" key={exam.id}>
                    <div className="eh-timeline-dot"></div>
                    <div className="eh-timeline-card">
                      <div className="eh-timeline-header">
                        <span className="eh-timeline-exam-name">{exam.label}</span>
                        <span className="eh-badge eh-badge--future">
                          <i className="far fa-calendar-check"></i> {formatDateTime(exam.controlDate)}
                        </span>
                        {exam.id && (
                          <button
                            className="eh-timeline-clip"
                            onClick={() => openAttachmentDialog(exam.id, exam.label, true)}
                            title={t('examinations.show_report')}
                          >
                            <i className="fas fa-paperclip"></i>
                          </button>
                        )}
                      </div>
                      <div className="eh-timeline-meta">
                        {exam.nextControlDate && (
                          <span>
                            <i className="far fa-calendar"></i> {t('examinations.next_control_date')}: {formatDate(exam.nextControlDate)}
                          </span>
                        )}
                      </div>
                      {exam.note && (
                        <div className="eh-timeline-note">{exam.note}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="eh-empty">
                <i className="fas fa-history"></i>
                <span>{t('examinations.no_history')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog Allegati */}
      {attachmentDialog && (
        <div className="eh-dlg-overlay" onClick={closeAttachmentDialog}>
          <div className="eh-dlg" onClick={(e) => e.stopPropagation()}>
            <div className="eh-dlg-header">
              <h6>{t('examinations.attached')}</h6>
              <button className="eh-dlg-close" onClick={closeAttachmentDialog}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="eh-dlg-body">
              {uploadSuccess && (
                <div className="eh-dlg-success">Referto caricato con successo</div>
              )}
              {loadingAttachments ? (
                <p style={{ color: '#888' }}>Caricamento...</p>
              ) : attachments.length === 0 && !uploadSuccess ? (
                <div className="eh-empty">
                  <i className="fas fa-paperclip"></i>
                  <span>{t('examinations.no_file_attached')}</span>
                </div>
              ) : (
                attachments.map((att) => (
                  <div key={att.id} className="eh-att-item">
                    <i className="fas fa-file-alt eh-att-icon"></i>
                    <span className="eh-att-name">{att.publicName}</span>
                    <div className="eh-att-actions">
                      <button
                        className="eh-att-btn eh-att-btn--view"
                        onClick={() => handleDownloadAttachment(att.id, att.publicName)}
                        title={t('examinations.view')}
                      >
                        <i className="far fa-eye"></i>
                      </button>
                      <button
                        className="eh-att-btn eh-att-btn--delete"
                        onClick={() => handleDeleteAttachment(att.id)}
                        title={t('examinations.delete')}
                      >
                        <i className="fa fa-times"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
              <label className="eh-upload-zone">
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
            <div className="eh-dlg-footer">
              <button
                className="eh-btn eh-btn--secondary"
                onClick={handleUploadClick}
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Caricamento...' : t('examinations.upload')}
              </button>
              {attachmentDialog.isHistory && (
                <button
                  className="eh-btn eh-btn--primary"
                  onClick={() => { closeAttachmentDialog(); setSearchParams({ tab: '10', recomm: String(attachmentDialog.examId) }); }}
                >
                  {t('examinations.upload_report')}
                </button>
              )}
              <button className="eh-btn eh-btn--ghost" onClick={closeAttachmentDialog}>
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
