import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getConsumerData, updateConsumerForm, downloadClinicalHistoryPDF } from '../../../services/clinicalHistoryApi';
import { autocompleteMunicipalities } from '../../../services/referenceService';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { useGrowl } from '../../../hooks/useGrowl';
import DateInput from '../../DateInput';
import { AutocompleteInput, RadioGroup, Select } from '../../common/FormComponents';
import SurgerySection from './SurgerySection';
import './MedicalHistoryForm.css';

/**
 * ClinicalHistoryForm - REPLICA ESATTA di consumer_form.xhtml
 * Form completo per la storia clinica dell'utente
 */
const MedicalHistoryForm = () => {
  const { user } = useAuth();
  const { showErrorMessage } = useErrorHandler();
  const { showSuccessMessage } = useGrowl();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    representative: {
      name: '',
      surname: '',
      birthday: '',
      birthPlace: null,
      gender: false, // false = F, true = M
      email: '',
      weight: null,
      height: null,
      sedentaryLifestyle: null,
      ageFirstMenstruation: null,
      regularityMenstruation: null,
      durationPeriod: null,
      durationMenstruation: null,
      medicine: ''
    },
    address: {
      streetType: null,
      street: '',
      streetNumber: '',
      municipality: null,
      province: '',
      postCode: ''
    },
    gravidanceTypes: [],
    surgeries: []
  });

  const [pregnanciesNumber, setPregnanciesNumber] = useState(0);

  // Load consumer data
  const loadConsumerData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch consumer data (teamId is obtained from authenticated user in backend)
      const response = await getConsumerData();

      // response is {success: true, data: {consumer, surgeries, pregnancyStats}}
      if (!response || !response.data) {
        throw new Error('Invalid response structure');
      }

      const { consumer, surgeries, pregnancyStats } = response.data;

      // Convert birthday from ISO format to YYYY-MM-DD for date input
      const representative = consumer.representative ? { ...consumer.representative } : {};
      if (representative.birthday) {
        // Handle both ISO string and Date object
        const date = new Date(representative.birthday);
        if (!isNaN(date.getTime())) {
          representative.birthday = date.toISOString().split('T')[0];
        }
      }

      setFormData({
        representative,
        address: consumer.address ? { ...consumer.address } : {},
        gravidanceTypes: consumer.representative?.gravidanceTypes || [],
        surgeries: surgeries || []
      });

      // Calculate pregnancies number
      const totalPregnancies = (pregnancyStats?.natural || 0) +
                             (pregnancyStats?.cesarean || 0) +
                             (pregnancyStats?.abortion || 0);
      setPregnanciesNumber(totalPregnancies);

    } catch (error) {
      console.error('Error loading consumer data:', error);
      showErrorMessage('Errore', 'Impossibile caricare i dati della storia clinica');
    } finally {
      setLoading(false);
    }
  }, [showErrorMessage]);

  useEffect(() => {
    loadConsumerData();
  }, [loadConsumerData]);

  // Handle input changes
  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle municipality selection
  const handleMunicipalitySelect = (municipality, field) => {
    if (field === 'birthPlace') {
      handleInputChange('representative', 'birthPlace', municipality);
    } else {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          municipality: municipality?.name || '',
          province: municipality?.province || ''
        }
      }));
    }
  };

  // Handle pregnancies number change
  const handlePregnanciesNumberChange = (e) => {
    const num = parseInt(e.target.value) || 0;
    setPregnanciesNumber(num);

    // Create gravidanceTypes array
    const newGravidanceTypes = Array.from({ length: num }, (_, i) => {
      const existing = formData.gravidanceTypes[i];
      return existing || { natur: 'nat' }; // Default to 'nat' (natural)
    });

    setFormData(prev => ({
      ...prev,
      gravidanceTypes: newGravidanceTypes
    }));
  };

  // Handle gravidance type change
  const handleGravidanceTypeChange = (index, value) => {
    const newGravidanceTypes = [...formData.gravidanceTypes];
    newGravidanceTypes[index] = { ...newGravidanceTypes[index], natur: value };
    setFormData(prev => ({
      ...prev,
      gravidanceTypes: newGravidanceTypes
    }));
  };

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);

      await updateConsumerForm(formData);
      showSuccessMessage('Operazione eseguita con successo');
      await loadConsumerData(); // Reload data
    } catch (error) {
      console.error('Error saving consumer data:', error);
      showErrorMessage('Errore', 'Impossibile salvare i dati');
    } finally {
      setSaving(false);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    try {
      const pdfBlob = await downloadClinicalHistoryPDF();

      console.log('PDF Blob received:', pdfBlob, 'type:', pdfBlob.type, 'size:', pdfBlob.size);

      // Use the blob directly - it already has the correct type from the response
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${formData.representative?.name || 'utente'}_${formData.representative?.surname || ''}_storia_clinica.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccessMessage('PDF scaricato con successo');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showErrorMessage('Errore', 'Impossibile scaricare il PDF');
    }
  };

  // Street types options (from legacy)
  const streetTypes = [
    { value: 'Via', label: 'Via' },
    { value: 'Piazza', label: 'Piazza' },
    { value: 'Corso', label: 'Corso' },
    { value: 'Viale', label: 'Viale' },
    { value: 'Largo', label: 'Largo' },
    { value: 'Contrada', label: 'Contrada' },
    { value: 'Vicolo', label: 'Vicolo' },
    { value: 'Circonvallazione', label: 'Circonvallazione' },
    { value: 'Galleria', label: 'Galleria' },
    { value: 'Parco', label: 'Parco' },
    { value: 'Rotonda', label: 'Rotonda' },
    { value: 'Traversa', label: 'Traversa' },
    { value: 'Lungomare', label: 'Lungomare' },
    { value: 'Strada', label: 'Strada' },
    { value: 'Stretto', label: 'Stretto' },
    { value: 'SC', label: 'SC' },
    { value: 'SP', label: 'SP' },
    { value: 'SR', label: 'SR' },
    { value: 'SS', label: 'SS' }
  ];

  if (loading) {
    return (
      <div className="medical-history-form">
        <div className="loading">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="medical-history-form">
      <div className="ui-block">
        <div className="ui-block-title">
          <h5 className="title">Storia Clinica</h5>
          <button
            type="button"
            className="btn-download-pdf"
            onClick={handleDownloadPDF}
            title="Scarica PDF Storia Clinica"
          >
            <img
              src="/styles/olympus/assets/images/pinkcare_icon.png"
              alt="Scarica PDF"
              className="immages_bow"
            />
          </button>
        </div>
        <div className="ui-block-content">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>

            {/* Personal Data Section */}
            <div className="form-row">
              <div className="form-group col-md-6">
                <label htmlFor="first_name">Nome</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.representative.name || ''}
                  onChange={(e) => handleInputChange('representative', 'name', e.target.value)}
                  required
                  className="form-control"
                />
              </div>
              <div className="form-group col-md-6">
                <label htmlFor="last_name">Cognome</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.representative.surname || ''}
                  onChange={(e) => handleInputChange('representative', 'surname', e.target.value)}
                  required
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group col-md-6">
                <label htmlFor="birthday">Data di Nascita</label>
                <DateInput
                  name="birthday"
                  value={formData.representative.birthday || ''}
                  onChange={(e) => handleInputChange('representative', 'birthday', e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className="form-control"
                />
              </div>
              <div className="form-group col-md-6">
                <label htmlFor="birth_place">Luogo di Nascita</label>
                <AutocompleteInput
                  name="birth_place"
                  value={formData.representative.birthPlace}
                  onSelect={(item) => handleMunicipalitySelect(item, 'birthPlace')}
                  fetchSuggestions={autocompleteMunicipalities}
                  placeholder="Città (seleziona)"
                  getItemLabel={(item) => {
                    // Handle both object and string values
                    if (!item) return '';
                    if (typeof item === 'string') return item;
                    return `${item.name} ${item.province ? '- ' + item.province : ''}`;
                  }}
                  minQueryLength={3}
                  queryDelay={800}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group col-md-6">
                <label>Sesso</label>
                <RadioGroup
                  name="gender"
                  value={formData.representative.gender}
                  onChange={(e) => handleInputChange('representative', 'gender', e.target.value)}
                  options={[
                    { value: false, label: 'F' },
                    { value: true, label: 'M' }
                  ]}
                />
              </div>
              <div className="form-group col-md-6">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.representative.email || ''}
                  onChange={(e) => handleInputChange('representative', 'email', e.target.value)}
                  className="form-control"
                />
              </div>
            </div>

            {/* Residence Section */}
            <h5 className="title mt-4">Residenza</h5>
            <div className="form-row">
              <div className="form-group col-md-3">
                <label htmlFor="street_type">Tipo Strada</label>
                <Select
                  name="street_type"
                  value={formData.address.streetType}
                  onChange={(e) => handleInputChange('address', 'streetType', e.target.value)}
                  options={streetTypes}
                  required
                />
              </div>
              <div className="form-group col-md-6">
                <label htmlFor="street">Indirizzo</label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={formData.address.street || ''}
                  onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                  required
                  className="form-control"
                />
              </div>
              <div className="form-group col-md-3">
                <label htmlFor="street_number">Numero Civico</label>
                <input
                  type="text"
                  id="street_number"
                  name="street_number"
                  value={formData.address.streetNumber || ''}
                  onChange={(e) => handleInputChange('address', 'streetNumber', e.target.value)}
                  required
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group col-md-9">
                <label htmlFor="municipality">Comune</label>
                <AutocompleteInput
                  name="municipality"
                  value={formData.address.municipality}
                  onSelect={(item) => handleMunicipalitySelect(item, 'municipality')}
                  fetchSuggestions={autocompleteMunicipalities}
                  placeholder="Città (seleziona)"
                  getItemLabel={(item) => {
                    // Handle both object and string values
                    if (!item) return '';
                    if (typeof item === 'string') return item;
                    return `${item.name} ${item.province ? '- ' + item.province : ''}`;
                  }}
                  minQueryLength={3}
                  queryDelay={800}
                  required
                />
              </div>
              <div className="form-group col-md-3">
                <label htmlFor="post_code">CAP</label>
                <input
                  type="text"
                  id="post_code"
                  name="post_code"
                  value={formData.address.postCode || ''}
                  onChange={(e) => handleInputChange('address', 'postCode', e.target.value)}
                  required
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-group">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>

            {/* Clinical Data Section */}
            <h5 className="title mt-4">Dati Clinici</h5>
            <div className="form-row">
              <div className="form-group col-md-4">
                <label htmlFor="weight">Peso (kg)</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.representative.weight || ''}
                  onChange={(e) => handleInputChange('representative', 'weight', parseFloat(e.target.value) || null)}
                  step="0.1"
                  className="form-control"
                />
              </div>
              <div className="form-group col-md-4">
                <label htmlFor="height">Altezza (cm)</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.representative.height || ''}
                  onChange={(e) => handleInputChange('representative', 'height', parseFloat(e.target.value) || null)}
                  step="0.1"
                  className="form-control"
                />
              </div>
              <div className="form-group col-md-4">
                <label>Stile di vita</label>
                <RadioGroup
                  name="sedentary_lifestyle"
                  value={formData.representative.sedentaryLifestyle}
                  onChange={(e) => handleInputChange('representative', 'sedentaryLifestyle', e.target.value)}
                  options={[
                    { value: false, label: 'Sportivo' },
                    { value: true, label: 'Sedentario' }
                  ]}
                />
              </div>
            </div>

            {/* Menstruation Section - Only for females (gender = false) */}
            {formData.representative.gender !== true && (
              <>
                <h5 className="title mt-4">Ciclo Mestruale</h5>
                <div className="form-row">
                  <div className="form-group col-md-3">
                    <label htmlFor="age_first_menstruation">Età primo ciclo</label>
                    <input
                      type="number"
                      id="age_first_menstruation"
                      name="age_first_menstruation"
                      value={formData.representative.ageFirstMenstruation || ''}
                      onChange={(e) => handleInputChange('representative', 'ageFirstMenstruation', parseInt(e.target.value) || null)}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group col-md-3">
                    <label>Regolarità</label>
                    <RadioGroup
                      name="regularity_menstruation"
                      value={formData.representative.regularityMenstruation}
                      onChange={(e) => handleInputChange('representative', 'regularityMenstruation', e.target.value)}
                      options={[
                        { value: false, label: 'No' },
                        { value: true, label: 'Sì' }
                      ]}
                    />
                  </div>
                  <div className="form-group col-md-3">
                    <label htmlFor="duration_period">Durata ciclo (gg)</label>
                    <input
                      type="number"
                      id="duration_period"
                      name="duration_period"
                      value={formData.representative.durationPeriod || ''}
                      onChange={(e) => handleInputChange('representative', 'durationPeriod', parseInt(e.target.value) || null)}
                      className="form-control"
                      placeholder="gg"
                    />
                  </div>
                  <div className="form-group col-md-3">
                    <label htmlFor="duration_menstruation">Durata mestruazione (gg)</label>
                    <input
                      type="number"
                      id="duration_menstruation"
                      name="duration_menstruation"
                      value={formData.representative.durationMenstruation || ''}
                      onChange={(e) => handleInputChange('representative', 'durationMenstruation', parseInt(e.target.value) || null)}
                      className="form-control"
                      placeholder="gg"
                    />
                  </div>
                </div>

                {/* Obstetric Anamnesis Section */}
                <h5 className="title mt-4">Anamnesi Ostetrica</h5>
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label htmlFor="pregnancies_number">Numero Gravidanze</label>
                    <Select
                      name="pregnancies_number"
                      value={pregnanciesNumber}
                      onChange={handlePregnanciesNumberChange}
                      options={Array.from({ length: 11 }, (_, i) => ({ value: i, label: i.toString() }))}
                    />
                  </div>
                  <div className="form-group col-md-6">
                    {formData.gravidanceTypes.map((gt, index) => (
                      <div key={index} className="gravidance-type-item mb-2">
                        <label>Parto {index + 1}</label>
                        <RadioGroup
                          name={`gravidance_type_${index}`}
                          value={gt.natur}
                          onChange={(e) => handleGravidanceTypeChange(index, e.target.value)}
                          options={[
                            { value: 'nat', label: 'Naturale' },
                            { value: 'cae', label: 'Cesareo' },
                            { value: 'abo', label: 'Aborto' }
                          ]}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Surgeries Section */}
            <h5 className="title mt-4">Interventi Chirurgici</h5>
            <div className="form-group">
              <SurgerySection
                surgeries={formData.surgeries}
                onChange={(surgeries) => setFormData(prev => ({ ...prev, surgeries }))}
              />
            </div>

            {/* Medicines Section */}
            <h5 className="title mt-4">Farmaci</h5>
            <div className="form-group">
              <textarea
                name="medicine"
                value={formData.representative.medicine || ''}
                onChange={(e) => handleInputChange('representative', 'medicine', e.target.value)}
                className="form-control"
                rows="4"
              />
            </div>

            <div className="form-group mt-4">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MedicalHistoryForm;
