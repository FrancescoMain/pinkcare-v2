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
   * Get email template parts (replicating legacy getPartTemplateEmail)
   * @param {string} part - 'parte_1' or 'parte_2'
   * @returns {string} HTML template part
   */
  getPartTemplateEmail(part) {
    const url = process.env.APP_URL || 'https://www.pinkcare.it';

    const parte_1 = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>PINKCARE</title>
</head>

<body>
<table style="margin:0 auto;width:680px;border:0;padding:0;border-spacing: 0;">
<tr style="margin:3px 0 0 3px;background: #e42080;">
<td><img style="height:55px; width:163px" src="${url}/styles/public/upload/base-logo-mail.png" /></td>
</tr>
<tr>
<td style="border: 3px solid #e42080;padding: 20px;height: 350px;">
<div>`;

    const parte_2 = `<br />
Cordiali saluti<br /><br />
<strong style="line-height:30px">Servizio clienti PINKCARE</strong><br />
<br style="line-height:20px;" />
</div>
</td>
</tr>
</table>
</body>
</html>`;

    if (part === 'parte_1') {
      return parte_1;
    } else if (part === 'parte_2') {
      return parte_2;
    }

    return '';
  }

  /**
   * Send welcome email replicating legacy behaviour
   * Replicates EmailServiceImpl.sendWelcomeEmail() exactly
   * @param {string} email - Recipient email
   * @param {string} fullName - Recipient full name
   * @param {string} plainPassword - Password chosen during registration
   */
  async sendWelcomeEmail(email, fullName, plainPassword) {
    if (!this.transporter) {
      console.log('Email service not configured');
      return false;
    }

    const url = process.env.APP_URL || 'https://www.pinkcare.it';
    const loginUrl = `${url}/login`;

    // Build email body exactly like legacy EmailServiceImpl.sendWelcomeEmail()
    let testo = '';
    testo += this.getPartTemplateEmail('parte_1');
    testo += `Gentile <strong> ${fullName || 'utente'},</strong><br /> `;
    testo += ` il suo account &egrave; stato correttamente attivato. `;
    testo += `<br />`;
    testo += `<br />`;
    testo += `Questi sono i tuoi dati  d'accesso:`;
    testo += `<br />`;
    testo += `Username: ${email}`;
    testo += `<br />`;
    testo += `Password: ${plainPassword}`;
    testo += `<br />`;
    testo += `<br />`;
    testo += `si colleghi al seguente indirizzo `;
    testo += `<br /> <a href="${loginUrl}">${loginUrl}</a><br /><br />`;
    testo += this.getPartTemplateEmail('parte_2');

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'PINKCARE <no-reply@pinkcare.it>',
      to: email,
      subject: 'Benvenuto su PinkCare',
      html: testo
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
   * Send password recovery email (modern version)
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
   * Send password recovery email (legacy-compatible)
   * Replicates EmailServiceImpl.sendPasswordRecovery() exactly
   * @param {string} email - Recipient email
   * @param {string} fullName - User full name
   * @param {string} username - Username
   * @param {string} tempPassword - Temporary password (plain text)
   * @param {number} userId - User ID
   * @param {string} encodedPassword - Encoded password for link
   */
  async sendPasswordRecoveryLegacy(email, fullName, username, tempPassword, userId, encodedPassword) {
    if (!this.transporter) {
      console.log('Email service not configured');
      return false;
    }

    // Use API_URL for the recovery endpoint (backend), falls back to APP_URL for production
    const apiUrl = process.env.API_URL || process.env.APP_URL || 'https://www.pinkcare.it';
    const recoveryLink = `${apiUrl}/api/auth/password-recovery?code=${userId}$${encodedPassword}`;

    // Build email body exactly like legacy EmailServiceImpl.sendPasswordRecovery()
    let testo = '';
    testo += this.getPartTemplateEmail('parte_1');
    testo += `Gentile <strong>${fullName},</strong><br /> `;
    testo += `Hai richiesto il recupero password `;
    testo += `<br />`;
    testo += `<br />`;
    testo += `Per completare l'operazione fa click sul link sottostante.`;
    testo += `<br />`;
    testo += `I nuovi dati d'accesso saranno i seguenti, e li potrai sempre modificare nella sezione impostazioni`;
    testo += `<br />`;
    testo += `<br />`;
    testo += `Username: ${username}`;
    testo += `<br />`;
    testo += `Password: ${tempPassword}`;
    testo += `<br />`;
    testo += `<br />`;
    testo += `Per completare l'operazione fa click sul link sottostante.`;
    testo += `<br />`;
    testo += `<a href="${recoveryLink}">${recoveryLink}</a><br /><br />`;
    testo += this.getPartTemplateEmail('parte_2');

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'PINKCARE <no-reply@pinkcare.it>',
      to: email,
      subject: '[PINKCARE] Recupero Password',
      html: testo
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password recovery email (legacy) sent:', info.messageId);
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
