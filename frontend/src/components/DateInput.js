import React, { useState } from 'react';
import './DateInput.css';

/**
 * DateInput component with native HTML5 date picker
 * Supports both text input (DD/MM/YYYY) and native calendar picker
 */
const DateInput = ({ name, value, onChange, placeholder, className, required }) => {
  const [inputMode, setInputMode] = useState('date'); // 'date' or 'text'
  const [textValue, setTextValue] = useState('');

  // Convert ISO date (YYYY-MM-DD) to DD/MM/YYYY format for display
  const formatToDisplay = (isoDate) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  // Convert DD/MM/YYYY to ISO date (YYYY-MM-DD)
  const formatToISO = (displayDate) => {
    if (!displayDate) return '';
    const parts = displayDate.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (day && month && year && year.length === 4) {
        // Validate date
        const date = new Date(year, month - 1, day);
        const isValid = date.getFullYear() == year &&
                       date.getMonth() == month - 1 &&
                       date.getDate() == day;

        if (isValid) {
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }
    return '';
  };

  const handleDateChange = (e) => {
    // Handle native date input (returns YYYY-MM-DD format)
    const isoDate = e.target.value;
    onChange({
      target: {
        name,
        value: isoDate,
        type: 'date'
      }
    });
  };

  const handleTextChange = (e) => {
    const inputValue = e.target.value;
    setTextValue(inputValue);

    // Try to parse DD/MM/YYYY format
    const isoDate = formatToISO(inputValue);
    if (isoDate) {
      onChange({
        target: {
          name,
          value: isoDate,
          type: 'date'
        }
      });
    }
  };

  // Calculate min and max dates for birthday (e.g., 18-100 years old)
  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinDate = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 125);
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="date-input-wrapper">
      {/* Native HTML5 date input with calendar picker */}
      <input
        type="date"
        name={name}
        value={value || ''}
        onChange={handleDateChange}
        className={`${className} date-input-calendar`}
        required={required}
        min={getMinDate()}
        max={getMaxDate()}
        placeholder={placeholder}
        title={placeholder}
      />

      {/* Icon to indicate calendar is available */}
      <span className="calendar-icon" aria-hidden="true">
        <i className="fa fa-calendar"></i>
      </span>
    </div>
  );
};

export default DateInput;