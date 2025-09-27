const express = require('express');
const referenceController = require('../controllers/referenceController');

const router = express.Router();

router.get('/medical-titles', referenceController.getMedicalTitles.bind(referenceController));

router.get('/municipalities', referenceController.searchMunicipalities.bind(referenceController));

module.exports = router;
