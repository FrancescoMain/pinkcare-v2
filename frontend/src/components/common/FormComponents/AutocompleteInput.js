import React, { useState, useEffect, useRef } from 'react';
import './AutocompleteInput.css';

/**
 * AutocompleteInput - Reusable autocomplete component
 * Replicates p:autoComplete behavior from PrimeFaces
 */
const AutocompleteInput = ({
  name,
  value,
  onChange,
  onSelect,
  fetchSuggestions,
  placeholder,
  required,
  minQueryLength = 3,
  queryDelay = 800,
  renderItem,
  getItemLabel,
  getItemValue,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const timeoutRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize query from value
  useEffect(() => {
    if (value) {
      const label = getItemLabel ? getItemLabel(value) : value.name || value;
      setQuery(label);
    }
  }, [value, getItemLabel]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedIndex(-1);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't search if query is too short
    if (newQuery.length < minQueryLength) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Debounce search
    timeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const results = await fetchSuggestions(newQuery);
        setSuggestions(results);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, queryDelay);
  };

  const handleItemSelect = (item) => {
    const label = getItemLabel ? getItemLabel(item) : item.name || item;
    setQuery(label);
    setShowDropdown(false);
    setSuggestions([]);

    if (onSelect) {
      onSelect(item);
    }

    if (onChange) {
      onChange({
        target: {
          name,
          value: getItemValue ? getItemValue(item) : item
        }
      });
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleItemSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
      default:
        break;
    }
  };

  const handleDropdownToggle = () => {
    if (query.length >= minQueryLength) {
      setShowDropdown(!showDropdown);
    }
  };

  return (
    <div className={`autocomplete-wrapper ${className}`}>
      <div className="autocomplete-input-group">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className="autocomplete-input"
          autoComplete="off"
        />
        <button
          type="button"
          className="autocomplete-dropdown-btn"
          onClick={handleDropdownToggle}
          tabIndex="-1"
        >
          <i className={`fa fa-chevron-${showDropdown ? 'up' : 'down'}`}></i>
        </button>
      </div>

      {loading && (
        <div className="autocomplete-loading">
          <i className="fa fa-spinner fa-spin"></i>
        </div>
      )}

      {showDropdown && suggestions.length > 0 && (
        <div ref={dropdownRef} className="autocomplete-dropdown">
          <ul className="autocomplete-suggestions">
            {suggestions.map((item, index) => (
              <li
                key={index}
                className={`autocomplete-suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleItemSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {renderItem ? renderItem(item) : (getItemLabel ? getItemLabel(item) : item.name || item)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showDropdown && !loading && suggestions.length === 0 && query.length >= minQueryLength && (
        <div ref={dropdownRef} className="autocomplete-dropdown">
          <div className="autocomplete-no-results">Nessun risultato trovato</div>
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
