import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import ExaminationApi from '../../../../services/examinationApi';
import './recommendedExamList.css';

/**
 * RecommendedExamList - Replica esatta di recommended_examination_list.xhtml
 * 3 sezioni: età, routine, screening
 * Struttura HTML: ui-block available-widget con dropdown more
 */
const RecommendedExamList = () => {
  const { t } = useTranslation();
  const [, setSearchParams] = useSearchParams();

  const [ageExams, setAgeExams] = useState([]);
  const [routineExams, setRoutineExams] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedExam, setSelectedExam] = useState(null);
  const [pickerDate, setPickerDate] = useState('');
  const [noteText, setNoteText] = useState('');
  const [openScreenings, setOpenScreenings] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ageRes, routineRes, screeningRes] = await Promise.all([
        ExaminationApi.getAgeExaminations(),
        ExaminationApi.getRoutineExaminations(),
        ExaminationApi.getScreeningExaminations()
      ]);
      setAgeExams(ageRes.examinations || []);
      setRoutineExams(routineRes.examinations || []);
      const scrs = screeningRes.examinations || [];
      setScreenings(scrs);
      // Non-archived screenings start open
      const initial = {};
      scrs.forEach(s => { if (!s.archived) initial[s.screeningId] = true; });
      setOpenScreenings(initial);
    } catch (err) {
      console.error('Error loading examinations:', err);
      setError(t('examinations.error_loading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

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

  const handleSaveDate = async (exam) => {
    if (!pickerDate) return;
    if (!isDateFuture(pickerDate)) {
      toast.warning(t('examinations.future_date_required'));
      return;
    }
    try {
      await ExaminationApi.markExamDate(exam.id, new Date(pickerDate).toISOString(), exam.examinationId, exam.protocolRuleId);
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
        const saveRes = await ExaminationApi.markExamDate(null, new Date(pickerDate).toISOString(), exam.examinationId, exam.protocolRuleId);
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

  const handleRemoveDate = async (exam) => {
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

  const toggleScreening = (screeningId) => {
    setOpenScreenings(prev => ({ ...prev, [screeningId]: !prev[screeningId] }));
  };

  const handleToggleArchive = async (screeningId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await ExaminationApi.toggleArchiveScreening(screeningId);
      toast.success(res.archived ? t('examinations.screening_archived') : t('examinations.screening_restored'));
      loadData();
    } catch (err) {
      toast.error(t('examinations.error_archiving'));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusIcon = (exam) => {
    if (exam.controlDate && isDateFuture(exam.controlDate)) {
      return (
        <span className="exam-icon" title={t('examinations.control_date')}>
          <i className="far fa-calendar-alt"></i>
        </span>
      );
    }
    if (exam.controlDate && isDatePastOrToday(exam.controlDate)) {
      return (
        <span className="exam-icon question" title={t('examinations.confirm_control_date')}>
          <i className="far fa-question-circle"></i>
        </span>
      );
    }
    return null;
  };

  // Replica esatta: ui-block available-widget card
  const renderExamCard = (exam, key) => {
    const pickerOpen = selectedExam === key;

    return (
      <div className="col col-12 col-sm-12 col-md-3" key={key}>
        <div className="ui-block available-widget">
          <div className="h6 title">{exam.label}</div>
          {exam.controlDate && (
            <span className="exam-date-label">{formatDate(exam.controlDate)}</span>
          )}
          {getStatusIcon(exam)}
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
                <a href="#" onClick={(e) => { e.preventDefault(); pickerOpen ? closeDatePicker() : openDatePicker(key, exam); }}>
                  {t('examinations.mark_date')}
                </a>
              </li>
            </ul>
          </div>
        </div>
        {pickerOpen && (
          <div className="inline_calendar">
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
              <button className="btn btn-sm btn-default" onClick={closeDatePicker}>
                {t('examinations.close')}
              </button>
              {pickerDate && isDateFuture(pickerDate) && (
                <button className="btn btn-sm btn-primary" onClick={() => handleSaveDate(exam)}>
                  {t('examinations.save_date')}
                </button>
              )}
              {pickerDate && isDatePastOrToday(pickerDate) && (
                <button className="btn btn-sm btn-primary" onClick={() => handleConfirmExam(exam)}>
                  {t('examinations.confirm_exam')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Caricamento...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#dc3545' }}>{error}</div>;
  }

  return (
    <div>
      {/* Sezione 1: Esami consigliati in base all'età */}
      <div className="row">
        <div className="col col-12 col-sm-12">
          <div className="ui-block">
            <div className="ui-block-title">
              <div className="h6 title" style={{ textTransform: 'uppercase', textAlign: 'center' }}>
                {t('examinations.age_based_title')}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row" style={{ marginBottom: '60px' }}>
        {ageExams.length > 0 ? (
          ageExams.map((exam, i) => renderExamCard(exam, `age-${i}`))
        ) : (
          <div className="col col-12" style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
            {t('examinations.no_age_exams')}
          </div>
        )}
      </div>

      {/* Sezione 2: Esami di routine (solo se presenti) */}
      {routineExams.length > 0 && (
        <>
          <div className="row">
            <div className="col col-12 col-sm-12">
              <div className="ui-block">
                <div className="ui-block-title">
                  <div className="h6 title" style={{ textTransform: 'uppercase', textAlign: 'center' }}>
                    {t('examinations.routine_title')}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row" style={{ marginBottom: '60px' }}>
            {routineExams.map((exam, i) => renderExamCard(exam, `routine-${i}`))}
          </div>
        </>
      )}

      {/* Sezione 3: Esami consigliati in base agli screening */}
      <div className="row">
        <div className="col col-12 col-sm-12">
          <div className="ui-block">
            <div className="ui-block-title">
              <div className="h6 title" style={{ textTransform: 'uppercase', textAlign: 'center' }}>
                {t('examinations.screening_title')}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="accordion-exams">
        <div className="card">
          {screenings.length > 0 ? (
            screenings.map((screening, si) => (
              <React.Fragment key={screening.screeningId}>
                <div className="ui-block-title" role="tab">
                  <div className="h6" style={{ marginBottom: 0 }}>
                    <a
                      href="#"
                      className={screening.archived && !openScreenings[screening.screeningId] ? 'collapsed' : ''}
                      onClick={(e) => { e.preventDefault(); toggleScreening(screening.screeningId); }}
                      aria-expanded={!!openScreenings[screening.screeningId]}
                    >
                      {t('examinations.suggested_exams')} {screening.thematicArea} {t('examinations.of')} {formatDate(screening.insertionDate)}
                      <span className="icons-wrap">
                        <i className="fas fa-angle-down"></i>
                      </span>
                    </a>
                    <span className="f-right">
                      <a
                        href="#"
                        onClick={(e) => handleToggleArchive(screening.screeningId, e)}
                        title={screening.archived ? t('examinations.unarchive') : t('examinations.archive')}
                      >
                        {screening.archived ? (
                          <i className="fas fa-box-open"></i>
                        ) : (
                          <i className="fas fa-archive"></i>
                        )}
                      </a>
                    </span>
                  </div>
                </div>
                {openScreenings[screening.screeningId] && (
                  <div className="row" style={{ marginTop: '10px' }}>
                    {screening.examinations.map((exam, ri) =>
                      renderExamCard(exam, `scr-${screening.screeningId}-${ri}`)
                    )}
                  </div>
                )}
              </React.Fragment>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
              {t('examinations.no_screening_exams')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendedExamList;
