import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import ThreeColumnLayout from '../../layout/ThreeColumnLayout';
import UserProfileSidebar from '../../layout/UserProfileSidebar';
import AdvertisingSidebar from '../../layout/AdvertisingSidebar';
import AdminApi from '../../../services/adminApi';
import '../Admin/Administration.css';

/**
 * BlogCategoryList Component
 * Replica esattamente la tab "Categorie del blog" (profile?tab=4) del legacy
 * Form per aggiungere nuova categoria + DataTable con colonne: Etichetta, Azioni (Modifica/Eliminare)
 */
const BlogCategoryList = ({ errorHandler }) => {
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await AdminApi.getBlogCategories();
      setItems(result || []);
    } catch (error) {
      console.error('Error fetching blog categories:', error);
      toast.error('Errore nel caricamento delle categorie');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newLabel.trim()) {
      toast.error('Inserire un\'etichetta');
      return;
    }
    try {
      setSaving(true);
      await AdminApi.createBlogCategory({ label: newLabel.trim() });
      toast.success('Categoria aggiunta');
      setNewLabel('');
      fetchData();
    } catch (error) {
      console.error('Error creating blog category:', error);
      toast.error('Errore nella creazione della categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditingLabel(item.label);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingLabel('');
  };

  const handleSaveEdit = async (id) => {
    if (!editingLabel.trim()) {
      toast.error('Inserire un\'etichetta');
      return;
    }
    try {
      setSaving(true);
      await AdminApi.updateBlogCategory(id, { label: editingLabel.trim() });
      toast.success('Categoria aggiornata');
      setEditingId(null);
      setEditingLabel('');
      fetchData();
    } catch (error) {
      console.error('Error updating blog category:', error);
      toast.error('Errore nell\'aggiornamento della categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questa categoria?')) {
      return;
    }
    try {
      await AdminApi.deleteBlogCategory(id);
      toast.success('Categoria eliminata');
      fetchData();
    } catch (error) {
      console.error('Error deleting blog category:', error);
      toast.error('Errore nell\'eliminazione della categoria');
    }
  };

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
            <h5 className="admin-title">Categorie del blog</h5>

            {/* Add form */}
            <form className="admin-search-form" onSubmit={handleAdd}>
              <div className="admin-search-fields">
                <input
                  type="text"
                  placeholder="Etichetta"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
              <div className="admin-search-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </form>

            {/* Data table */}
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="admin-empty">Nessuna categoria trovata</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Etichetta</th>
                    <th style={{ width: '15%' }}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {editingId === item.id ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={editingLabel}
                              onChange={(e) => setEditingLabel(e.target.value)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '13px',
                                border: '1px solid #d0d8f0',
                                borderRadius: '4px',
                                flex: 1
                              }}
                            />
                            <button
                              className="toggle-btn"
                              onClick={() => handleSaveEdit(item.id)}
                              title="Salva"
                              disabled={saving}
                            >
                              <i className="fas fa-check" style={{ color: '#2da54e' }}></i>
                            </button>
                            <button
                              className="toggle-btn"
                              onClick={handleCancelEdit}
                              title="Annulla"
                            >
                              <i className="fas fa-ban" style={{ color: '#999' }}></i>
                            </button>
                          </div>
                        ) : (
                          item.label
                        )}
                      </td>
                      <td>
                        {editingId !== item.id && (
                          <>
                            <button
                              className="toggle-btn"
                              onClick={() => handleEdit(item)}
                              title="Modifica"
                            >
                              <i className="fas fa-edit" style={{ color: '#515365' }}></i>
                            </button>
                            <button
                              className="toggle-btn"
                              onClick={() => handleDelete(item.id)}
                              title="Eliminare"
                            >
                              <i className="fas fa-times" style={{ color: '#d20000' }}></i>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </ThreeColumnLayout>
  );
};

export default BlogCategoryList;
