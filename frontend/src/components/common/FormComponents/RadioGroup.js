import React from 'react';
import './RadioGroup.css';

/**
 * RadioGroup - Reusable radio button group component
 * Replicates p:selectOneRadio from PrimeFaces
 */
const RadioGroup = ({
  name,
  value,
  onChange,
  options,
  disabled = false,
  className = '',
  inline = true
}) => {
  const handleChange = (optionValue) => {
    if (disabled) return;

    if (onChange) {
      onChange({
        target: {
          name,
          value: optionValue
        }
      });
    }
  };

  return (
    <div className={`radio-group ${inline ? 'inline' : 'vertical'} ${className}`}>
      {options.map((option, index) => (
        <label
          key={index}
          className={`radio-option ${disabled ? 'disabled' : ''} ${value === option.value ? 'checked' : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => handleChange(option.value)}
            disabled={disabled}
          />
          <span className="radio-label">{option.label}</span>
        </label>
      ))}
    </div>
  );
};

export default RadioGroup;
