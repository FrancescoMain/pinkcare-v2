# PinkCare API - Express.js Backend

Express.js API backend migrato dal sistema Java Spring esistente, mantenendo la compatibilità totale con il database PostgreSQL e le funzionalità di autenticazione.

## 🚀 Quick Start

### Prerequisiti
- Node.js >= 18
- PostgreSQL database (esistente)
- npm o yarn

### Installazione

```bash
# Installa le dipendenze
npm install

# Configura le variabili d'ambiente
cp .env.example .env
# Modifica .env con le tue configurazioni
```

### Configurazione Database

Il backend è configurato per connettersi al database PostgreSQL esistente:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=PINKCARE_DB
DB_USER=postgres
DB_PASSWORD=pinkcare2025
```

### Avvio

```bash
# Sviluppo (con hot reload)
npm run dev

# Produzione
npm start
```

L'API sarà disponibile su: `http://localhost:3001`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register-consumer` - Registrazione utente consumatore
- `POST /api/auth/login` - Login utente
- `POST /api/auth/logout` - Logout utente
- `POST /api/auth/forgot-password` - Richiesta reset password
- `POST /api/auth/reset-password` - Reset password con token
- `GET /api/auth/verify` - Verifica validità token JWT

### User Management
- `GET /api/users/profile` - Profilo utente corrente
- `PUT /api/users/profile` - Aggiornamento profilo utente
- `GET /api/users/:userId` - Profilo utente per ID (solo admin o proprietario)

### Health Check
- `GET /health` - Status dell'API

## 🔐 Autenticazione

L'API utilizza JWT (JSON Web Tokens) per l'autenticazione:

```javascript
// Header richieste autenticate
Authorization: Bearer <jwt_token>
```

### Ruoli Utente
- `ROLE_CONSUMER` - Utente paziente
- `ROLE_BUSINESS` - Medico/Clinica  
- `ROLE_PINKCARE` - Amministratore PinkCare

## 🗄️ Database

### Compatibilità Java
- **Password encoding**: MD5 (compatibile con Spring MD5PasswordEncoder)
- **Schema**: Utilizza le tabelle esistenti (`app_user`, `app_role`, `app_user_role`)
- **Naming**: snake_case nel DB, camelCase in JavaScript

### Modelli Principali
- **User**: Utente con dati personali e medici
- **Role**: Ruoli di sistema
- **UserRole**: Associazioni utente-ruolo

## 📋 Esempi di Utilizzo

### Registrazione Utente
```javascript
POST /api/auth/register-consumer
{
  "name": "Maria",
  "surname": "Rossi",
  "email": "maria.rossi@example.com",
  "password": "password123",
  "birthday": "1985-03-15",
  "gender": false,
  "nickName": "MariaR",
  "agreeConditionAndPrivacy": true,
  "agreeMarketing": false,
  "agreeNewsletter": true
}
```

### Login
```javascript
POST /api/auth/login
{
  "email": "maria.rossi@example.com",
  "password": "password123",
  "rememberMe": false
}
```

### Aggiornamento Profilo
```javascript
PUT /api/users/profile
Authorization: Bearer <jwt_token>
{
  "weight": 65.5,
  "height": 165.0,
  "sedentaryLifestyle": false,
  "agreeNewsletter": false
}
```

## 🛠️ Sviluppo

### Struttura Progetto
```
src/
├── config/          # Configurazioni (database, etc.)
├── controllers/     # Controller delle route
├── middleware/      # Middleware (auth, validation)
├── models/          # Modelli Sequelize
├── routes/          # Definizioni delle route
├── services/        # Logica di business
└── utils/           # Utility functions
```

### Scripts
```bash
npm run dev          # Sviluppo con nodemon
npm run start        # Produzione
npm run test         # Test (TODO)
```

### Testing
```bash
# TODO: Implementare test con Jest + Supertest
npm run test
```

## 🔧 Configurazione Avanzata

### Variabili d'Ambiente
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=PINKCARE_DB
DB_USER=postgres
DB_PASSWORD=pinkcare2025

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Email (Aruba)
MAIL_HOST=smtps.aruba.it
MAIL_PORT=465
MAIL_USER=no-reply@pinkcare.it
MAIL_PASSWORD=your_mail_password

# App
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

## 🐛 Troubleshooting

### Database Connection Issues
1. Verifica che PostgreSQL sia avviato
2. Controlla le credenziali in `.env`
3. Verifica che il database `PINKCARE_DB` esista

### Errori di Validazione
L'API restituisce errori dettagliati per validazione dati:
```json
{
  "error": "Validation Error",
  "details": [
    {
      "msg": "Password deve essere di almeno 8 caratteri",
      "param": "password"
    }
  ]
}
```

## 📝 TODO

- [ ] Implementazione registrazione medici/business
- [ ] Sistema di email per reset password
- [ ] Test automatizzati
- [ ] Documentazione OpenAPI/Swagger
- [ ] Rate limiting
- [ ] Logging avanzato
- [ ] Docker containerization

## 🤝 Migrazione da Java

Questo backend è stato progettato per sostituire gradualmente il sistema Java Spring esistente:

1. **Compatibilità Database**: Utilizza le stesse tabelle e strutture dati
2. **Password Encoding**: MD5 per compatibilità con il sistema esistente
3. **API Design**: RESTful, moderno ma compatibile con il frontend React
4. **Autenticazione**: JWT al posto delle sessioni Spring Security

Il sistema Java può continuare a funzionare in parallelo durante la migrazione.