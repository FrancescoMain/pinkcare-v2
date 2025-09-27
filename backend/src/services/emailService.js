const nodemailer = require('nodemailer');

/**
 * Email service for sending notifications
 * Replicates Java EmailServiceImpl functionality
 */
class EmailService {
  constructor() {
    // Configuration that matches the old Java system
    this.transporter = null;
    this.init();
  }

  init() {
    // SMTP configuration matching application.properties from old Java system
    const config = {
      host: process.env.SMTP_HOST || 'smtps.aruba.it',
      port: process.env.SMTP_PORT || 465,
      secure: true, // true for 465, false for other ports like 587
      auth: {
        user: process.env.SMTP_USER || 'no-reply@pinkcare.it',
        pass: process.env.SMTP_PASS || 'server20!'
      }
    };

    this.transporter = nodemailer.createTransport(config);
    
    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.log('Email service configuration error:', error);
      } else {
        console.log('Email service ready');
      }
    });
  }

  /**
   * Send registration confirmation email
   * @param {string} email - Recipient email
   * @param {string} name - User name
   * @param {string} confirmationToken - Confirmation token
   */
  async sendRegistrationConfirmation(email, name, confirmationToken) {
    if (!this.transporter) {
      console.log('Email service not configured');
      return false;
    }

    const confirmationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/confirm-email?token=${confirmationToken}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'PINKCARE <no-reply@pinkcare.it>',
      to: email,
      subject: 'Conferma registrazione PinkCare',
      html: `
        <h2>Ciao ${name},</h2>
        <p>Grazie per esserti registrato su PinkCare!</p>
        <p>Per completare la registrazione, clicca sul link seguente:</p>
        <a href="${confirmationUrl}">Conferma la tua email</a>
        <p>Se non hai richiesto questa registrazione, puoi ignorare questa email.</p>
        <p>Il team PinkCare</p>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Registration email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending registration email:', error);
      return false;
    }
  }

  /**
   * Send welcome email replicating legacy behaviour
   * @param {string} email - Recipient email
   * @param {string} fullName - Recipient full name
   * @param {string} plainPassword - Password chosen during registration
   */
  async sendWelcomeEmail(email, fullName, plainPassword) {
    if (!this.transporter) {
      console.log('Email service not configured');
      return false;
    }

    const siteUrl = process.env.APP_URL || 'https://www.pinkcare.it';
    const loginUrl = `${siteUrl.replace(/\/$/, '')}/login`;

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'PINKCARE <no-reply@pinkcare.it>',
      to: email,
      subject: 'Benvenuto su PinkCare',
      html: `
        <p>Gentile <strong>${fullName || 'utente'}</strong>,</p>
        <p>il tuo account è stato correttamente attivato.</p>
        <p>Questi sono i tuoi dati d'accesso:</p>
        <p>Username: <strong>${email}</strong><br/>Password: <strong>${plainPassword}</strong></p>
        <p>Per accedere visita il seguente indirizzo:<br/>
        <a href="${loginUrl}">${loginUrl}</a></p>
        <p>Il team PinkCare</p>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  /**
   * Send password recovery email
   * @param {string} email - Recipient email
   * @param {string} name - User name
   * @param {string} recoveryToken - Recovery token
   */
  async sendPasswordRecovery(email, name, recoveryToken) {
    if (!this.transporter) {
      console.log('Email service not configured');
      return false;
    }

    const recoveryUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${recoveryToken}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'PINKCARE <no-reply@pinkcare.it>',
      to: email,
      subject: 'Recupero password PinkCare',
      html: `
        <h2>Ciao ${name},</h2>
        <p>Hai richiesto il recupero della password per il tuo account PinkCare.</p>
        <p>Clicca sul link seguente per reimpostare la password:</p>
        <a href="${recoveryUrl}">Reimposta password</a>
        <p>Questo link scadrà tra 24 ore.</p>
        <p>Se non hai richiesto il recupero password, puoi ignorare questa email.</p>
        <p>Il team PinkCare</p>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password recovery email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending password recovery email:', error);
      return false;
    }
  }

  /**
   * Send generic notification email
   * @param {string} email - Recipient email
   * @param {string} subject - Email subject
   * @param {string} message - Email message
   */
  async sendNotification(email, subject, message) {
    if (!this.transporter) {
      console.log('Email service not configured');
      return false;
    }
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'PINKCARE <no-reply@pinkcare.it>',
      to: email,
      subject: subject,
      html: message
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Notification email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending notification email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
