import React from 'react';
import './Select.css';

/**
 * Select - Reusable select dropdown component
 * Replicates p:selectOneMenu from PrimeFaces
 */
const Select = ({
  name,
  value,
  onChange,
  options,
  placeholder = '---',
  required = false,
  disabled = false,
  className = ''
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange({
        target: {
          name,
          value: e.target.value === '' ? null : e.target.value
        }
      });
    }
  };

  return (
    <select
      name={name}
      value={value !== null && value !== undefined ? value : ''}
      onChange={handleChange}
      required={required}
      disabled={disabled}
      className={`select-input ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((option, index) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
