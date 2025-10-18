const { body } = require('express-validator');

/**
 * Validation middleware for API endpoints
 * Based on validation rules from Java model and frontend forms
 */
class ValidationMiddleware {
  
  /**
   * Validation rules for user registration
   */
  static validateRegistration = [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Nome è obbligatorio')
      .isLength({ min: 2, max: 50 })
      .withMessage('Nome deve essere tra 2 e 50 caratteri'),
      
    body('surname')
      .trim()
      .notEmpty()
      .withMessage('Cognome è obbligatorio')
      .isLength({ min: 2, max: 50 })
      .withMessage('Cognome deve essere tra 2 e 50 caratteri'),
      
    body('email')
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage('Email non valida'),
      
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password deve essere di almeno 8 caratteri')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d_@.\/#!?&*+\-]{8,}$/)
      .withMessage('Formato password non corretto'),

    body('birthday')
      .optional()
      .isDate()
      .withMessage('Data di nascita non valida'),

    body('gender')
      .optional({ nullable: true })
      .isIn(['true', 'false', true, false, null])
      .withMessage('Genere non valido'),
      
    body('nickName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage('Nick name deve essere tra 2 e 30 caratteri'),
      
    body('agreeConditionAndPrivacy')
      .equals('true')
      .withMessage('Devi accettare i termini e condizioni per il trattamento dei dati sensibili'),
      
    body('agreeMarketing')
      .optional()
      .isBoolean()
      .withMessage('Consenso marketing non valido'),
      
    body('agreeNewsletter')
      .optional()
      .isBoolean()
      .withMessage('Consenso newsletter non valido'),
      
    body('mobilePhone')
      .optional({ checkFalsy: true })
      .trim()
      .isMobilePhone('it-IT')
      .withMessage('Numero di telefono non valido')
  ];

  /**
   * Validation rules for business registration (doctor/clinic)
   */
  static validateBusinessRegistration = [
    body('businessType')
      .trim()
      .notEmpty()
      .withMessage('Tipo struttura obbligatorio')
      .isIn(['DOCTOR', 'CLINIC', 'doctor', 'clinic'])
      .withMessage('Tipo struttura non valido'),

    body('name')
      .trim()
      .notEmpty()
      .withMessage('Nome è obbligatorio')
      .isLength({ min: 2, max: 50 })
      .withMessage('Nome deve essere tra 2 e 50 caratteri'),

    body('surname')
      .trim()
      .notEmpty()
      .withMessage('Cognome è obbligatorio')
      .isLength({ min: 2, max: 50 })
      .withMessage('Cognome deve essere tra 2 e 50 caratteri'),

    body('email')
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage('Email non valida'),

    body('password')
      .isLength({ min: 8 })
      .withMessage('Password deve essere di almeno 8 caratteri')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d_@.\/#!?&*+\-]{8,}$/)
      .withMessage('Formato password non corretto'),

    body('gender')
      .optional({ nullable: true })
      .isIn(['true', 'false', true, false, null])
      .withMessage('Genere non valido'),

    body('nickName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage('Nick name deve essere tra 2 e 30 caratteri'),

    body('structureName')
      .if((value, { req }) => (req.body.businessType || '').toUpperCase() === 'CLINIC')
      .trim()
      .notEmpty()
      .withMessage('Nome struttura obbligatorio')
      .isLength({ min: 2, max: 120 })
      .withMessage('Nome struttura deve essere tra 2 e 120 caratteri'),

    body('medicalTitle')
      .if((value, { req }) => (req.body.businessType || '').toUpperCase() === 'DOCTOR')
      .trim()
      .notEmpty()
      .withMessage('Specializzazione obbligatoria'),

    body('address.streetType')
      .trim()
      .notEmpty()
      .withMessage('Tipologia indirizzo obbligatoria'),

    body('address.street')
      .trim()
      .notEmpty()
      .withMessage('Via obbligatoria'),

    body('address.streetNumber')
      .trim()
      .notEmpty()
      .withMessage('Civico obbligatorio'),

    body('address.postCode')
      .trim()
      .notEmpty()
      .withMessage('CAP obbligatorio')
      .isLength({ min: 4, max: 10 })
      .withMessage('CAP non valido'),

    body('address.municipality')
      .trim()
      .notEmpty()
      .withMessage('Comune obbligatorio'),

    body('address.province')
      .trim()
      .notEmpty()
      .withMessage('Provincia obbligatoria')
      .isLength({ min: 2, max: 2 })
      .withMessage('Provincia deve essere sigla di due lettere'),

    body('agreeConditionAndPrivacy')
      .custom(value => value === true || value === 'true')
      .withMessage('Devi accettare i termini e condizioni per il trattamento dei dati sensibili'),

    body('agreeToBeShown')
      .custom(value => value === true || value === 'true')
      .withMessage('Devi acconsentire ad essere visibile sul portale'),

    body('agreeMarketing')
      .optional()
      .isBoolean()
      .withMessage('Consenso marketing non valido'),

    body('agreeNewsletter')
      .optional()
      .isBoolean()
      .withMessage('Consenso newsletter non valido'),

    body('mobilePhone')
      .optional({ checkFalsy: true })
      .trim()
      .isMobilePhone('it-IT')
      .withMessage('Numero di telefono non valido')
  ];
  
  /**
   * Validation rules for user login
   */
  static validateLogin = [
    body('email')
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage('Email non valida'),
      
    body('password')
      .notEmpty()
      .withMessage('Password è obbligatoria'),
      
    body('rememberMe')
      .optional()
      .isBoolean()
      .withMessage('Remember me deve essere boolean')
  ];
  
  /**
   * Validation rules for password recovery request
   */
  static validateForgotPassword = [
    body('email')
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage('Email non valida')
      .normalizeEmail()
  ];
  
  /**
   * Validation rules for password reset
   */
  static validateResetPassword = [
    body('token')
      .notEmpty()
      .withMessage('Token di recupero obbligatorio')
      .isLength({ min: 10 })
      .withMessage('Token non valido'),

    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password deve essere di almeno 8 caratteri')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d_@.\/#\+\-]{8,}$/)
      .withMessage('Formato password non corretto')
  ];

  /**
   * Validation rules for password change
   */
  static validateChangePassword = [
    body('currentPassword')
      .notEmpty()
      .withMessage('Password attuale obbligatoria'),

    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('La nuova password deve essere di almeno 8 caratteri')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d_@.\/#\+\-]{8,}$/)
      .withMessage('La password deve contenere almeno una lettera e un numero')
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('La nuova password deve essere diversa da quella attuale');
        }
        return true;
      })
  ];

  /**
   * Validation rules for profile update
   */
  static validateProfileUpdate = [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Nome deve essere tra 2 e 50 caratteri'),
      
    body('surname')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Cognome deve essere tra 2 e 50 caratteri'),
      
    body('nickName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage('Nick name deve essere tra 2 e 30 caratteri'),
      
    body('birthday')
      .optional()
      .isDate()
      .withMessage('Data di nascita non valida'),
      
    body('gender')
      .optional()
      .isIn(['true', 'false', true, false])
      .withMessage('Genere non valido'),
      
    body('mobilePhone')
      .optional({ checkFalsy: true })
      .trim()
      .isMobilePhone('it-IT')
      .withMessage('Numero di telefono non valido'),
      
    body('weight')
      .optional()
      .isFloat({ min: 30, max: 300 })
      .withMessage('Peso deve essere tra 30 e 300 kg'),
      
    body('height')
      .optional()
      .isFloat({ min: 100, max: 250 })
      .withMessage('Altezza deve essere tra 100 e 250 cm'),
      
    body('sedentaryLifestyle')
      .optional()
      .isBoolean()
      .withMessage('Stile di vita sedentario deve essere boolean'),
      
    body('ageFirstMenstruation')
      .optional()
      .isInt({ min: 8, max: 20 })
      .withMessage('Età prima mestruazione deve essere tra 8 e 20 anni'),
      
    body('regularityMenstruation')
      .optional()
      .isBoolean()
      .withMessage('Regolarità mestruazione deve essere boolean'),
      
    body('durationMenstruation')
      .optional()
      .isInt({ min: 1, max: 15 })
      .withMessage('Durata mestruazione deve essere tra 1 e 15 giorni'),
      
    body('durationPeriod')
      .optional()
      .isInt({ min: 15, max: 45 })
      .withMessage('Durata ciclo deve essere tra 15 e 45 giorni'),
      
    body('surgery')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Campo chirurgie troppo lungo'),
      
    body('medicine')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Campo farmaci troppo lungo'),
      
    body('agreeMarketing')
      .optional()
      .isBoolean()
      .withMessage('Consenso marketing non valido'),
      
    body('agreeNewsletter')
      .optional()
      .isBoolean()
      .withMessage('Consenso newsletter non valido')
  ];

  /**
   * Validation rules for password change
   * Based on legacy personal_form.xhtml password validation
   */
  static validatePasswordChange = [
    body('currentPassword')
      .notEmpty()
      .withMessage('Password attuale è obbligatoria'),

    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('La nuova password deve essere di almeno 8 caratteri')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d_@.\/#\+\-]{8,}$/)
      .withMessage('Formato password non corretto (almeno 8 caratteri alfanumerici)'),

    body('confirmPassword')
      .notEmpty()
      .withMessage('Conferma password è obbligatoria')
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage('Le password non corrispondono')
  ];
}

module.exports = ValidationMiddleware;
