import React from 'react';

/**
 * QuestionItem - REPLICA ESATTA del rendering di una domanda in advanced_screening.xhtml
 * Gestisce:
 * - Domande yes/no (radio button)
 * - Domande select (dropdown)
 * - Sotto-domande condizionali
 */
const QuestionItem = ({
  question,
  questionIndex,
  taIndex,
  thematicArea,
  onAnswerChange,
  onSelectAnswerChange,
  validationErrors
}) => {
  const errorKey = `q_${questionIndex}`;
  const hasError = validationErrors[errorKey];

  // Check if sub-questions should be shown
  const shouldShowSubQuestions = () => {
    if (!question.protocol_rules || question.protocol_rules.length === 0) {
      return false;
    }

    return question.protocol_rules.some(
      pr => pr.has_sub_question &&
           pr.answer === question.given_answer &&
           pr.thematic_area_id === thematicArea.id &&
           question.sub_questions &&
           question.sub_questions.length > 0
    );
  };

  const handleRadioChange = (value) => {
    console.log(`[QuestionItem] Radio changed for question ${question.id} (${question.question}):`, value);
    onAnswerChange(taIndex, questionIndex, value, false, null);
  };

  const handleSubRadioChange = (subQuestionIndex, value) => {
    onAnswerChange(taIndex, questionIndex, value, true, subQuestionIndex);
  };

  const handleSubSelectChange = (subQuestionIndex, value) => {
    onSelectAnswerChange(taIndex, questionIndex, value, true, subQuestionIndex);
  };

  // Parse question values for select type questions
  const getQuestionValues = (questionValuesString) => {
    if (!questionValuesString) return [];
    return questionValuesString.split(';').map(val => val.trim()).filter(val => val);
  };

  return (
    <li className="nav-item question-item">
      {/* Main Question */}
      <label htmlFor={`answer-${questionIndex}`} className="question-label">
        {question.question}
        {hasError && <span className="error-text"> *</span>}
      </label>

      {/* Yes/No Radio Buttons - REPLICA ESATTA */}
      {(!question.type_question || question.type_question === 'yes_or_no') && (
        <div className="radio-group" id={`answer-${questionIndex}`}>
          <label className="radio-label">
            <input
              type="radio"
              name={`question-${taIndex}-${questionIndex}`}
              value="1"
              checked={question.given_answer === 1}
              onChange={() => handleRadioChange(1)}
            />
            <span>Sì</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name={`question-${taIndex}-${questionIndex}`}
              value="-1"
              checked={question.given_answer === -1}
              onChange={() => handleRadioChange(-1)}
            />
            <span>No</span>
          </label>
        </div>
      )}

      {/* Select Dropdown - REPLICA ESATTA */}
      {question.type_question === 'select' && (
        <div className="select-group">
          <select
            className="form-control noform-group"
            value={question.given_answer_string || ''}
            onChange={(e) => onSelectAnswerChange(taIndex, questionIndex, e.target.value, false, null)}
          >
            <option value="">Seleziona...</option>
            {getQuestionValues(question.question_values).map((val, idx) => (
              <option key={idx} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sub-Questions - REPLICA ESATTA della logica condizionale */}
      {shouldShowSubQuestions() && (
        <ol className="sub-questions">
          {question.sub_questions.map((subQuestion, subIdx) => {
            const subErrorKey = `q_${questionIndex}_sq_${subIdx}`;
            const subHasError = validationErrors[subErrorKey];

            return (
              <li key={subQuestion.id} className="nav-item sub-question-item">
                <label className="question-label">
                  {subQuestion.question}
                  {subHasError && <span className="error-text"> *</span>}
                </label>

                {/* Sub-Question Yes/No */}
                {(!subQuestion.type_question || subQuestion.type_question === 'yes_or_no') && (
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name={`sub-question-${taIndex}-${questionIndex}-${subIdx}`}
                        value="1"
                        checked={subQuestion.given_answer === 1}
                        onChange={() => handleSubRadioChange(subIdx, 1)}
                      />
                      <span>Sì</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name={`sub-question-${taIndex}-${questionIndex}-${subIdx}`}
                        value="-1"
                        checked={subQuestion.given_answer === -1}
                        onChange={() => handleSubRadioChange(subIdx, -1)}
                      />
                      <span>No</span>
                    </label>
                  </div>
                )}

                {/* Sub-Question Select */}
                {subQuestion.type_question === 'select' && (
                  <div className="select-group">
                    <select
                      className="form-control noform-group"
                      value={subQuestion.given_answer_string || ''}
                      onChange={(e) => handleSubSelectChange(subIdx, e.target.value)}
                    >
                      <option value="">Seleziona...</option>
                      {getQuestionValues(subQuestion.question_values).map((val, idx) => (
                        <option key={idx} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {hasError && <div className="error-message">{hasError}</div>}
    </li>
  );
};

export default QuestionItem;
