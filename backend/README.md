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

# Configura i file di ambiente (non committare quelli reali)
cp .env.local.example .env.local          # Postgres locale / Docker
cp .env.example .env.supabase            # Connessione a Supabase
```

### Configurazione Database

Il backend legge la configurazione dal file indicato nella variabile `ENV_FILE`.

- `.env.local` → ambiente locale/Sviluppo (Postgres locale o container con il dump)
- `.env.supabase` → ambiente remoto (Supabase). Impostare `DB_SSL=true` oppure usare `DATABASE_URL`.

Esempio locale:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=PINKCARE_DB
DB_USER=postgres
DB_PASSWORD=pinkcare2025
DB_SSL=false
```

Esempio Supabase (Session Pooler IPv4):

```env
DB_HOST=aws-1-eu-north-1.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.<project-ref>
DB_PASSWORD=***
DB_SSL=true
```

### Avvio

```bash
# Sviluppo (hot reload) con DB locale
npm run dev:local

# Sviluppo puntando a Supabase (usa credenziali di test!)
npm run dev:supabase

# Esecuzione production-like su Supabase
npm run start:supabase

# Avvio legacy (usa il file .env di default, se presente)
npm run dev
npm start
```

#### Workflow consigliato

1. Importa periodicamente un dump di Supabase in Postgres locale (`.env.local`) per avere dati aggiornati:
   - `pg_dump --no-owner --no-acl -h aws-1-eu-north-1.pooler.supabase.com -p 5432 -U postgres.<project-ref> -d postgres > backup.sql`
   - `psql -h localhost -U postgres -d PINKCARE_DB -f backup.sql`
2. Usa `npm run dev:local` come default per sviluppo e test, così eviti scritture accidentali sull'ambiente remoto.
3. Passa a `npm run dev:supabase` solo quando devi validare comportamenti contro il database gestito da Supabase.
4. Valuta la creazione di un ruolo Supabase read-only per debug, lasciando le credenziali dell'utente amministratore solo agli script di migrazione.

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
npm run dev:local     # Dev con Postgres locale
npm run dev:supabase  # Dev puntando a Supabase (SSL)
npm run dev           # Dev usando il file .env di default (se presente)
npm run start         # Avvio standard (usa .env)
npm run start:supabase# Avvio production-like su Supabase
npm run test          # Test (TODO)
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
