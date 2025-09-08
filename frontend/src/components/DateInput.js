import React, { useState, useRef } from 'react';

const DateInput = ({ name, value, onChange, placeholder, className, required }) => {
  const [displayValue, setDisplayValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  // Convert ISO date (YYYY-MM-DD) to DD/MM/YYYY format
  const formatToDisplay = (isoDate) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  // Convert DD/MM/YYYY to ISO date (YYYY-MM-DD)
  const formatToISO = (displayDate) => {
    if (!displayDate) return '';
    const cleanDate = displayDate.replace(/[^\d]/g, '');
    if (cleanDate.length === 8) {
      const day = cleanDate.substring(0, 2);
      const month = cleanDate.substring(2, 4);
      const year = cleanDate.substring(4, 8);
      
      // Validate date
      const date = new Date(year, month - 1, day);
      const isValid = date.getFullYear() == year && 
                     date.getMonth() == month - 1 && 
                     date.getDate() == day;
      
      if (isValid) {
        return `${year}-${month}-${day}`;
      }
    }
    return '';
  };

  // Auto-format as user types
  const formatDisplay = (input) => {
    const numbers = input.replace(/[^\d]/g, '');
    let formatted = '';
    
    if (numbers.length > 0) {
      formatted += numbers.substring(0, 2);
    }
    if (numbers.length > 2) {
      formatted += '/' + numbers.substring(2, 4);
    }
    if (numbers.length > 4) {
      formatted += '/' + numbers.substring(4, 8);
    }
    
    return formatted;
  };

  // Initialize display value from prop
  React.useEffect(() => {
    if (value) {
      setDisplayValue(formatToDisplay(value));
    }
  }, [value]);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    const formatted = formatDisplay(inputValue);
    setDisplayValue(formatted);
    
    // If we have a complete date (DD/MM/YYYY), convert to ISO and call onChange
    if (formatted.length === 10) {
      const isoDate = formatToISO(formatted);
      if (isoDate) {
        onChange({
          target: {
            name,
            value: isoDate,
            type: 'date'
          }
        });
      }
    } else if (formatted.length === 0) {
      // Empty field
      onChange({
        target: {
          name,
          value: '',
          type: 'date'
        }
      });
    }
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
    // Validate final date on blur
    if (displayValue.length === 10) {
      const isoDate = formatToISO(displayValue);
      if (!isoDate) {
        // Invalid date, clear it
        setDisplayValue('');
        onChange({
          target: {
            name,
            value: '',
            type: 'date'
          }
        });
      }
    }
  };

  const handleKeyDown = (e) => {
    // Allow: backspace, delete, tab, escape, enter, and decimal point
    if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      return;
    }
    
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
    
    // Limit to 10 characters (DD/MM/YYYY)
    if (displayValue.length >= 10 && ![46, 8].includes(e.keyCode)) {
      e.preventDefault();
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={focused ? 'DD/MM/YYYY' : placeholder}
        className={`${className} date-input-custom`}
        required={required}
        maxLength={10}
      />
      <div className="date-format-hint">DD/MM/YYYY</div>
    </div>
  );
};

export default DateInput;