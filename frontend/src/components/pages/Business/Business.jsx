import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import BusinessApi from '../../../services/businessApi';
import { ApiClient } from '../../../config/api';
import ThreeColumnLayout from '../../layout/ThreeColumnLayout';
import UserProfileSidebar from '../../layout/UserProfileSidebar';
import AdvertisingSidebar from '../../layout/AdvertisingSidebar';
import './Business.css';

const STREET_TYPES = [
  'Via', 'Piazza', 'Corso', 'Viale', 'Largo', 'Contrada', 'Vicolo',
  'Circonvallazione', 'Galleria', 'Parco', 'Rotonda', 'Traversa',
  'Lungomare', 'Strada', 'Stretto', 'SC', 'SP', 'SR', 'SS',
];

/**
 * EditableField - Reusable component for the edit/validate pattern in business_form.xhtml
 * Display mode: value + edit icon + status icon (check or hourglass)
 * Edit mode: input + cancel + save
 */
const EditableField = ({ fieldKey, value, pendingValue, onRequestChange, onApprove, onReject, isAdminMode, renderDisplay, renderEdit }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const hasPending = pendingValue !== null && pendingValue !== undefined && pendingValue !== '';

  const handleEdit = () => {
    setEditValue(pendingValue || value || '');
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleSave = () => {
    if (window.confirm('Fai click su "Salva" in fondo alla pagina per inoltrare le modifiche richieste.')) {
      onRequestChange(fieldKey, editValue);
      setEditing(false);
    }
  };

  if (!isAdminMode && editing) {
    return (
      <div className="editable-field-edit">
        {renderEdit ? renderEdit(editValue, setEditValue) : (
          <input
            type="text"
            className="form-control"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
        )}
        <div className="edit-actions">
          <button className="field-icon cancel" onClick={handleCancel} title="Annulla">
            <i className="fas fa-arrow-alt-circle-left" />
          </button>
          <button className="field-icon save" onClick={handleSave} title="Salva">
            <i className="fas fa-save" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <span className="editable-field-display">
      <span className="field-value">
        {renderDisplay ? renderDisplay(value) : <span>{value}</span>}
      </span>
      {hasPending && (
        <span className="pending-value-label" title="Valore proposto">
          <i className="fas fa-arrow-right" style={{ margin: '0 6px', color: '#888', fontSize: 11 }} />
          <em style={{ color: '#e42080' }}>{pendingValue}</em>
        </span>
      )}
      <span className="editable-field-icons">
        {isAdminMode && hasPending ? (
          <>
            <button className="field-icon status-approve" onClick={() => onApprove(fieldKey)} title="Approva modifica">
              <i className="fas fa-check-circle" />
            </button>
            <button className="field-icon status-reject" onClick={() => onReject(fieldKey)} title="Rifiuta modifica">
              <i className="fas fa-ban" />
            </button>
          </>
        ) : !isAdminMode ? (
          <>
            <button className="field-icon" onClick={handleEdit} title="Modifica">
              <i className="fas fa-edit" />
            </button>
            {hasPending ? (
              <span className="field-icon status-hourglass" title="In attesa di validazione">
                <i className="fas fa-hourglass" />
              </span>
            ) : (
              <span className="field-icon status-check" title="Online">
                <i className="fas fa-check" />
              </span>
            )}
          </>
        ) : (
          <span className="field-icon status-check" title="Online">
            <i className="fas fa-check" />
          </span>
        )}
      </span>
    </span>
  );
};

/**
 * CheckboxMultiSelect - Multi-select with filter, replicates PrimeFaces selectCheckboxMenu
 */
const CheckboxMultiSelect = ({ items, selectedIds, onChange, label }) => {
  const [filter, setFilter] = useState('');

  const filtered = items.filter(item =>
    item.label.toLowerCase().startsWith(filter.toLowerCase())
  );

  const handleToggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div>
      {label && <div className="field-label">{label}</div>}
      <div className="checkbox-multiselect">
        <div className="checkbox-multiselect-filter">
          <input
            type="text"
            placeholder="Filtra..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        {filtered.map(item => (
          <div key={item.id} className="checkbox-multiselect-item">
            <input
              type="checkbox"
              id={`cb_${label}_${item.id}`}
              checked={selectedIds.includes(item.id)}
              onChange={() => handleToggle(item.id)}
            />
            <label htmlFor={`cb_${label}_${item.id}`}>{item.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * AddressDialog - Modal for editing address
 * Replicates legacy pnl_dlg_medical_address dialog
 */
const AddressDialog = ({ address, onSave, onClose }) => {
  const [form, setForm] = useState({
    streetType: address?.streetType || '',
    street: address?.street || '',
    streetNumber: address?.streetNumber || '',
    municipality: address?.municipality || '',
    province: address?.province || '',
    postCode: address?.postCode || '',
  });
  const [municipalitySearch, setMunicipalitySearch] = useState(address?.municipality || '');
  const [suggestions, setSuggestions] = useState([]);
  const [saving, setSaving] = useState(false);

  const searchMunicipalities = useCallback(async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await ApiClient.get(`/api/reference/municipalities?q=${encodeURIComponent(query)}`);
      setSuggestions(res.municipalities || res || []);
    } catch (e) {
      console.error('Municipality search error:', e);
    }
  }, []);

  const handleMunicipalityChange = (e) => {
    const val = e.target.value;
    setMunicipalitySearch(val);
    searchMunicipalities(val);
  };

  const selectMunicipality = (mun) => {
    setForm(prev => ({
      ...prev,
      municipality: mun.name || mun.municipality,
      province: mun.provincial_code || mun.province || '',
    }));
    setMunicipalitySearch(`${mun.name || mun.municipality} - ${mun.provincial_code || mun.province || ''}`);
    setSuggestions([]);
  };

  const handleSave = async () => {
    if (!form.streetType || !form.street || !form.streetNumber || !form.municipality || !form.postCode) {
      toast.error('Tutti i campi sono obbligatori');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="address-dialog-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="address-dialog">
        <h5>Modifica il tuo indirizzo</h5>
        <div className="row">
          <div className="col col-md-3">
            <div className="form-group">
              <label>Tipo strada</label>
              <select
                value={form.streetType}
                onChange={(e) => setForm(prev => ({ ...prev, streetType: e.target.value }))}
              >
                <option value="">---</option>
                {STREET_TYPES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="col col-md-6">
            <div className="form-group">
              <label>Strada</label>
              <input
                type="text"
                value={form.street}
                onChange={(e) => setForm(prev => ({ ...prev, street: e.target.value }))}
              />
            </div>
          </div>
          <div className="col col-md-3">
            <div className="form-group">
              <label>Numero civico</label>
              <input
                type="text"
                value={form.streetNumber}
                onChange={(e) => setForm(prev => ({ ...prev, streetNumber: e.target.value }))}
              />
            </div>
          </div>
          <div className="col col-md-9">
            <div className="form-group municipality-autocomplete">
              <label>Citta' (seleziona)</label>
              <input
                type="text"
                value={municipalitySearch}
                onChange={handleMunicipalityChange}
                placeholder="Digita almeno 3 caratteri..."
              />
              {suggestions.length > 0 && (
                <ul className="municipality-suggestions">
                  {suggestions.map((mun, i) => (
                    <li key={i} onClick={() => selectMunicipality(mun)}>
                      {mun.name || mun.municipality} {mun.provincial_code || mun.province ? `- ${mun.provincial_code || mun.province}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="col col-md-3">
            <div className="form-group">
              <label>CAP</label>
              <input
                type="text"
                value={form.postCode}
                onChange={(e) => setForm(prev => ({ ...prev, postCode: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Business Component (Scheda Personale)
 * Faithful replica of business_form.xhtml
 */
const Business = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Admin mode: when admin navigates via notification with ?business_id=X
  const businessIdParam = searchParams.get('business_id');
  const isAdmin = user?.role === 'ADMIN' || user?.roles?.some(r => (r.nome || r.name || r) === 'ROLE_PINKCARE');
  const isAdminMode = isAdmin && businessIdParam;

  // Pending changes collected by EditableField
  const [pendingChanges, setPendingChanges] = useState({});
  // Examinations/pathologies editing
  const [editingExaminations, setEditingExaminations] = useState(false);
  const [editingPathologies, setEditingPathologies] = useState(false);
  const [selectedExamIds, setSelectedExamIds] = useState([]);
  const [selectedPathIds, setSelectedPathIds] = useState([]);
  const [examsPending, setExamsPending] = useState(false);
  const [pathsPending, setPathsPending] = useState(false);
  // Address dialog
  const [showAddressDialog, setShowAddressDialog] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = isAdminMode
        ? await BusinessApi.getProfileByTeamId(businessIdParam)
        : await BusinessApi.getProfile();
      setProfile(data);
      // Initialize selected exam/path IDs from current data
      setSelectedExamIds(data.teamExaminations.map(e => e.examinationPathology.id));
      setSelectedPathIds(data.teamPathologies.map(p => p.examinationPathology.id));
    } catch (error) {
      console.error('Error loading business profile:', error);
      toast.error('Errore nel caricamento del profilo');
    } finally {
      setLoading(false);
    }
  }, [isAdminMode, businessIdParam]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isDoctor = profile?.team?.type?.id === 3 || profile?.team?.type?.id === 'DOCTOR' ||
    String(profile?.team?.type?.id) === '3';
  const isClinic = profile?.team?.type?.id === 4 || profile?.team?.type?.id === 'CLINIC' ||
    String(profile?.team?.type?.id) === '4';

  // Handle field change request from EditableField
  const handleRequestChange = (fieldKey, value) => {
    setPendingChanges(prev => ({ ...prev, [fieldKey]: value }));
  };

  // Admin: approve a pending field
  const handleApproveField = async (fieldKey) => {
    if (!isAdminMode || !profile?.team?.id) return;
    const fieldMap = {
      complete_name_first: 'rep_name', complete_name_last: 'rep_surname',
      name: 'name', medical_title: 'medical_title', description: 'description',
      medical_publications: 'medical_publications', structure_dimension: 'structure_dimension',
      instrumentation: 'instrumentation', linkshop: 'linkshop'
    };
    const apiField = fieldMap[fieldKey];
    if (!apiField) return;
    try {
      await BusinessApi.approveField(profile.team.id, apiField);
      toast.success(`Campo "${fieldKey}" approvato`);
      await loadProfile();
    } catch (err) {
      toast.error('Errore nell\'approvazione');
    }
  };

  // Admin: reject a pending field
  const handleRejectField = async (fieldKey) => {
    if (!isAdminMode || !profile?.team?.id) return;
    const fieldMap = {
      complete_name_first: 'rep_name', complete_name_last: 'rep_surname',
      name: 'name', medical_title: 'medical_title', description: 'description',
      medical_publications: 'medical_publications', structure_dimension: 'structure_dimension',
      instrumentation: 'instrumentation', linkshop: 'linkshop'
    };
    const apiField = fieldMap[fieldKey];
    if (!apiField) return;
    try {
      await BusinessApi.rejectField(profile.team.id, apiField);
      toast.success(`Campo "${fieldKey}" rifiutato`);
      await loadProfile();
    } catch (err) {
      toast.error('Errore nel rifiuto');
    }
  };

  // Admin: approve/reject a team exam or pathology
  const handleValidateExamPath = async (tepId) => {
    if (!isAdminMode || !profile?.team?.id) return;
    try {
      await BusinessApi.validateExamPathology(profile.team.id, tepId);
      toast.success('Prestazione/patologia approvata');
      await loadProfile();
    } catch (err) { toast.error('Errore'); }
  };

  const handleRejectExamPath = async (tepId) => {
    if (!isAdminMode || !profile?.team?.id) return;
    try {
      await BusinessApi.rejectExamPathology(profile.team.id, tepId);
      toast.success('Prestazione/patologia rifiutata');
      await loadProfile();
    } catch (err) { toast.error('Errore'); }
  };

  // Handle examinations edit
  const handleStartEditExaminations = () => {
    setEditingExaminations(true);
  };

  const handleSaveExaminations = () => {
    if (window.confirm('Fai click su "Salva" in fondo alla pagina per inoltrare le modifiche richieste.')) {
      setExamsPending(true);
      setEditingExaminations(false);
    }
  };

  // Handle pathologies edit
  const handleStartEditPathologies = () => {
    setEditingPathologies(true);
  };

  const handleSavePathologies = () => {
    if (window.confirm('Fai click su "Salva" in fondo alla pagina per inoltrare le modifiche richieste.')) {
      setPathsPending(true);
      setEditingPathologies(false);
    }
  };

  // Check if there are any pending changes
  const hasPendingChanges = Object.keys(pendingChanges).length > 0 || examsPending || pathsPending;

  // Build changes summary for confirm dialog
  const getChangesSummary = () => {
    const changes = [];
    if (pendingChanges.complete_name_first || pendingChanges.complete_name_last) {
      changes.push(`Nome e cognome: ${pendingChanges.complete_name_first || ''} ${pendingChanges.complete_name_last || ''}`);
    }
    if (pendingChanges.name) changes.push(`Nome: ${pendingChanges.name}`);
    if (pendingChanges.medical_title) changes.push(`Specializzato in: ${pendingChanges.medical_title}`);
    if (pendingChanges.description) {
      changes.push(isDoctor ? 'Profilo modificato' : 'Struttura modificata');
    }
    if (pendingChanges.medical_publications) changes.push(`Pubblicazioni: ${pendingChanges.medical_publications}`);
    if (pendingChanges.structure_dimension) changes.push(`Dimensioni: ${pendingChanges.structure_dimension}`);
    if (pendingChanges.instrumentation) changes.push('Strumentazioni modificate');
    if (pendingChanges.linkshop) changes.push(`Link shop: ${pendingChanges.linkshop}`);
    if (examsPending) changes.push(`${selectedExamIds.length} Principali prestazioni offerte`);
    if (pathsPending) changes.push(`${selectedPathIds.length} Principali patologie trattate`);
    return changes;
  };

  // Save all pending changes
  const handleSave = async () => {
    const changes = getChangesSummary();
    const msg = `Stai per inoltrare definitivamente le seguenti modifiche:\n${changes.join('\n')}\nContinuare?`;
    if (!window.confirm(msg)) return;

    setSaving(true);
    try {
      // 1. Save profile fields
      if (Object.keys(pendingChanges).length > 0) {
        const profileUpdate = {};
        if (pendingChanges.complete_name_first !== undefined) profileUpdate.repNameToValidate = pendingChanges.complete_name_first;
        if (pendingChanges.complete_name_last !== undefined) profileUpdate.repSurnameToValidate = pendingChanges.complete_name_last;
        if (pendingChanges.name !== undefined) profileUpdate.nameToValidate = pendingChanges.name;
        if (pendingChanges.medical_title !== undefined) profileUpdate.medicalTitleToValidate = pendingChanges.medical_title;
        if (pendingChanges.description !== undefined) profileUpdate.descriptionToValidate = pendingChanges.description;
        if (pendingChanges.medical_publications !== undefined) profileUpdate.medicalPublicationsToValidate = pendingChanges.medical_publications;
        if (pendingChanges.structure_dimension !== undefined) profileUpdate.structureDimensionToValidate = pendingChanges.structure_dimension;
        if (pendingChanges.instrumentation !== undefined) profileUpdate.instrumentationToValidate = pendingChanges.instrumentation;
        if (pendingChanges.linkshop !== undefined) profileUpdate.linkshopToValidate = pendingChanges.linkshop;

        if (Object.keys(profileUpdate).length > 0) {
          await BusinessApi.updateProfile(profileUpdate);
        }
      }

      // 2. Save examinations
      if (examsPending) {
        await BusinessApi.updateExaminations(selectedExamIds);
      }

      // 3. Save pathologies
      if (pathsPending) {
        await BusinessApi.updatePathologies(selectedPathIds);
      }

      toast.success('Operazione effettuata con successo');
      setPendingChanges({});
      setExamsPending(false);
      setPathsPending(false);
      await loadProfile();
    } catch (error) {
      console.error('Error saving business profile:', error);
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  // Handle address save
  const handleAddressSave = async (addressData) => {
    try {
      await BusinessApi.updateAddress(addressData);
      toast.success('Indirizzo aggiornato con successo');
      setShowAddressDialog(false);
      await loadProfile();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Errore nel salvataggio dell\'indirizzo');
    }
  };

  if (loading) {
    return (
      <ThreeColumnLayout
        leftSidebar={<UserProfileSidebar />}
        rightSidebar={<AdvertisingSidebar />}
        leftColSize={2} centerColSize={8} rightColSize={2}
      >
        <div className="business-loading"><p>Caricamento...</p></div>
      </ThreeColumnLayout>
    );
  }

  if (!profile) {
    return (
      <ThreeColumnLayout
        leftSidebar={<UserProfileSidebar />}
        rightSidebar={<AdvertisingSidebar />}
        leftColSize={2} centerColSize={8} rightColSize={2}
      >
        <div className="business-loading"><p>Errore nel caricamento del profilo</p></div>
      </ThreeColumnLayout>
    );
  }

  const { team, teamExaminations, teamPathologies, allExaminations, allPathologies, medicalTitles } = profile;
  const hasExamsPending = teamExaminations.some(e => !e.validated);
  const hasPathsPending = teamPathologies.some(p => !p.validated);

  return (
    <ThreeColumnLayout
      leftSidebar={<UserProfileSidebar />}
      rightSidebar={<AdvertisingSidebar />}
      leftColSize={2}
      centerColSize={8}
      rightColSize={2}
    >
      {/* Banner verde - Account gratuito */}
      <div className="ui-block business-banner">
        <div className="ui-block-content">
          <h6>Account gratuito per i primi sei mesi dall'iscrizione</h6>
        </div>
      </div>

      <div className="ui-block">
        <div className="ui-block-content business-form-container">

          {/* DOCTOR: Nome completo + badge */}
          {isDoctor && (
            <div className="row" style={{ marginBottom: 15 }}>
              <div className="col col-8 col-sm-9 col-md-6">
                <DoctorNameSection
                  representative={team.representative}
                  pendingFirst={pendingChanges.complete_name_first}
                  pendingLast={pendingChanges.complete_name_last}
                  onSave={(first, last) => {
                    handleRequestChange('complete_name_first', first);
                    handleRequestChange('complete_name_last', last);
                  }}
                />
              </div>
              <div className="col col-4 col-sm-3 col-md-6 certificate-badge">
                <img src="/styles/olympus/assets/images/logo_medici_accreditati.png" alt="Medico accreditato" className="certificate_doc" />
              </div>
            </div>
          )}

          {/* CLINIC: Nome struttura + badge */}
          {isClinic && (
            <div className="row" style={{ marginBottom: 15 }}>
              <div className="col col-12 col-sm-12 col-md-6">
                <EditableField
                  fieldKey="name"
                  value={team.name}
                  pendingValue={team.nameToValidate}
                  onRequestChange={handleRequestChange}
                  onApprove={handleApproveField}
                  onReject={handleRejectField}
                  isAdminMode={isAdminMode}
                  renderDisplay={(val) => <h2 className="inline">{val}</h2>}
                />
              </div>
              <div className="col col-4 col-sm-3 col-md-6 certificate-badge">
                <img src="/styles/olympus/assets/images/logo_struttura_accreditata.png" alt="Struttura accreditata" className="certificate_doc" />
              </div>
            </div>
          )}

          {/* Medical title (solo DOCTOR) */}
          {isDoctor && (
            <div className="row" style={{ marginBottom: 10 }}>
              <div className="col col-12 col-sm-12 col-md-6">
                <EditableField
                  fieldKey="medical_title"
                  value={team.medicalTitle}
                  pendingValue={team.medicalTitleToValidate}
                  onRequestChange={handleRequestChange}
                  onApprove={handleApproveField}
                  onReject={handleRejectField}
                  isAdminMode={isAdminMode}
                  renderDisplay={(val) => (
                    <h4 className="inline">Specializzato in: {val || '---'}</h4>
                  )}
                  renderEdit={(editValue, setEditValue) => (
                    <select
                      className="form-control"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    >
                      <option value="">---</option>
                      {medicalTitles.map(mt => (
                        <option key={mt.id} value={mt.label}>{mt.label}</option>
                      ))}
                    </select>
                  )}
                />
              </div>
            </div>
          )}

          <hr className="business-separator" />

          {/* Prestazioni offerte e Patologie trattate */}
          <div className="row">
            <div className="col col-12 col-sm-12 col-md-6">
              {!editingExaminations ? (
                <div className="editable-field">
                  <h4>Principali prestazioni offerte:</h4>
                  <span className="inline-items-list">
                    {teamExaminations.map((e, i) => (
                      <span key={e.id}>
                        {e.examinationPathology.label}
                        {!e.validated && isAdminMode && (
                          <span style={{ marginLeft: 4 }}>
                            <button className="field-icon status-approve" onClick={() => handleValidateExamPath(e.id)} title="Approva">
                              <i className="fas fa-check-circle" />
                            </button>
                            <button className="field-icon status-reject" onClick={() => handleRejectExamPath(e.id)} title="Rifiuta">
                              <i className="fas fa-ban" />
                            </button>
                          </span>
                        )}
                        {!e.validated && !isAdminMode && (
                          <i className="fas fa-hourglass" style={{ marginLeft: 4, color: '#e18a17', fontSize: 11 }} title="In attesa" />
                        )}
                        {i < teamExaminations.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                    {teamExaminations.length === 0 && <span style={{ color: '#999' }}>Nessuna</span>}
                  </span>
                  {!isAdminMode && (
                    <span className="editable-field-icons">
                      <button className="field-icon" onClick={handleStartEditExaminations} title="Modifica">
                        <i className="fas fa-edit" />
                      </button>
                      {hasExamsPending || examsPending ? (
                        <span className="field-icon status-hourglass" title="In attesa di validazione">
                          <i className="fas fa-hourglass" />
                        </span>
                      ) : (
                        <span className="field-icon status-check" title="Online">
                          <i className="fas fa-check" />
                        </span>
                      )}
                    </span>
                  )}
                </div>
              ) : (
                <div className="editable-field">
                  <CheckboxMultiSelect
                    label="Principali prestazioni offerte"
                    items={allExaminations}
                    selectedIds={selectedExamIds}
                    onChange={setSelectedExamIds}
                  />
                  <div className="edit-actions" style={{ marginTop: 8 }}>
                    <button className="field-icon cancel" onClick={() => {
                      setEditingExaminations(false);
                      setSelectedExamIds(teamExaminations.map(e => e.examinationPathology.id));
                    }} title="Annulla">
                      <i className="fas fa-arrow-alt-circle-left" />
                    </button>
                    <button className="field-icon save" onClick={handleSaveExaminations} title="Salva">
                      <i className="fas fa-save" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="col col-12 col-sm-12 col-md-6">
              {!editingPathologies ? (
                <div className="editable-field">
                  <h4>Principali patologie trattate:</h4>
                  <span className="inline-items-list">
                    {teamPathologies.map((p, i) => (
                      <span key={p.id}>
                        {p.examinationPathology.label}
                        {!p.validated && isAdminMode && (
                          <span style={{ marginLeft: 4 }}>
                            <button className="field-icon status-approve" onClick={() => handleValidateExamPath(p.id)} title="Approva">
                              <i className="fas fa-check-circle" />
                            </button>
                            <button className="field-icon status-reject" onClick={() => handleRejectExamPath(p.id)} title="Rifiuta">
                              <i className="fas fa-ban" />
                            </button>
                          </span>
                        )}
                        {!p.validated && !isAdminMode && (
                          <i className="fas fa-hourglass" style={{ marginLeft: 4, color: '#e18a17', fontSize: 11 }} title="In attesa" />
                        )}
                        {i < teamPathologies.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                    {teamPathologies.length === 0 && <span style={{ color: '#999' }}>Nessuna</span>}
                  </span>
                  {!isAdminMode && (
                    <span className="editable-field-icons">
                      <button className="field-icon" onClick={handleStartEditPathologies} title="Modifica">
                        <i className="fas fa-edit" />
                      </button>
                      {hasPathsPending || pathsPending ? (
                        <span className="field-icon status-hourglass" title="In attesa di validazione">
                          <i className="fas fa-hourglass" />
                        </span>
                      ) : (
                        <span className="field-icon status-check" title="Online">
                          <i className="fas fa-check" />
                        </span>
                      )}
                    </span>
                  )}
                </div>
              ) : (
                <div className="editable-field">
                  <CheckboxMultiSelect
                    label="Principali patologie trattate"
                    items={allPathologies}
                    selectedIds={selectedPathIds}
                    onChange={setSelectedPathIds}
                  />
                  <div className="edit-actions" style={{ marginTop: 8 }}>
                    <button className="field-icon cancel" onClick={() => {
                      setEditingPathologies(false);
                      setSelectedPathIds(teamPathologies.map(p => p.examinationPathology.id));
                    }} title="Annulla">
                      <i className="fas fa-arrow-alt-circle-left" />
                    </button>
                    <button className="field-icon save" onClick={handleSavePathologies} title="Salva">
                      <i className="fas fa-save" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dettagli struttura */}
          <div className="business-section-title">
            <h4>{isDoctor ? 'Studio Medico' : 'Il centro'}:</h4>
          </div>
          <div className="row">
            {/* Nome centro (solo CLINIC nella sezione struttura) */}
            {isClinic && (
              <div className="col col-12 col-sm-12 col-md-6">
                <div className="field-label">Nome del centro</div>
                <EditableField
                  fieldKey="name"
                  value={team.name}
                  pendingValue={team.nameToValidate}
                  onRequestChange={handleRequestChange}
                  onApprove={handleApproveField}
                  onReject={handleRejectField}
                  isAdminMode={isAdminMode}
                  renderDisplay={(val) => <span className="inline-text-display">{val}</span>}
                />
              </div>
            )}

            {/* Linkshop (solo CLINIC) */}
            {isClinic && (
              <div className="col col-12 col-sm-12 col-md-6">
                <div className="field-label">Link shop</div>
                <EditableField
                  fieldKey="linkshop"
                  value={team.linkshop}
                  pendingValue={team.linkshopToValidate}
                  onRequestChange={handleRequestChange}
                  onApprove={handleApproveField}
                  onReject={handleRejectField}
                  isAdminMode={isAdminMode}
                  renderDisplay={(val) => <span className="inline-text-display">{val || '---'}</span>}
                />
              </div>
            )}

            {/* Dimensioni */}
            <div className="col col-12 col-sm-12 col-md-6">
              <div className="field-label">Dimensioni</div>
              <EditableField
                fieldKey="structure_dimension"
                value={team.structureDimension}
                pendingValue={team.structureDimensionToValidate}
                onRequestChange={handleRequestChange}
                renderDisplay={(val) => <span>{val ? `${val} mq` : '---'}</span>}
                renderEdit={(editValue, setEditValue) => (
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: 150 }}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="mq"
                  />
                )}
              />
            </div>

            {/* Strumentazione */}
            <div className="col col-12 col-sm-12 col-md-6">
              <div className="field-label">Strumentazioni</div>
              <EditableField
                fieldKey="instrumentation"
                value={team.instrumentation}
                pendingValue={team.instrumentationToValidate}
                onRequestChange={handleRequestChange}
                renderDisplay={(val) => <span className="inline-text-display">{val || '---'}</span>}
                renderEdit={(editValue, setEditValue) => (
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                )}
              />
            </div>
          </div>

          {/* Descrizione (Profilo / Struttura) */}
          <div className="row" style={{ marginTop: 15 }}>
            <div className="col col-12 col-sm-12">
              <h4>{isDoctor ? 'Profilo' : 'Struttura'}</h4>
              <EditableField
                fieldKey="description"
                value={team.description}
                pendingValue={team.descriptionToValidate}
                onRequestChange={handleRequestChange}
                renderDisplay={(val) => <p className="inline-text-display">{val || '---'}</p>}
                renderEdit={(editValue, setEditValue) => (
                  <textarea
                    className="form-control"
                    rows={5}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                )}
              />
            </div>
          </div>

          {/* Pubblicazioni mediche (solo DOCTOR) */}
          {isDoctor && (
            <div className="row" style={{ marginTop: 15 }}>
              <div className="col col-12 col-sm-12">
                <h4>Pubblicazioni</h4>
                <EditableField
                  fieldKey="medical_publications"
                  value={team.medicalPublications}
                  pendingValue={team.medicalPublicationsToValidate}
                  onRequestChange={handleRequestChange}
                  onApprove={handleApproveField}
                  onReject={handleRejectField}
                  isAdminMode={isAdminMode}
                  renderDisplay={(val) => <p className="inline-text-display">{val || '---'}</p>}
                />
              </div>
            </div>
          )}

          {/* Indirizzo */}
          {team.address && (
            <div className="row" style={{ marginTop: 15 }}>
              <div className="col col-12">
                <div className="field-label">Indirizzo</div>
                <span className="address-display">
                  <span className="address-text">
                    {team.address.streetType} {team.address.street} {team.address.streetNumber},
                    {' '}{team.address.municipality} {team.address.province ? `(${team.address.province})` : ''} {team.address.postCode}
                  </span>
                  <button className="field-icon" onClick={() => setShowAddressDialog(true)} title="Modifica indirizzo">
                    <i className="fas fa-edit" />
                  </button>
                </span>
              </div>
            </div>
          )}

          {/* Pulsante Salva - solo per business, non per admin */}
          {!isAdminMode && (
            <div className="business-save-section">
              <button
                className="btn btn-primary"
                disabled={!hasPendingChanges || saving}
                onClick={handleSave}
              >
                {saving ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Address Dialog */}
      {showAddressDialog && (
        <AddressDialog
          address={team.address}
          onSave={handleAddressSave}
          onClose={() => setShowAddressDialog(false)}
        />
      )}
    </ThreeColumnLayout>
  );
};

/**
 * DoctorNameSection - Display + inline edit for doctor's first name + last name
 * Replicates the complete_name section in business_form.xhtml
 */
const DoctorNameSection = ({ representative, pendingFirst, pendingLast, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');

  const hasPendingServer = !!(representative.nameToValidate || representative.surnameToValidate);
  const hasPendingLocal = !!(pendingFirst || pendingLast);

  const handleEdit = () => {
    setFirst(representative.nameToValidate || representative.name || '');
    setLast(representative.surnameToValidate || representative.surname || '');
    setEditing(true);
  };

  const handleSave = () => {
    if (window.confirm('Fai click su "Salva" in fondo alla pagina per inoltrare le modifiche richieste.')) {
      onSave(first, last);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div>
        <div className="row" style={{ marginTop: 8 }}>
          <div className="col col-12 col-sm-12 col-md-6">
            <label>Nome</label>
            <input type="text" className="form-control" value={first} onChange={(e) => setFirst(e.target.value)} />
          </div>
          <div className="col col-12 col-sm-12 col-md-6">
            <label>Cognome</label>
            <input type="text" className="form-control" value={last} onChange={(e) => setLast(e.target.value)} />
            <div className="edit-actions" style={{ marginTop: 6 }}>
              <button className="field-icon cancel" onClick={() => setEditing(false)} title="Annulla">
                <i className="fas fa-arrow-alt-circle-left" />
              </button>
              <button className="field-icon save" onClick={handleSave} title="Salva">
                <i className="fas fa-save" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <span className="editable-field-display">
        <h2 className="inline">{representative.completeName}</h2>
        <span className="editable-field-icons">
          <button className="field-icon" onClick={handleEdit} title="Modifica">
            <i className="fas fa-edit" />
          </button>
          {(hasPendingServer || hasPendingLocal) ? (
            <span className="field-icon status-hourglass" title="In attesa di validazione">
              <i className="fas fa-hourglass" />
            </span>
          ) : (
            <span className="field-icon status-check" title="Online">
              <i className="fas fa-check" />
            </span>
          )}
        </span>
      </span>
      {hasPendingLocal && (
        <div className="pending-local-indicator">
          <i className="fas fa-hourglass" /> Modifica in attesa di salvataggio: {pendingFirst} {pendingLast}
        </div>
      )}
    </div>
  );
};

export default Business;
