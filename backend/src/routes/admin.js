const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const AuthMiddleware = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(AuthMiddleware.verifyToken);
router.use(AuthMiddleware.requireAdmin);

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
router.get('/businesses/:teamId/profile', adminController.getBusinessProfile);
router.put('/businesses/:teamId/approve-field', adminController.approveField);
router.put('/businesses/:teamId/reject-field', adminController.rejectField);
router.put('/businesses/:teamId/validate-exam-pathology/:tepId', adminController.validateExamPathology);
router.put('/businesses/:teamId/reject-exam-pathology/:tepId', adminController.rejectExamPathology);

// Reference data
router.get('/typologies', adminController.getTypologies);

// Collaborators management
router.get('/collaborators', adminController.getCollaborators);
router.post('/collaborators', adminController.createCollaborator);
router.put('/collaborators/:userId', adminController.updateCollaborator);
router.delete('/collaborators/:userId', adminController.deleteCollaborator);

// Collaborator roles management
router.get('/collaborators/:userId/roles', adminController.getCollaboratorRoles);
router.get('/collaborators/:userId/assignable-roles', adminController.getAssignableRoles);
router.post('/collaborators/:userId/roles', adminController.addRoleToUser);
router.put('/collaborators/:userId/roles/:roleId', adminController.updateUserRolePermissions);
router.delete('/collaborators/:userId/roles/:roleId', adminController.removeRoleFromUser);

// Blog categories management
router.get('/blog-categories', adminController.getBlogCategories);
router.post('/blog-categories', adminController.createBlogCategory);
router.put('/blog-categories/:id', adminController.updateBlogCategory);
router.delete('/blog-categories/:id', adminController.deleteBlogCategory);

// Examinations management
router.get('/examinations', adminController.getExaminations);
router.post('/examinations', adminController.createExamination);
router.put('/examinations/:id', adminController.updateExamination);
router.delete('/examinations/:id', adminController.deleteExamination);

// Pathologies management
router.get('/pathologies', adminController.getPathologies);
router.post('/pathologies', adminController.createPathology);
router.put('/pathologies/:id', adminController.updatePathology);
router.delete('/pathologies/:id', adminController.deletePathology);

module.exports = router;
