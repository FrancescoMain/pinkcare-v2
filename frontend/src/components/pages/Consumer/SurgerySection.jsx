import React from 'react';
import { RadioGroup } from '../../common/FormComponents';
import './SurgerySection.css';

/**
 * SurgerySection - REPLICA ESATTA della sezione interventi chirurgici
 * Accordion collassabile con radio "Sì/No" e sotto-sezioni
 * Replica comportamento di consumer_form.xhtml lines 244-296
 */
const SurgerySection = ({ surgeries, onChange }) => {

  const handleSurgeryExecutedChange = (index, executed) => {
    const newSurgeries = [...surgeries];
    newSurgeries[index] = { ...newSurgeries[index], executed };
    onChange(newSurgeries);
  };

  const handleSurgeryDescriptionChange = (index, description) => {
    const newSurgeries = [...surgeries];
    newSurgeries[index] = { ...newSurgeries[index], description };
    onChange(newSurgeries);
  };

  const handleSubSurgeryChange = (parentIndex, subIndex, executed) => {
    const newSurgeries = [...surgeries];
    const children = [...(newSurgeries[parentIndex].children || [])];
    children[subIndex] = { ...children[subIndex], executed };
    newSurgeries[parentIndex] = { ...newSurgeries[parentIndex], children };
    onChange(newSurgeries);
  };

  if (!surgeries || surgeries.length === 0) {
    return (
      <div className="surgery-section">
        <p className="no-surgeries">Nessun intervento chirurgico disponibile</p>
      </div>
    );
  }

  return (
    <div className="surgery-section">
      {surgeries.map((surgery, index) => (
        <div
          key={surgery.id || index}
          className={`parent-panel ${surgery.executed ? 'open' : ''}`}
        >
          {/* Surgery Header with Yes/No Radio */}
          <div className="ui-block-title">
            <div className="h6">
              <span className="surgery-label">
                {surgery.surgery?.label}
                {surgery.surgery?.labelInfo && (
                  <i
                    className="fas fa-info info-icon"
                    title={surgery.surgery.labelInfo}
                  />
                )}
              </span>
              <RadioGroup
                name={`surgery_executed_${index}`}
                value={surgery.executed}
                onChange={(e) => handleSurgeryExecutedChange(index, e.target.value)}
                options={[
                  { value: true, label: 'Sì' },
                  { value: false, label: 'No' }
                ]}
              />
            </div>
          </div>

          {/* Collapsible Content - shown when executed === true */}
          {surgery.executed && (
            <div className="content-animation">
              <div style={{ marginTop: '10px' }}>
                {/* Open answer text area (for surgeries with open_answer = true) */}
                {surgery.surgery?.openAnswer && (
                  <div className="form-group label-floating" style={{ width: '100%' }}>
                    <textarea
                      value={surgery.description || ''}
                      onChange={(e) => handleSurgeryDescriptionChange(index, e.target.value)}
                      className="form-control"
                      rows="3"
                      placeholder="Descrizione..."
                    />
                  </div>
                )}

                {/* Sub-surgeries checkboxes (for surgeries with open_answer = false) */}
                {!surgery.surgery?.openAnswer && surgery.children && surgery.children.length > 0 && (
                  <div className="row">
                    {surgery.children.map((subSurgery, subIndex) => (
                      <div
                        key={subSurgery.id || subIndex}
                        className="col col-12 col-sm-12 col-md-6 col-lg-4"
                      >
                        <div className="ui-block available-widget">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={subSurgery.executed || false}
                              onChange={(e) => handleSubSurgeryChange(index, subIndex, e.target.checked)}
                            />
                            <h6 className="sub-surgery-label">
                              {subSurgery.surgery?.label}
                              {subSurgery.surgery?.labelInfo && (
                                <i
                                  className="fas fa-info-circle info-icon"
                                  title={subSurgery.surgery.labelInfo}
                                />
                              )}
                            </h6>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SurgerySection;
