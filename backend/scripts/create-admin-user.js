/**
 * Script per creare un utente admin di test.
 *
 * Uso: cd pinkcare-v2/backend && ENV_FILE=.env.local node scripts/create-admin-user.js
 *
 * Credenziali create:
 *   Email: admin@pinkcare.test
 *   Password: Admin2025!
 */
const path = require('path');

const envFile = process.env.ENV_FILE
  ? path.resolve(__dirname, '..', process.env.ENV_FILE)
  : path.resolve(__dirname, '..', '.env.local');

require('dotenv').config({ path: envFile });

const { sequelize } = require('../src/config/database');
const PasswordUtils = require('../src/utils/passwordUtils');

const ADMIN_EMAIL = 'admin@pinkcare.test';
const ADMIN_PASSWORD = 'Admin2025!';

async function createAdminUser() {
  try {
    await sequelize.authenticate();
    console.log('DB connesso');

    // 1. Verifica se il ruolo ROLE_PINKCARE esiste
    const [roles] = await sequelize.query(
      "SELECT id FROM app_role WHERE name = 'ROLE_PINKCARE'"
    );

    let roleId;
    if (roles.length === 0) {
      // Crea il ruolo
      const [created] = await sequelize.query(
        "INSERT INTO app_role (name, description, level, visible) VALUES ('ROLE_PINKCARE', 'Amministratore', 1, true) RETURNING id"
      );
      roleId = created[0].id;
      console.log('Ruolo ROLE_PINKCARE creato, id:', roleId);
    } else {
      roleId = roles[0].id;
      console.log('Ruolo ROLE_PINKCARE trovato, id:', roleId);
    }

    // 2. Verifica se l'utente esiste già
    const [existing] = await sequelize.query(
      "SELECT id FROM app_user WHERE email = $1",
      { bind: [ADMIN_EMAIL] }
    );

    const passwordHash = PasswordUtils.encodeMD5(ADMIN_PASSWORD);
    let userId;

    if (existing.length > 0) {
      userId = existing[0].id;
      // Aggiorna password e abilita
      await sequelize.query(
        "UPDATE app_user SET password = $1, enabled = 'Y', insertion_date = NOW(), last_modify_date = NOW() WHERE id = $2",
        { bind: [passwordHash, userId] }
      );
      console.log('Utente admin aggiornato, id:', userId);
    } else {
      // Crea l'utente
      const [created] = await sequelize.query(
        `INSERT INTO app_user (
          email, username, password, name, surname, enabled,
          agree_condition_and_privacy, agree_marketing, agree_newsletter,
          insertion_date, insertion_username, last_modify_date, last_modify_username,
          deleted
        ) VALUES (
          $1, $1, $2, 'Admin', 'PinkCare', 'Y',
          true, false, false,
          NOW(), 'system', NOW(), 'system',
          false
        ) RETURNING id`,
        { bind: [ADMIN_EMAIL, passwordHash] }
      );
      userId = created[0].id;
      console.log('Utente admin creato, id:', userId);
    }

    // 3. Assegna il ruolo (se non già assegnato)
    const [existingRole] = await sequelize.query(
      "SELECT user_id FROM app_user_app_role WHERE user_id = $1 AND role_id = $2",
      { bind: [userId, roleId] }
    );

    if (existingRole.length === 0) {
      await sequelize.query(
        "INSERT INTO app_user_app_role (user_id, role_id, cancellation, insertion, modification) VALUES ($1, $2, false, true, false)",
        { bind: [userId, roleId] }
      );
      console.log('Ruolo ROLE_PINKCARE assegnato');
    } else {
      console.log('Ruolo ROLE_PINKCARE già assegnato');
    }

    // 4. Crea un team di tipo ADMINISTRATOR per l'utente
    const [existingTeam] = await sequelize.query(
      "SELECT t.id FROM app_team t WHERE t.representative_id = $1 AND t.type_id = 1",
      { bind: [userId] }
    );

    if (existingTeam.length === 0) {
      await sequelize.query(
        `INSERT INTO app_team (
          name, type_id, representative_id, active, deleted, searchable,
          insertion_date, insertion_username, last_modify_date, last_modify_username
        ) VALUES (
          'Admin PinkCare', 1, $1, true, 'N', false,
          NOW(), 'system', NOW(), 'system'
        )`,
        { bind: [userId] }
      );
      console.log('Team admin creato');
    } else {
      console.log('Team admin già esistente');
    }

    console.log('\n========================================');
    console.log('  Admin user pronto!');
    console.log('  Email:    admin@pinkcare.test');
    console.log('  Password: Admin2025!');
    console.log('========================================\n');

    await sequelize.close();
  } catch (error) {
    console.error('Errore:', error.message);
    process.exit(1);
  }
}

createAdminUser();
