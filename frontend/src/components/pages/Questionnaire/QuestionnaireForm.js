import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  initializeScreening,
  elaborateScreening,
  elaborateAllScreening
} from '../../../services/questionnaireService';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import QuestionItem from './QuestionItem';
import './Questionnaire.css';

/**
 * QuestionnaireForm - REPLICA ESATTA del form advanced_screening.xhtml
 * Gestisce le domande del questionario con sotto-domande condizionali
 */
const QuestionnaireForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showErrorMessage, showSuccessMessage } = useErrorHandler();

  const [screeningType, setScreeningType] = useState(null);
  const [thematicAreas, setThematicAreas] = useState([]);
  const [selectedTaIndex, setSelectedTaIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [nothingSuggested, setNothingSuggested] = useState(1);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const type = parseInt(searchParams.get('type'));
    if (!type) {
      navigate('/consumer?tab=3');
      return;
    }
    setScreeningType(type);
    loadScreeningQuestions(type);
  }, [searchParams]);

  const loadScreeningQuestions = async (type) => {
    try {
      setLoading(true);
      const result = await initializeScreening(type);
      setThematicAreas(result.thematicAreas);
      console.log('[QuestionnaireForm] Loaded thematic areas:', result.thematicAreas);
    } catch (error) {
      console.error('Error loading screening questions:', error);
      showErrorMessage('Errore', 'Impossibile caricare le domande del questionario');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (taIndex, questionIndex, value, isSubQuestion = false, subQuestionIndex = null) => {
    console.log(`[QuestionnaireForm] handleAnswerChange called - taIndex: ${taIndex}, questionIndex: ${questionIndex}, value: ${value}, isSubQuestion: ${isSubQuestion}`);

    setThematicAreas(prevAreas => {
      const newAreas = JSON.parse(JSON.stringify(prevAreas)); // Deep copy

      if (isSubQuestion) {
        newAreas[taIndex].screening_questions[questionIndex].sub_questions[subQuestionIndex].given_answer = value;
        console.log(`[QuestionnaireForm] Updated sub-question answer to:`, value);
      } else {
        newAreas[taIndex].screening_questions[questionIndex].given_answer = value;
        console.log(`[QuestionnaireForm] Updated main question answer to:`, value);
      }

      return newAreas;
    });
  };

  const handleSelectAnswerChange = (taIndex, questionIndex, value, isSubQuestion = false, subQuestionIndex = null) => {
    setThematicAreas(prevAreas => {
      const newAreas = JSON.parse(JSON.stringify(prevAreas)); // Deep copy

      if (isSubQuestion) {
        newAreas[taIndex].screening_questions[questionIndex].sub_questions[subQuestionIndex].given_answer_string = value;
      } else {
        newAreas[taIndex].screening_questions[questionIndex].given_answer_string = value;
      }

      return newAreas;
    });
  };

  const validateThematicArea = (taIndex) => {
    const ta = thematicAreas[taIndex];
    const errors = {};

    ta.screening_questions.forEach((question, qIndex) => {
      if (question.given_answer === null || question.given_answer === undefined) {
        errors[`q_${qIndex}`] = `Devi rispondere alla domanda numero ${qIndex + 1}`;
      }

      // Validate sub-questions if they are visible
      if (question.sub_questions && question.sub_questions.length > 0) {
        const shouldShowSubQuestions = question.protocol_rules?.some(
          pr => pr.has_sub_question && pr.answer === question.given_answer
        );

        if (shouldShowSubQuestions) {
          question.sub_questions.forEach((subQ, sqIndex) => {
            if (subQ.type_question === 'select') {
              if (!subQ.given_answer_string) {
                errors[`q_${qIndex}_sq_${sqIndex}`] = `Devi rispondere alla domanda numero ${qIndex + 1}.${sqIndex + 1}`;
              }
            } else {
              if (subQ.given_answer === null || subQ.given_answer === undefined) {
                errors[`q_${qIndex}_sq_${sqIndex}`] = `Devi rispondere alla domanda numero ${qIndex + 1}.${sqIndex + 1}`;
              }
            }
          });
        }
      }
    });

    return errors;
  };

  const handleSaveSingle = async (taIndex) => {
    try {
      // Validate
      const errors = validateThematicArea(taIndex);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        showErrorMessage('Errore', Object.values(errors)[0]);
        return;
      }

      setValidationErrors({});

      const ta = thematicAreas[taIndex];
      console.log('[QuestionnaireForm] Saving single thematic area:', ta);
      console.log('[QuestionnaireForm] Screening questions being sent:', JSON.stringify(ta.screening_questions.map(q => ({
        id: q.id,
        question: q.question,
        given_answer: q.given_answer,
        given_answer_string: q.given_answer_string
      })), null, 2));

      const result = await elaborateScreening(ta.id, ta.screening_questions, screeningType);

      setNothingSuggested(result.nothingSuggested);
      setShowSuccessDialog(true);

      console.log('[QuestionnaireForm] Screening saved, suggested examinations:', result.suggestedExaminations);
    } catch (error) {
      console.error('Error saving screening:', error);
      showErrorMessage('Errore', 'Impossibile salvare lo screening');
    }
  };

  const handleSaveAll = async () => {
    try {
      // Validate all thematic areas
      let hasErrors = false;
      const allErrors = {};

      thematicAreas.forEach((ta, taIndex) => {
        const errors = validateThematicArea(taIndex);
        if (Object.keys(errors).length > 0) {
          hasErrors = true;
          Object.assign(allErrors, errors);
        }
      });

      if (hasErrors) {
        setValidationErrors(allErrors);
        showErrorMessage('Errore', Object.values(allErrors)[0]);
        return;
      }

      setValidationErrors({});

      console.log('[QuestionnaireForm] Saving all thematic areas');

      // Debug: Log thematic areas with sub-questions
      thematicAreas.forEach((ta, taIndex) => {
        console.log(`[QuestionnaireForm] TA ${taIndex} (${ta.label}):`, ta.screening_questions.map(q => ({
          id: q.id,
          question: q.question,
          given_answer: q.given_answer,
          sub_questions: q.sub_questions?.map(sq => ({
            id: sq.id,
            question: sq.question,
            given_answer: sq.given_answer,
            given_answer_string: sq.given_answer_string
          }))
        })));
      });

      const result = await elaborateAllScreening(thematicAreas);

      setNothingSuggested(result.nothingSuggested);
      setShowSuccessDialog(true);

      console.log('[QuestionnaireForm] All screenings saved, suggested examinations:', result.suggestedExaminations);
    } catch (error) {
      console.error('Error saving all screenings:', error);
      showErrorMessage('Errore', 'Impossibile salvare gli screening');
    }
  };

  const handleStayHere = () => {
    setShowSuccessDialog(false);
    // Reinitialize screening
    loadScreeningQuestions(screeningType);
  };

  const handleGoToResults = () => {
    navigate('/consumer?tab=2');
  };

  if (loading) {
    return (
      <div className="questionnaire-form">
        <div className="loading">Caricamento domande...</div>
      </div>
    );
  }

  if (!thematicAreas || thematicAreas.length === 0) {
    return (
      <div className="questionnaire-form">
        <div className="no-questions">Nessuna domanda disponibile per questo tipo di screening.</div>
      </div>
    );
  }

  return (
    <div className="questionnaire-form">
      <div className="ui-block">
        <div className="ui-block-content">
          <div id="accordion" role="tablist" aria-multiselectable="true" className="accordion-exams">
            <div className="card">
              {thematicAreas.map((ta, taIndex) => (
                <div key={ta.id} className="thematic-area-section">
                  {/* Thematic Area Header */}
                  <div
                    className="ui-block-title"
                    role="tab"
                    id={`heading-${taIndex}`}
                  >
                    <div className="h6">
                      <a
                        data-toggle="collapse"
                        data-parent="#accordion"
                        href={`#collapse-${taIndex}`}
                        aria-expanded={selectedTaIndex === taIndex}
                        aria-controls={`collapse-${taIndex}`}
                        className={selectedTaIndex !== taIndex ? 'collapsed' : ''}
                        onClick={() => setSelectedTaIndex(taIndex)}
                      >
                        {ta.label}
                        <span className="icons-wrap">
                          <i className="fas fa-angle-down" />
                        </span>
                      </a>
                    </div>
                  </div>

                  {/* Thematic Area Content */}
                  <div
                    id={`collapse-${taIndex}`}
                    role="tabpanel"
                    aria-labelledby={`heading-${taIndex}`}
                    className={`collapse ${selectedTaIndex === taIndex ? 'show' : ''}`}
                  >
                    <div className="row">
                      <div className="col col-12 col-sm-12 col-md-8">
                        <ol>
                          {ta.screening_questions && ta.screening_questions.map((question, qIndex) => (
                            <QuestionItem
                              key={question.id}
                              question={question}
                              questionIndex={qIndex}
                              taIndex={taIndex}
                              thematicArea={ta}
                              onAnswerChange={handleAnswerChange}
                              onSelectAnswerChange={handleSelectAnswerChange}
                              validationErrors={validationErrors}
                            />
                          ))}
                        </ol>
                      </div>
                      <div className="col col-12 col-sm-12 col-md-4" style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                          className="btn-questionario "
                          onClick={() => handleSaveSingle(taIndex)}
                        >
                          Salva e visualizza risultati
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save All Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 15px' }}>
        <button
          className="btn-questionario "
          onClick={handleSaveAll}
        >
          Salva tutto e visualizza risultati
        </button>
      </div>

      {/* Success Dialog - REPLICA ESATTA del p:dialog del legacy */}
      {showSuccessDialog && (
        <div className="dialog-overlay">
          <div className="dialog pnl-dlg">
            <div className="dialog-header">
              <h5>Operazione completata con successo</h5>
            </div>
            <div className="dialog-body">
              <button
                className="btn-questionario"
                onClick={handleStayHere}
              >
                Rimani qui
              </button>
              {nothingSuggested === -1 && (
                <button
                  className="btn-questionario "
                  onClick={handleGoToResults}
                  style={{ marginLeft: '10px' }}
                >
                  Vai alla pagina dei risultati
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionnaireForm;
