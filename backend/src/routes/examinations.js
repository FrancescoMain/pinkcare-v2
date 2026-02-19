const express = require('express');
const { body, param } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const examinationController = require('../controllers/examinationController');
const AuthMiddleware = require('../middleware/auth');

// Multer config for file uploads — use /tmp on Vercel (read-only filesystem)
const isVercel = !!process.env.VERCEL;
const uploadDir = isVercel
  ? '/tmp/uploads/examinations'
  : path.join(__dirname, '../../uploads/examinations');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.trim().replace(/ /g, '_');
    cb(null, `${timestamp}_${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

/**
 * Examination Routes
 * All routes require authentication
 */

// Get age-based examinations
router.get('/age-based',
  AuthMiddleware.verifyToken,
  examinationController.getAgeExaminations
);

// Get routine examinations
router.get('/routine',
  AuthMiddleware.verifyToken,
  examinationController.getRoutineExaminations
);

// Get screening-based examinations
router.get('/screening',
  AuthMiddleware.verifyToken,
  examinationController.getScreeningExaminations
);

// Get current prenatal examinations
router.get('/prenatal',
  AuthMiddleware.verifyToken,
  examinationController.getPrenatalExaminations
);

// Get next prenatal examinations
router.get('/prenatal-next',
  AuthMiddleware.verifyToken,
  examinationController.getNextPrenatalExaminations
);

// Get suggested (unconfirmed) examinations for history page
router.get('/suggested',
  AuthMiddleware.verifyToken,
  examinationController.getSuggestedExaminations
);

// Get examination history (confirmed exams)
router.get('/history',
  AuthMiddleware.verifyToken,
  examinationController.getExaminationHistory
);

// Get attachments for an examination
router.get('/:id/attachments',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt().withMessage('ID esame deve essere un intero')
  ],
  examinationController.getAttachments
);

// Upload attachment for an examination
router.post('/:id/attachments',
  AuthMiddleware.verifyToken,
  upload.single('file'),
  examinationController.uploadAttachment
);

// Download an attachment
router.get('/attachments/:id/download',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt().withMessage('ID allegato deve essere un intero')
  ],
  examinationController.downloadAttachment
);

// Delete an attachment
router.delete('/attachments/:id',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt().withMessage('ID allegato deve essere un intero')
  ],
  examinationController.deleteAttachment
);

// Mark/update exam date
router.put('/:id/date',
  AuthMiddleware.verifyToken,
  [
    body('controlDate')
      .notEmpty().withMessage('La data di controllo è obbligatoria')
      .isISO8601().withMessage('La data deve essere in formato ISO 8601'),
    body('examinationId')
      .optional()
      .isInt().withMessage('examinationId deve essere un intero')
  ],
  examinationController.markExamDate
);

// Confirm examination
router.put('/:id/confirm',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt().withMessage('ID esame deve essere un intero'),
    body('note')
      .optional()
  ],
  examinationController.confirmExamination
);

// Remove date from examination
router.put('/:id/remove-date',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt().withMessage('ID esame deve essere un intero')
  ],
  examinationController.removeDate
);

// Toggle archive screening
router.put('/screening/:id/archive',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt().withMessage('ID screening deve essere un intero')
  ],
  examinationController.toggleArchiveScreening
);

module.exports = router;
