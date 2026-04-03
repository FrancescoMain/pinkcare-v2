import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import ThreeColumnLayout from '../../layout/ThreeColumnLayout';
import UserProfileSidebar from '../../layout/UserProfileSidebar';
import AdvertisingSidebar from '../../layout/AdvertisingSidebar';
import AdminApi from '../../../services/adminApi';
import '../Admin/Administration.css';

const CollaboratorsList = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1, size: 15, total: 0, totalPages: 0, hasNext: false, hasPrevious: false
  });
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newFormData, setNewFormData] = useState({ name: '', surname: '', email: '', password: '' });

  // Edit view state
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', surname: '', email: '', confirmEmail: '' });
  const [userRoles, setUserRoles] = useState([]);
  const [assignableRoles, setAssignableRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [rolesLoading, setRolesLoading] = useState(false);

  const fetchData = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const result = await AdminApi.getCollaborators(page, 15);
      setItems(result.items || []);
      setPagination({
        page: result.page,
        size: result.size,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrevious: result.hasPrevious
      });
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      toast.error('Errore nel caricamento dei collaboratori');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- New collaborator form ---
  const handleNew = () => {
    setNewFormData({ name: '', surname: '', email: '', password: '' });
    setShowNewForm(true);
  };

  const handleCancelNew = () => {
    setShowNewForm(false);
    setNewFormData({ name: '', surname: '', email: '', password: '' });
  };

  const handleSubmitNew = async (e) => {
    e.preventDefault();
    try {
      if (!newFormData.password) {
        toast.error('La password è obbligatoria per un nuovo utente');
        return;
      }
      await AdminApi.createCollaborator(newFormData);
      toast.success('Collaboratore creato');
      handleCancelNew();
      fetchData(pagination.page);
    } catch (error) {
      console.error('Error creating collaborator:', error);
      toast.error('Errore nel salvataggio');
    }
  };

  // --- Edit view ---
  const fetchRolesData = useCallback(async (userId) => {
    try {
      setRolesLoading(true);
      const [roles, assignable] = await Promise.all([
        AdminApi.getCollaboratorRoles(userId),
        AdminApi.getAssignableRoles(userId)
      ]);
      setUserRoles(roles || []);
      setAssignableRoles(assignable || []);
      if (assignable && assignable.length > 0) {
        setSelectedRoleId(assignable[0].id);
      } else {
        setSelectedRoleId('');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Errore nel caricamento dei ruoli');
    } finally {
      setRolesLoading(false);
    }
  }, []);

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      surname: user.surname || '',
      email: user.username || '',
      confirmEmail: user.username || ''
    });
    fetchRolesData(user.id);
  };

  const handleBackToList = () => {
    setEditingUser(null);
    setEditFormData({ name: '', surname: '', email: '', confirmEmail: '' });
    setUserRoles([]);
    setAssignableRoles([]);
    setSelectedRoleId('');
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (editFormData.email !== editFormData.confirmEmail) {
      toast.error('Le email non coincidono');
      return;
    }
    try {
      await AdminApi.updateCollaborator(editingUser.id, {
        name: editFormData.name,
        surname: editFormData.surname,
        email: editFormData.email
      });
      toast.success('Collaboratore aggiornato');
      fetchData(pagination.page);
    } catch (error) {
      console.error('Error updating collaborator:', error);
      toast.error('Errore nel salvataggio');
    }
  };

  const handleTogglePermission = async (roleId, field, currentValue) => {
    const role = userRoles.find(r => r.id === roleId);
    if (!role) return;
    const updatedPermissions = {
      insertion: role.insertion,
      modification: role.modification,
      cancellation: role.cancellation,
      [field]: !currentValue
    };
    try {
      await AdminApi.updateUserRolePermissions(editingUser.id, roleId, updatedPermissions);
      setUserRoles(prev => prev.map(r =>
        r.id === roleId ? { ...r, [field]: !currentValue } : r
      ));
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Errore nell\'aggiornamento del permesso');
    }
  };

  const handleAddRole = async () => {
    if (!selectedRoleId) return;
    try {
      await AdminApi.addRoleToUser(editingUser.id, selectedRoleId);
      toast.success('Ruolo aggiunto');
      fetchRolesData(editingUser.id);
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error('Errore nell\'aggiunta del ruolo');
    }
  };

  const handleRemoveRole = async (roleId) => {
    try {
      await AdminApi.removeRoleFromUser(editingUser.id, roleId);
      toast.success('Ruolo rimosso');
      fetchRolesData(editingUser.id);
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Errore nella rimozione del ruolo');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Eliminare questo utente?')) return;
    try {
      await AdminApi.deleteCollaborator(userId);
      toast.success('Utente eliminato');
      fetchData(pagination.page);
    } catch (error) {
      console.error('Error deleting collaborator:', error);
      toast.error("Errore nell'eliminazione");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  // --- Edit View (Scheda Utente) ---
  if (editingUser) {
    return (
      <ThreeColumnLayout
        leftSidebar={<UserProfileSidebar />}
        rightSidebar={<AdvertisingSidebar />}
        leftColSize={2}
        centerColSize={8}
        rightColSize={2}
      >
        <div className="admin-page">
          <div className="admin-content">
            <div className="admin-list">
              <h5 className="admin-title">Scheda Utente</h5>

              {/* User data form */}
              <div className="admin-search-form" style={{ marginBottom: '20px' }}>
                <form onSubmit={handleSubmitEdit}>
                  <div className="admin-search-fields">
                    <input
                      type="text"
                      placeholder="Nome *"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Cognome *"
                      value={editFormData.surname}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, surname: e.target.value }))}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <input
                      type="email"
                      placeholder="Conferma Email"
                      value={editFormData.confirmEmail}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, confirmEmail: e.target.value }))}
                    />
                  </div>
                  <div className="admin-search-actions" style={{ marginTop: '10px' }}>
                    <button type="submit" className="btn btn-primary">Salva</button>
                  </div>
                </form>
              </div>

              {/* Roles section */}
              <h5 className="admin-title">Ruoli</h5>

              {rolesLoading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                </div>
              ) : (
                <>
                  {userRoles.length > 0 ? (
                    <table className="admin-table" style={{ marginBottom: '20px' }}>
                      <thead>
                        <tr>
                          <th>Ruolo</th>
                          <th style={{ textAlign: 'center' }}>Inserimento</th>
                          <th style={{ textAlign: 'center' }}>Modifica</th>
                          <th style={{ textAlign: 'center' }}>Cancellazione</th>
                          <th style={{ textAlign: 'center' }}>Eliminare</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userRoles.map((role) => (
                          <tr key={role.id}>
                            <td>{role.description}</td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={role.insertion}
                                onChange={() => handleTogglePermission(role.id, 'insertion', role.insertion)}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={role.modification}
                                onChange={() => handleTogglePermission(role.id, 'modification', role.modification)}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={role.cancellation}
                                onChange={() => handleTogglePermission(role.id, 'cancellation', role.cancellation)}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="toggle-btn"
                                onClick={() => handleRemoveRole(role.id)}
                                title="Eliminare"
                              >
                                <i className="fas fa-times" style={{ color: '#d20000' }}></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="admin-empty" style={{ marginBottom: '20px' }}>
                      Nessun ruolo assegnato
                    </div>
                  )}

                  {/* Add role form */}
                  <div className="admin-search-form" style={{ marginBottom: '20px' }}>
                    <div className="admin-search-fields">
                      <label style={{ fontSize: '13px', color: '#515365', fontWeight: 600, alignSelf: 'center', minWidth: 'auto', flex: 'none' }}>
                        Ruolo:
                      </label>
                      <select
                        value={selectedRoleId}
                        onChange={(e) => setSelectedRoleId(e.target.value)}
                        disabled={assignableRoles.length === 0}
                      >
                        {assignableRoles.length === 0 ? (
                          <option value="">Nessun ruolo disponibile</option>
                        ) : (
                          assignableRoles.map((role) => (
                            <option key={role.id} value={role.id}>{role.description}</option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="admin-search-actions" style={{ marginTop: '10px' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleAddRole}
                        disabled={assignableRoles.length === 0}
                      >
                        Aggiungi
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Back button */}
              <div style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBackToList}
                  style={{
                    padding: '8px 18px',
                    border: '1px solid #e6ecf5',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: '#e6ecf5',
                    color: '#515365'
                  }}
                >
                  Torna alla lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </ThreeColumnLayout>
    );
  }

  // --- List View ---
  return (
    <ThreeColumnLayout
      leftSidebar={<UserProfileSidebar />}
      rightSidebar={<AdvertisingSidebar />}
      leftColSize={2}
      centerColSize={8}
      rightColSize={2}
    >
      <div className="admin-page">
        <div className="admin-content">
          <div className="admin-list">
            <h5 className="admin-title">Lista Utenti</h5>

            <div style={{ marginBottom: '15px' }}>
              <button className="btn btn-primary" onClick={handleNew}>Nuovo</button>
            </div>

            {/* Form Nuovo */}
            {showNewForm && (
              <div className="admin-search-form" style={{ marginBottom: '15px' }}>
                <form onSubmit={handleSubmitNew}>
                  <div className="admin-search-fields">
                    <input
                      type="text"
                      placeholder="Nome"
                      value={newFormData.name}
                      onChange={(e) => setNewFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Cognome"
                      value={newFormData.surname}
                      onChange={(e) => setNewFormData(prev => ({ ...prev, surname: e.target.value }))}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newFormData.email}
                      onChange={(e) => setNewFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={newFormData.password}
                      onChange={(e) => setNewFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="admin-search-actions" style={{ marginTop: '10px' }}>
                    <button type="submit" className="btn btn-primary">Salva</button>
                    <button type="button" className="btn btn-secondary" onClick={handleCancelNew}>
                      Annulla
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="admin-empty">Nessun collaboratore trovato</div>
            ) : (
              <>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Nome</th>
                      <th>Cognome</th>
                      <th>Username</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((user) => (
                      <tr key={user.id}>
                        <td>{formatDate(user.insertionDate)}</td>
                        <td>{user.name}</td>
                        <td>{user.surname}</td>
                        <td>{user.username}</td>
                        <td>
                          <button
                            className="toggle-btn"
                            onClick={() => handleEdit(user)}
                            title="Modifica"
                          >
                            <i className="fas fa-edit" style={{ color: '#515365' }}></i>
                          </button>
                          <button
                            className="toggle-btn"
                            onClick={() => handleDelete(user.id)}
                            title="Eliminare"
                          >
                            <i className="fas fa-times" style={{ color: '#d20000' }}></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="admin-pagination">
                  {pagination.hasPrevious && (
                    <button className="btn btn-pagination" onClick={() => fetchData(pagination.page - 1)}>&lt;</button>
                  )}
                  <span>Pag. {pagination.page} Di {pagination.totalPages}</span>
                  {pagination.hasNext && (
                    <button className="btn btn-pagination" onClick={() => fetchData(pagination.page + 1)}>&gt;</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ThreeColumnLayout>
  );
};

export default CollaboratorsList;
