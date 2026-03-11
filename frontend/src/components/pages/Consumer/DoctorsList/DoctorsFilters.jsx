import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Select from '../../../common/FormComponents/Select';
import AutocompleteInput from '../../../common/FormComponents/AutocompleteInput';
import { autocompleteMunicipalities } from '../../../../services/referenceService';
import DoctorsApi from '../../../../services/doctorsApi';

/**
 * DoctorsFilters - REPLICA ESATTA dei filtri dal legacy business_list.xhtml
 * 3 filtri in riga:
 * - Esame (SelectOneMenu)
 * - Patologia (SelectOneMenu)
 * - Città (AutoComplete)
 */
const DoctorsFilters = ({
  filters,
  onFilterChange,
  searchType // 'doctor' o 'clinic' o null (entrambi)
}) => {
  const { t } = useTranslation();
  const [examinations, setExaminations] = useState([]);
  const [pathologies, setPathologies] = useState([]);
  const [loadingExaminations, setLoadingExaminations] = useState(true);
  const [loadingPathologies, setLoadingPathologies] = useState(true);

  // Fetch examinations on mount
  useEffect(() => {
    const fetchExaminations = async () => {
      try {
        setLoadingExaminations(true);
        const data = await DoctorsApi.getExaminations();
        setExaminations(data || []);
      } catch (error) {
        console.error('Error fetching examinations:', error);
        setExaminations([]);
      } finally {
        setLoadingExaminations(false);
      }
    };

    fetchExaminations();
  }, []);

  // Fetch pathologies on mount
  useEffect(() => {
    const fetchPathologies = async () => {
      try {
        setLoadingPathologies(true);
        const data = await DoctorsApi.getPathologies();
        setPathologies(data || []);
      } catch (error) {
        console.error('Error fetching pathologies:', error);
        setPathologies([]);
      } finally {
        setLoadingPathologies(false);
      }
    };

    fetchPathologies();
  }, []);

  // Handle examination change
  const handleExaminationChange = (e) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      examination: value ? parseInt(value, 10) : null
    });
  };

  // Handle pathology change
  const handlePathologyChange = (e) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      pathology: value ? parseInt(value, 10) : null
    });
  };

  // Handle city selection
  const handleCitySelect = (municipality) => {
    if (municipality) {
      onFilterChange({
        ...filters,
        municipalityId: municipality.id,
        municipalityName: municipality.name,
        // Se abbiamo coordinate, usiamo quelle
        lat: municipality.latitude || null,
        lon: municipality.longitude || null
      });
    } else {
      onFilterChange({
        ...filters,
        municipalityId: null,
        municipalityName: null,
        lat: null,
        lon: null
      });
    }
  };

  // Format options for Select component
  const examinationOptions = examinations.map(e => ({
    value: e.id,
    label: e.label
  }));

  const pathologyOptions = pathologies.map(p => ({
    value: p.id,
    label: p.label
  }));

  // Get title based on searchType
  const getTitle = () => {
    if (searchType === 'doctor' || searchType === 3) {
      return `${t('resourceBundle.Find', 'Trova')} ${t('resourceBundle.Doctor', 'Medico')} ${t('resourceBundle.for_prep', 'per')}`;
    }
    if (searchType === 'clinic' || searchType === 4) {
      return `${t('resourceBundle.Find', 'Trova')} ${t('resourceBundle.Specialized_center', 'Centro Specializzato')} ${t('resourceBundle.for_prep', 'per')}`;
    }
    return `${t('resourceBundle.Find', 'Trova')} ${t('resourceBundle.Doctor', 'Medico')} / ${t('resourceBundle.Specialized_center', 'Centro')} ${t('resourceBundle.for_prep', 'per')}`;
  };

  return (
    <div className="ui-block doctors-filters">
      <div className="ui-block-title">
        <h5 className="title">{getTitle()}</h5>
      </div>
      <div className="ui-block-content">
        <div className="row">
          {/* Esame */}
          <div className="col col-md-4 col-sm-12 col-12">
            <label htmlFor="examination">{t('resourceBundle.Examination', 'Esame')}</label>
            <Select
              name="examination"
              value={filters.examination}
              onChange={handleExaminationChange}
              options={examinationOptions}
              placeholder={loadingExaminations
                ? t('resourceBundle.Loading', 'Caricamento...')
                : t('resourceBundle.All_mascouline', 'Tutti')}
              disabled={loadingExaminations}
              className="filter-select"
            />
          </div>

          {/* Patologia */}
          <div className="col col-md-4 col-sm-12 col-12">
            <label htmlFor="pathology">{t('resourceBundle.Pathology', 'Patologia')}</label>
            <Select
              name="pathology"
              value={filters.pathology}
              onChange={handlePathologyChange}
              options={pathologyOptions}
              placeholder={loadingPathologies
                ? t('resourceBundle.Loading', 'Caricamento...')
                : t('resourceBundle.All_feminine', 'Tutte')}
              disabled={loadingPathologies}
              className="filter-select"
            />
          </div>

          {/* Città */}
          <div className="col col-md-4 col-sm-12 col-12">
            <label htmlFor="city">{t('resourceBundle.City', 'Città')}</label>
            <AutocompleteInput
              name="city"
              value={filters.municipalityName ? { name: filters.municipalityName, id: filters.municipalityId } : null}
              onSelect={handleCitySelect}
              fetchSuggestions={autocompleteMunicipalities}
              placeholder={`${t('resourceBundle.City', 'Città')}* (${t('resourceBundle.select', 'seleziona')})`}
              minQueryLength={3}
              queryDelay={800}
              getItemLabel={(item) => `${item.name}${item.provincialCode ? ` - ${item.provincialCode}` : ''}`}
              getItemValue={(item) => item}
              className="filter-autocomplete"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorsFilters;
