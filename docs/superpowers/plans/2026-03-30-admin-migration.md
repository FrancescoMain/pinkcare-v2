# Admin Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the legacy Java admin panel (consumer management + business management) to the V2 React + Express.js stack, replicating functionality exactly as-is.

**Architecture:** Backend adds `/api/admin/*` routes protected by `AuthMiddleware.requireAdmin()`, with a service layer that queries existing Sequelize models (User, Team, Typology, Address). Frontend adds an `/administration` route with tab-based UI (tab 0 = consumers, tab 1 = businesses), following existing patterns (ApiClient, ProtectedRoute, AuthenticatedLayout).

**Tech Stack:** Express.js, Sequelize (existing models), React 19, React Router v7, i18next, react-toastify

---

### Task 1: Backend — Admin Service

**Files:**
- Create: `pinkcare-v2/backend/src/services/adminService.js`

- [ ] **Step 1: Create the admin service with consumer search**

```javascript
const { Op } = require('sequelize');
const db = require('../models');

class AdminService {

  async findConsumers({ name, surname, page = 1, size = 15 }) {
    const where = {};
    const userWhere = {};

    if (name) {
      userWhere.name = { [Op.iLike]: `%${name}%` };
    }
    if (surname) {
      userWhere.surname = { [Op.iLike]: `%${surname}%` };
    }

    where.typeId = db.Typology.CONSUMER;

    const { count, rows } = await db.Team.findAndCountAll({
      where,
      include: [
        {
          model: db.User,
          as: 'representative',
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          required: Object.keys(userWhere).length > 0,
          attributes: ['id', 'name', 'surname', 'email', 'enabled', 'agreeMarketing', 'agreeNewsletter', 'insertionDate']
        },
        {
          model: db.Address,
          as: 'address'
        },
        {
          model: db.Typology,
          as: 'type',
          attributes: ['id', 'label']
        }
      ],
      order: [['insertionDate', 'DESC']],
      limit: size,
      offset: (page - 1) * size,
      distinct: true
    });

    const totalPages = Math.ceil(count / size);

    return {
      items: rows,
      total: count,
      page,
      size,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  async findBusinesses({ name, surname, denomination, typeId, page = 1, size = 15 }) {
    const where = {};
    const userWhere = {};

    if (name) {
      userWhere.name = { [Op.iLike]: `%${name}%` };
    }
    if (surname) {
      userWhere.surname = { [Op.iLike]: `%${surname}%` };
    }
    if (denomination) {
      where.name = { [Op.iLike]: `%${denomination}%` };
    }
    if (typeId) {
      where.typeId = typeId;
    } else {
      where.typeId = { [Op.notIn]: [db.Typology.CONSUMER, db.Typology.ADMINISTRATOR] };
    }

    const { count, rows } = await db.Team.findAndCountAll({
      where,
      include: [
        {
          model: db.User,
          as: 'representative',
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          required: Object.keys(userWhere).length > 0,
          attributes: ['id', 'name', 'surname', 'email', 'enabled', 'agreeMarketing', 'agreeNewsletter', 'insertionDate']
        },
        {
          model: db.Address,
          as: 'address'
        },
        {
          model: db.Typology,
          as: 'type',
          attributes: ['id', 'label']
        }
      ],
      order: [['insertionDate', 'DESC']],
      limit: size,
      offset: (page - 1) * size,
      distinct: true
    });

    const totalPages = Math.ceil(count / size);

    return {
      items: rows,
      total: count,
      page,
      size,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  async toggleUserAccess(userId) {
    const user = await db.User.findByPk(userId);
    if (!user) throw new Error('User not found');
    user.enabled = !user.enabled;
    user.lastModifyDate = new Date();
    await user.save();
    return { enabled: user.enabled };
  }

  async toggleUserMarketing(userId) {
    const user = await db.User.findByPk(userId);
    if (!user) throw new Error('User not found');
    user.agreeMarketing = !user.agreeMarketing;
    user.lastModifyDate = new Date();
    await user.save();
    return { agreeMarketing: user.agreeMarketing };
  }

  async toggleUserNewsletter(userId) {
    const user = await db.User.findByPk(userId);
    if (!user) throw new Error('User not found');
    user.agreeNewsletter = !user.agreeNewsletter;
    user.lastModifyDate = new Date();
    await user.save();
    return { agreeNewsletter: user.agreeNewsletter };
  }

  async toggleTeamSearchable(teamId) {
    const team = await db.Team.findByPk(teamId);
    if (!team) throw new Error('Team not found');
    team.searchable = !team.searchable;
    team.lastModifyDate = new Date();
    await team.save();
    return { searchable: team.searchable };
  }

  async exportConsumers({ name, surname }) {
    const where = { typeId: db.Typology.CONSUMER };
    const userWhere = {};

    if (name) userWhere.name = { [Op.iLike]: `%${name}%` };
    if (surname) userWhere.surname = { [Op.iLike]: `%${surname}%` };

    const rows = await db.Team.findAll({
      where,
      include: [
        {
          model: db.User,
          as: 'representative',
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          required: Object.keys(userWhere).length > 0,
          attributes: ['id', 'name', 'surname', 'email', 'enabled', 'agreeMarketing', 'agreeNewsletter', 'insertionDate']
        },
        { model: db.Typology, as: 'type', attributes: ['id', 'label'] }
      ],
      order: [['insertionDate', 'DESC']]
    });

    return rows;
  }

  async exportBusinesses({ name, surname, denomination, typeId }) {
    const where = {};
    const userWhere = {};

    if (name) userWhere.name = { [Op.iLike]: `%${name}%` };
    if (surname) userWhere.surname = { [Op.iLike]: `%${surname}%` };
    if (denomination) where.name = { [Op.iLike]: `%${denomination}%` };
    if (typeId) {
      where.typeId = typeId;
    } else {
      where.typeId = { [Op.notIn]: [db.Typology.CONSUMER, db.Typology.ADMINISTRATOR] };
    }

    const rows = await db.Team.findAll({
      where,
      include: [
        {
          model: db.User,
          as: 'representative',
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          required: Object.keys(userWhere).length > 0,
          attributes: ['id', 'name', 'surname', 'email', 'enabled', 'agreeMarketing', 'agreeNewsletter', 'insertionDate']
        },
        { model: db.Typology, as: 'type', attributes: ['id', 'label'] }
      ],
      order: [['insertionDate', 'DESC']]
    });

    return rows;
  }

  async getBusinessTypologies() {
    const typologies = await db.Typology.findAll({
      where: {
        pertinence: 'team',
        deleted: false,
        id: { [Op.notIn]: [db.Typology.CONSUMER, db.Typology.ADMINISTRATOR] }
      },
      order: [['label', 'ASC']]
    });
    return typologies;
  }
}

module.exports = new AdminService();
```

- [ ] **Step 2: Commit**

```bash
cd pinkcare-v2
git add backend/src/services/adminService.js
git commit -m "feat(admin): add admin service with consumer/business search, toggles, export"
```

---

### Task 2: Backend — Admin Controller

**Files:**
- Create: `pinkcare-v2/backend/src/controllers/adminController.js`

- [ ] **Step 1: Create the admin controller**

```javascript
const adminService = require('../services/adminService');

class AdminController {

  async getConsumers(req, res) {
    try {
      const { name, surname, page, size } = req.query;
      const result = await adminService.findConsumers({
        name,
        surname,
        page: parseInt(page) || 1,
        size: parseInt(size) || 15
      });
      res.json(result);
    } catch (error) {
      console.error('Error fetching consumers:', error);
      res.status(500).json({ error: 'Errore nel caricamento dei consumatori' });
    }
  }

  async getBusinesses(req, res) {
    try {
      const { name, surname, denomination, typeId, page, size } = req.query;
      const result = await adminService.findBusinesses({
        name,
        surname,
        denomination,
        typeId: typeId ? parseInt(typeId) : null,
        page: parseInt(page) || 1,
        size: parseInt(size) || 15
      });
      res.json(result);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      res.status(500).json({ error: 'Errore nel caricamento delle attività' });
    }
  }

  async toggleAccess(req, res) {
    try {
      const { userId } = req.params;
      const result = await adminService.toggleUserAccess(parseInt(userId));
      res.json(result);
    } catch (error) {
      console.error('Error toggling access:', error);
      res.status(500).json({ error: 'Errore nel cambio accesso' });
    }
  }

  async toggleMarketing(req, res) {
    try {
      const { userId } = req.params;
      const result = await adminService.toggleUserMarketing(parseInt(userId));
      res.json(result);
    } catch (error) {
      console.error('Error toggling marketing:', error);
      res.status(500).json({ error: 'Errore nel cambio marketing' });
    }
  }

  async toggleNewsletter(req, res) {
    try {
      const { userId } = req.params;
      const result = await adminService.toggleUserNewsletter(parseInt(userId));
      res.json(result);
    } catch (error) {
      console.error('Error toggling newsletter:', error);
      res.status(500).json({ error: 'Errore nel cambio newsletter' });
    }
  }

  async toggleSearchable(req, res) {
    try {
      const { teamId } = req.params;
      const result = await adminService.toggleTeamSearchable(parseInt(teamId));
      res.json(result);
    } catch (error) {
      console.error('Error toggling searchable:', error);
      res.status(500).json({ error: 'Errore nel cambio visibilità' });
    }
  }

  async exportConsumers(req, res) {
    try {
      const { name, surname } = req.query;
      const rows = await adminService.exportConsumers({ name, surname });

      const csvHeader = 'Data Inserimento;Nome;Cognome;Email;Accesso;Marketing;Newsletter\n';
      const csvRows = rows.map(team => {
        const u = team.representative;
        const date = u?.insertionDate ? new Date(u.insertionDate).toLocaleDateString('it-IT') : '';
        return `${date};${u?.name || ''};${u?.surname || ''};${u?.email || ''};${u?.enabled ? 'Sì' : 'No'};${u?.agreeMarketing ? 'Sì' : 'No'};${u?.agreeNewsletter ? 'Sì' : 'No'}`;
      }).join('\n');

      const csv = csvHeader + csvRows;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=consumatori_${timestamp}.csv`);
      res.send('\uFEFF' + csv);
    } catch (error) {
      console.error('Error exporting consumers:', error);
      res.status(500).json({ error: 'Errore nell\'export' });
    }
  }

  async exportBusinesses(req, res) {
    try {
      const { name, surname, denomination, typeId } = req.query;
      const rows = await adminService.exportBusinesses({
        name, surname, denomination,
        typeId: typeId ? parseInt(typeId) : null
      });

      const csvHeader = 'Data Inserimento;Tipologia;Denominazione;Nome Contatto;Cognome Contatto;Email;Accesso;Attivo\n';
      const csvRows = rows.map(team => {
        const u = team.representative;
        const date = u?.insertionDate ? new Date(u.insertionDate).toLocaleDateString('it-IT') : '';
        return `${date};${team.type?.label || ''};${team.name || ''};${u?.name || ''};${u?.surname || ''};${u?.email || ''};${u?.enabled ? 'Sì' : 'No'};${team.searchable ? 'Sì' : 'No'}`;
      }).join('\n');

      const csv = csvHeader + csvRows;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=attivita_${timestamp}.csv`);
      res.send('\uFEFF' + csv);
    } catch (error) {
      console.error('Error exporting businesses:', error);
      res.status(500).json({ error: 'Errore nell\'export' });
    }
  }

  async getTypologies(req, res) {
    try {
      const typologies = await adminService.getBusinessTypologies();
      res.json(typologies);
    } catch (error) {
      console.error('Error fetching typologies:', error);
      res.status(500).json({ error: 'Errore nel caricamento tipologie' });
    }
  }
}

module.exports = new AdminController();
```

- [ ] **Step 2: Commit**

```bash
cd pinkcare-v2
git add backend/src/controllers/adminController.js
git commit -m "feat(admin): add admin controller for consumer/business management"
```

---

### Task 3: Backend — Admin Routes + Registration in server.js

**Files:**
- Create: `pinkcare-v2/backend/src/routes/admin.js`
- Modify: `pinkcare-v2/backend/server.js`

- [ ] **Step 1: Create admin routes**

```javascript
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const AuthMiddleware = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(AuthMiddleware.verifyToken);
router.use(AuthMiddleware.requireAdmin());

// Consumer management
router.get('/consumers', adminController.getConsumers);
router.get('/consumers/export', adminController.exportConsumers);
router.put('/consumers/:userId/toggle-access', adminController.toggleAccess);
router.put('/consumers/:userId/toggle-marketing', adminController.toggleMarketing);
router.put('/consumers/:userId/toggle-newsletter', adminController.toggleNewsletter);

// Business management
router.get('/businesses', adminController.getBusinesses);
router.get('/businesses/export', adminController.exportBusinesses);
router.put('/businesses/:userId/toggle-access', adminController.toggleAccess);
router.put('/businesses/:userId/toggle-marketing', adminController.toggleMarketing);
router.put('/businesses/:userId/toggle-newsletter', adminController.toggleNewsletter);
router.put('/businesses/:teamId/toggle-searchable', adminController.toggleSearchable);

// Reference data
router.get('/typologies', adminController.getTypologies);

module.exports = router;
```

- [ ] **Step 2: Register admin routes in server.js**

Add after line 38 in `server.js`:
```javascript
const adminRoutes = require('./src/routes/admin');
```

Add after line 80 (`app.use('/api/notifications', notificationRoutes);`):
```javascript
app.use('/api/admin', adminRoutes);
```

- [ ] **Step 3: Run the backend to verify no startup errors**

Run: `cd pinkcare-v2/backend && node -e "require('./src/routes/admin')"`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
cd pinkcare-v2
git add backend/src/routes/admin.js backend/server.js
git commit -m "feat(admin): add admin routes and register in server.js"
```

---

### Task 4: Frontend — Admin API Service

**Files:**
- Create: `pinkcare-v2/frontend/src/services/adminApi.jsx`

- [ ] **Step 1: Create the admin API service**

```javascript
import { ApiClient } from '../config/api';

class AdminApi {

  static async getConsumers(filters = {}, page = 1, size = 15) {
    return ApiClient.get('/api/admin/consumers', {
      params: { ...filters, page, size }
    });
  }

  static async getBusinesses(filters = {}, page = 1, size = 15) {
    return ApiClient.get('/api/admin/businesses', {
      params: { ...filters, page, size }
    });
  }

  static async toggleAccess(type, userId) {
    const prefix = type === 'consumer' ? 'consumers' : 'businesses';
    return ApiClient.put(`/api/admin/${prefix}/${userId}/toggle-access`);
  }

  static async toggleMarketing(type, userId) {
    const prefix = type === 'consumer' ? 'consumers' : 'businesses';
    return ApiClient.put(`/api/admin/${prefix}/${userId}/toggle-marketing`);
  }

  static async toggleNewsletter(type, userId) {
    const prefix = type === 'consumer' ? 'consumers' : 'businesses';
    return ApiClient.put(`/api/admin/${prefix}/${userId}/toggle-newsletter`);
  }

  static async toggleSearchable(teamId) {
    return ApiClient.put(`/api/admin/businesses/${teamId}/toggle-searchable`);
  }

  static async exportConsumers(filters = {}) {
    return ApiClient.get('/api/admin/consumers/export', {
      params: filters,
      responseType: 'blob'
    });
  }

  static async exportBusinesses(filters = {}) {
    return ApiClient.get('/api/admin/businesses/export', {
      params: filters,
      responseType: 'blob'
    });
  }

  static async getTypologies() {
    return ApiClient.get('/api/admin/typologies');
  }
}

export default AdminApi;
```

- [ ] **Step 2: Commit**

```bash
cd pinkcare-v2
git add frontend/src/services/adminApi.jsx
git commit -m "feat(admin): add admin API service for frontend"
```

---

### Task 5: Frontend — i18n Keys

**Files:**
- Modify: `pinkcare-v2/frontend/src/locale/it.json`

- [ ] **Step 1: Add admin i18n keys**

Add after the `"notifications"` section (before the closing `}` of the JSON):

```json
  "admin": {
    "consumers": "Consumatori",
    "businesses": "Attività",
    "search_name": "Nome",
    "search_surname": "Cognome",
    "search_denomination": "Denominazione",
    "search_type": "Tipologia",
    "search_all_types": "Tutte le tipologie",
    "find": "Cerca",
    "reset": "Reset",
    "export": "Esporta",
    "insertion_date": "Data Inserimento",
    "name": "Nome",
    "surname": "Cognome",
    "age": "Età",
    "typology": "Tipologia",
    "denomination": "Denominazione",
    "access": "Consenti accesso",
    "marketing": "Marketing",
    "newsletter": "Newsletter",
    "searchable": "Attivo",
    "no_results": "Nessun risultato trovato",
    "previous": "Precedente",
    "next": "Successivo",
    "page": "Pagina",
    "of": "di",
    "toggle_success": "Modifica effettuata",
    "toggle_error": "Errore nella modifica",
    "export_error": "Errore nell'export"
  }
```

- [ ] **Step 2: Commit**

```bash
cd pinkcare-v2
git add frontend/src/locale/it.json
git commit -m "feat(admin): add Italian i18n keys for admin panel"
```

---

### Task 6: Frontend — ConsumerList Component

**Files:**
- Create: `pinkcare-v2/frontend/src/components/pages/Admin/ConsumerList.jsx`

- [ ] **Step 1: Create ConsumerList component**

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import AdminApi from '../../../services/adminApi';

const ConsumerList = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState({ name: '', surname: '' });
  const [appliedFilters, setAppliedFilters] = useState({ name: '', surname: '' });
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1, size: 15, total: 0, totalPages: 0, hasNext: false, hasPrevious: false
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (currentFilters, page = 1) => {
    try {
      setLoading(true);
      const result = await AdminApi.getConsumers(currentFilters, page, 15);
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
      console.error('Error fetching consumers:', error);
      toast.error(t('admin.toggle_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData(appliedFilters);
  }, [fetchData, appliedFilters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedFilters({ ...filters });
  };

  const handleReset = () => {
    setFilters({ name: '', surname: '' });
    setAppliedFilters({ name: '', surname: '' });
  };

  const handleToggleAccess = async (userId) => {
    try {
      await AdminApi.toggleAccess('consumer', userId);
      toast.success(t('admin.toggle_success'));
      fetchData(appliedFilters, pagination.page);
    } catch (error) {
      toast.error(t('admin.toggle_error'));
    }
  };

  const handleToggleMarketing = async (userId) => {
    try {
      await AdminApi.toggleMarketing('consumer', userId);
      toast.success(t('admin.toggle_success'));
      fetchData(appliedFilters, pagination.page);
    } catch (error) {
      toast.error(t('admin.toggle_error'));
    }
  };

  const handleToggleNewsletter = async (userId) => {
    try {
      await AdminApi.toggleNewsletter('consumer', userId);
      toast.success(t('admin.toggle_success'));
      fetchData(appliedFilters, pagination.page);
    } catch (error) {
      toast.error(t('admin.toggle_error'));
    }
  };

  const handleExport = async () => {
    try {
      const blob = await AdminApi.exportConsumers(appliedFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `consumatori_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(t('admin.export_error'));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('it-IT');
  };

  return (
    <div className="admin-list">
      {/* Search form */}
      <form className="admin-search-form" onSubmit={handleSearch}>
        <div className="admin-search-fields">
          <input
            type="text"
            placeholder={t('admin.search_name')}
            value={filters.name}
            onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
          />
          <input
            type="text"
            placeholder={t('admin.search_surname')}
            value={filters.surname}
            onChange={(e) => setFilters(prev => ({ ...prev, surname: e.target.value }))}
          />
        </div>
        <div className="admin-search-actions">
          <button type="submit" className="btn btn-primary">{t('admin.find')}</button>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>{t('admin.reset')}</button>
          <button type="button" className="btn btn-export" onClick={handleExport}>
            <i className="fas fa-file-export"></i> {t('admin.export')}
          </button>
        </div>
      </form>

      {/* Data table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="admin-empty">{t('admin.no_results')}</div>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.insertion_date')}</th>
                <th>{t('admin.name')}</th>
                <th>{t('admin.surname')}</th>
                <th>{t('admin.access')}</th>
                <th>{t('admin.marketing')}</th>
                <th>{t('admin.newsletter')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((team) => {
                const user = team.representative;
                if (!user) return null;
                return (
                  <tr key={team.id}>
                    <td>{formatDate(user.insertionDate)}</td>
                    <td>{user.name}</td>
                    <td>{user.surname}</td>
                    <td>
                      <button
                        className={`toggle-btn ${user.enabled ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleAccess(user.id)}
                      >
                        {user.enabled ? 'Sì' : 'No'}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`toggle-btn ${user.agreeMarketing ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleMarketing(user.id)}
                      >
                        {user.agreeMarketing ? 'Sì' : 'No'}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`toggle-btn ${user.agreeNewsletter ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleNewsletter(user.id)}
                      >
                        {user.agreeNewsletter ? 'Sì' : 'No'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="admin-pagination">
            <button
              className="btn btn-secondary"
              disabled={!pagination.hasPrevious}
              onClick={() => fetchData(appliedFilters, pagination.page - 1)}
            >
              {t('admin.previous')}
            </button>
            <span>{t('admin.page')} {pagination.page} {t('admin.of')} {pagination.totalPages}</span>
            <button
              className="btn btn-secondary"
              disabled={!pagination.hasNext}
              onClick={() => fetchData(appliedFilters, pagination.page + 1)}
            >
              {t('admin.next')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ConsumerList;
```

- [ ] **Step 2: Commit**

```bash
cd pinkcare-v2
git add frontend/src/components/pages/Admin/ConsumerList.jsx
git commit -m "feat(admin): add ConsumerList component with search, toggles, export, pagination"
```

---

### Task 7: Frontend — BusinessList Component

**Files:**
- Create: `pinkcare-v2/frontend/src/components/pages/Admin/BusinessList.jsx`

- [ ] **Step 1: Create BusinessList component**

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import AdminApi from '../../../services/adminApi';

const BusinessList = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState({ name: '', surname: '', denomination: '', typeId: '' });
  const [appliedFilters, setAppliedFilters] = useState({ name: '', surname: '', denomination: '', typeId: '' });
  const [typologies, setTypologies] = useState([]);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1, size: 15, total: 0, totalPages: 0, hasNext: false, hasPrevious: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTypologies = async () => {
      try {
        const data = await AdminApi.getTypologies();
        setTypologies(data);
      } catch (error) {
        console.error('Error loading typologies:', error);
      }
    };
    loadTypologies();
  }, []);

  const fetchData = useCallback(async (currentFilters, page = 1) => {
    try {
      setLoading(true);
      const result = await AdminApi.getBusinesses(currentFilters, page, 15);
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
      console.error('Error fetching businesses:', error);
      toast.error(t('admin.toggle_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData(appliedFilters);
  }, [fetchData, appliedFilters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedFilters({ ...filters });
  };

  const handleReset = () => {
    const empty = { name: '', surname: '', denomination: '', typeId: '' };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  const handleToggleAccess = async (userId) => {
    try {
      await AdminApi.toggleAccess('business', userId);
      toast.success(t('admin.toggle_success'));
      fetchData(appliedFilters, pagination.page);
    } catch (error) {
      toast.error(t('admin.toggle_error'));
    }
  };

  const handleToggleMarketing = async (userId) => {
    try {
      await AdminApi.toggleMarketing('business', userId);
      toast.success(t('admin.toggle_success'));
      fetchData(appliedFilters, pagination.page);
    } catch (error) {
      toast.error(t('admin.toggle_error'));
    }
  };

  const handleToggleNewsletter = async (userId) => {
    try {
      await AdminApi.toggleNewsletter('business', userId);
      toast.success(t('admin.toggle_success'));
      fetchData(appliedFilters, pagination.page);
    } catch (error) {
      toast.error(t('admin.toggle_error'));
    }
  };

  const handleToggleSearchable = async (teamId) => {
    try {
      await AdminApi.toggleSearchable(teamId);
      toast.success(t('admin.toggle_success'));
      fetchData(appliedFilters, pagination.page);
    } catch (error) {
      toast.error(t('admin.toggle_error'));
    }
  };

  const handleExport = async () => {
    try {
      const blob = await AdminApi.exportBusinesses(appliedFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attivita_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(t('admin.export_error'));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('it-IT');
  };

  return (
    <div className="admin-list">
      {/* Search form */}
      <form className="admin-search-form" onSubmit={handleSearch}>
        <div className="admin-search-fields">
          <input
            type="text"
            placeholder={t('admin.search_name')}
            value={filters.name}
            onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
          />
          <input
            type="text"
            placeholder={t('admin.search_surname')}
            value={filters.surname}
            onChange={(e) => setFilters(prev => ({ ...prev, surname: e.target.value }))}
          />
          <input
            type="text"
            placeholder={t('admin.search_denomination')}
            value={filters.denomination}
            onChange={(e) => setFilters(prev => ({ ...prev, denomination: e.target.value }))}
          />
          <select
            value={filters.typeId}
            onChange={(e) => setFilters(prev => ({ ...prev, typeId: e.target.value }))}
          >
            <option value="">{t('admin.search_all_types')}</option>
            {typologies.map(typ => (
              <option key={typ.id} value={typ.id}>{typ.label}</option>
            ))}
          </select>
        </div>
        <div className="admin-search-actions">
          <button type="submit" className="btn btn-primary">{t('admin.find')}</button>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>{t('admin.reset')}</button>
          <button type="button" className="btn btn-export" onClick={handleExport}>
            <i className="fas fa-file-export"></i> {t('admin.export')}
          </button>
        </div>
      </form>

      {/* Data table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="admin-empty">{t('admin.no_results')}</div>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.insertion_date')}</th>
                <th>{t('admin.typology')}</th>
                <th>{t('admin.denomination')}</th>
                <th>{t('admin.access')}</th>
                <th>{t('admin.searchable')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((team) => {
                const user = team.representative;
                return (
                  <tr key={team.id}>
                    <td>{formatDate(user?.insertionDate)}</td>
                    <td>{team.type?.label || ''}</td>
                    <td>{team.name || ''}</td>
                    <td>
                      <button
                        className={`toggle-btn ${user?.enabled ? 'active' : 'inactive'}`}
                        onClick={() => user && handleToggleAccess(user.id)}
                      >
                        {user?.enabled ? 'Sì' : 'No'}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`toggle-btn ${team.searchable ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleSearchable(team.id)}
                      >
                        {team.searchable ? 'Sì' : 'No'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="admin-pagination">
            <button
              className="btn btn-secondary"
              disabled={!pagination.hasPrevious}
              onClick={() => fetchData(appliedFilters, pagination.page - 1)}
            >
              {t('admin.previous')}
            </button>
            <span>{t('admin.page')} {pagination.page} {t('admin.of')} {pagination.totalPages}</span>
            <button
              className="btn btn-secondary"
              disabled={!pagination.hasNext}
              onClick={() => fetchData(appliedFilters, pagination.page + 1)}
            >
              {t('admin.next')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BusinessList;
```

- [ ] **Step 2: Commit**

```bash
cd pinkcare-v2
git add frontend/src/components/pages/Admin/BusinessList.jsx
git commit -m "feat(admin): add BusinessList component with search, toggles, export, pagination"
```

---

### Task 8: Frontend — Admin Page Container (Tab Navigation)

**Files:**
- Create: `pinkcare-v2/frontend/src/components/pages/Admin/Administration.jsx`
- Create: `pinkcare-v2/frontend/src/components/pages/Admin/Administration.css`

- [ ] **Step 1: Create Administration page with tab navigation**

```jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ConsumerList from './ConsumerList';
import BusinessList from './BusinessList';
import './Administration.css';

const Administration = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam ? parseInt(tabParam, 10) : 0;
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam !== null) {
      setActiveTab(parseInt(tabParam, 10));
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab: tab.toString() });
  };

  return (
    <div className="admin-page">
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 0 ? 'active' : ''}`}
          onClick={() => handleTabChange(0)}
        >
          <i className="fas fa-users"></i>
          {t('admin.consumers')}
        </button>
        <button
          className={`admin-tab ${activeTab === 1 ? 'active' : ''}`}
          onClick={() => handleTabChange(1)}
        >
          <i className="fas fa-building"></i>
          {t('admin.businesses')}
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 0 && <ConsumerList />}
        {activeTab === 1 && <BusinessList />}
      </div>
    </div>
  );
};

export default Administration;
```

- [ ] **Step 2: Create Administration CSS**

```css
.admin-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 20px;
}

.admin-tab {
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s, border-color 0.2s;
}

.admin-tab:hover {
  color: #e91e63;
}

.admin-tab.active {
  color: #e91e63;
  border-bottom-color: #e91e63;
}

/* Search form */
.admin-search-form {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.admin-search-fields {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.admin-search-fields input,
.admin-search-fields select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  flex: 1;
  min-width: 150px;
}

.admin-search-actions {
  display: flex;
  gap: 8px;
}

.admin-search-actions .btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: #e91e63;
  color: white;
}

.btn-primary:hover {
  background: #c2185b;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #bdbdbd;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-export {
  background: #4caf50;
  color: white;
}

.btn-export:hover {
  background: #388e3c;
}

/* Table */
.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.admin-table thead {
  background: #f5f5f5;
}

.admin-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  color: #555;
  border-bottom: 2px solid #e0e0e0;
}

.admin-table td {
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.admin-table tr:hover {
  background: #fafafa;
}

/* Toggle button */
.toggle-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background 0.2s;
}

.toggle-btn.active {
  background: #c8e6c9;
  color: #2e7d32;
}

.toggle-btn.inactive {
  background: #ffcdd2;
  color: #c62828;
}

.toggle-btn:hover {
  opacity: 0.8;
}

/* Pagination */
.admin-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding: 12px;
}

.admin-pagination span {
  font-size: 14px;
  color: #666;
}

/* Loading & empty */
.loading-container {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.admin-empty {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-search-fields {
    flex-direction: column;
  }

  .admin-search-fields input,
  .admin-search-fields select {
    min-width: 100%;
  }

  .admin-table {
    font-size: 12px;
  }

  .admin-table th,
  .admin-table td {
    padding: 8px;
  }
}
```

- [ ] **Step 3: Commit**

```bash
cd pinkcare-v2
git add frontend/src/components/pages/Admin/Administration.jsx frontend/src/components/pages/Admin/Administration.css
git commit -m "feat(admin): add Administration page container with tab navigation and styles"
```

---

### Task 9: Frontend — Route Registration in App.jsx

**Files:**
- Modify: `pinkcare-v2/frontend/src/App.jsx`

- [ ] **Step 1: Add lazy import for Administration**

Add after line 35 (`const Business = lazy(...)`) in `App.jsx`:

```javascript
const Administration = lazy(() => import("./components/pages/Admin/Administration"));
```

- [ ] **Step 2: Add protected route for /administration**

Add after the `/business` route block (after line 128) in `App.jsx`:

```jsx
          <Route path="/administration" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AuthenticatedLayout>
                <Administration />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } />
```

- [ ] **Step 3: Fix ProtectedRoute role check for ADMIN**

The existing `ProtectedRoute.jsx` checks `user?.role !== requiredRole` where `role` comes from `determineUserRole()` in `AuthContext.jsx`. The `determineUserRole` function checks for `ROLE_ADMIN` but the legacy uses `ROLE_PINKCARE`.

In `pinkcare-v2/frontend/src/context/AuthContext.jsx`, update the `determineUserRole` function:

Replace:
```javascript
  if (roleNames.includes('ROLE_ADMIN')) return 'ADMIN';
```

With:
```javascript
  if (roleNames.includes('ROLE_ADMIN') || roleNames.includes('ROLE_PINKCARE') || roleNames.includes('ROLE_ADMINISTRATION_SECTION')) return 'ADMIN';
```

- [ ] **Step 4: Verify the frontend builds**

Run: `cd pinkcare-v2/frontend && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Commit**

```bash
cd pinkcare-v2
git add frontend/src/App.jsx frontend/src/context/AuthContext.jsx
git commit -m "feat(admin): register /administration route and fix ADMIN role detection for ROLE_PINKCARE"
```

---

### Task 10: End-to-End Verification

- [ ] **Step 1: Start the backend and verify admin endpoints respond**

Run: `cd pinkcare-v2/backend && npm run dev:local`

Test with curl (replace `<TOKEN>` with a valid admin JWT):
```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3001/api/admin/consumers?page=1&size=5
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3001/api/admin/businesses?page=1&size=5
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3001/api/admin/typologies
```

Expected: JSON responses with `items`, `total`, `page`, `totalPages` fields.

- [ ] **Step 2: Start the frontend and verify the admin page renders**

Run: `cd pinkcare-v2/frontend && npm run dev`

Navigate to `http://localhost:3000/administration?tab=0` (logged in as admin).
Expected: Consumer list with search form, table, pagination.

Navigate to `http://localhost:3000/administration?tab=1`.
Expected: Business list with search form, type filter, table, pagination.

- [ ] **Step 3: Verify toggle operations work**

Click toggle buttons for access, marketing, newsletter on a consumer row.
Expected: Toast "Modifica effettuata", button state updates.

Click toggle buttons for access and searchable on a business row.
Expected: Same behavior.

- [ ] **Step 4: Verify export works**

Click "Esporta" on consumer tab.
Expected: CSV file downloads with consumer data.

Click "Esporta" on business tab.
Expected: CSV file downloads with business data.

- [ ] **Step 5: Verify navigation menu links work**

Check that UTENTI link in header navigates to `/administration?tab=0`.
Check that NETWORK link in header navigates to `/administration?tab=1`.
Expected: Links already exist in AuthenticatedHeader.jsx (lines 245-263) and work correctly.
