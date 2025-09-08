# API Configuration Guide

## Panoramica

Questo progetto utilizza un sistema di configurazione API centralizzata per gestire gli endpoint in diversi ambienti (development, staging, production).

## Struttura

```
src/
├── config/
│   └── api.js              # Configurazione API centralizzata
├── services/
│   └── authService.js      # Servizio di autenticazione
└── components/
    └── ...
```

## Ambienti

### Development (Locale)
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- File: `.env.development`

### Staging
- Frontend: `https://staging.pinkcare.it`
- Backend: `https://staging-api.pinkcare.it`
- File: `.env.staging`

### Production
- Frontend: `https://pinkcare.it`
- Backend: `https://api.pinkcare.it`
- File: `.env.production`

## Configurazione Variabili d'Ambiente

### .env.development
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_STAGE=development
```

### .env.staging
```env
REACT_APP_API_URL=https://staging-api.pinkcare.it
REACT_APP_STAGE=staging
```

### .env.production
```env
REACT_APP_API_URL=https://api.pinkcare.it
REACT_APP_STAGE=production
```

## Utilizzo

### 1. Importare la configurazione
```javascript
import { ApiClient, API_CONFIG, ApiError } from '../config/api';
```

### 2. Utilizzare gli endpoint
```javascript
// Registrazione utente
const result = await ApiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER_CONSUMER, userData);

// Login
const result = await ApiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, loginData);
```

### 3. Utilizzare i servizi
```javascript
import { AuthService } from '../services/authService';

// Registrazione
const result = await AuthService.registerConsumer(userData);

// Login
const result = await AuthService.login(email, password, rememberMe);
```

### 4. Gestione errori
```javascript
try {
  const result = await AuthService.login(email, password);
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isValidationError()) {
      // Errori di validazione
    } else if (error.isAuthError()) {
      // Errore di autenticazione
    } else if (error.isConflictError()) {
      // Conflitto (es. email già esistente)
    }
  }
}
```

## Endpoint Disponibili

### Autenticazione (`/api/auth`)
- `POST /register-consumer` - Registrazione utente consumer
- `POST /login` - Login utente
- `POST /logout` - Logout utente
- `POST /forgot-password` - Recupero password
- `POST /reset-password` - Reset password con token
- `GET /verify` - Verifica token JWT

### Utenti (`/api/users`)
- `GET /profile` - Profilo utente corrente
- `PUT /profile` - Aggiorna profilo utente

## Build e Deploy

### Development
```bash
npm start
```

### Staging
```bash
npm run build:staging
```

### Production
```bash
npm run build
```

## Note Implementazione

1. **Timeout**: Tutte le chiamate API hanno un timeout di 10 secondi
2. **Headers**: Headers di default inclusi automaticamente
3. **Token Management**: Gestione automatica dei token JWT
4. **Error Handling**: Gestione centralizzata degli errori API
5. **Logging**: Log automatico delle chiamate API in development

## Script Package.json

Aggiungere al `package.json`:

```json
{
  "scripts": {
    "start": "REACT_APP_ENV=development react-scripts start",
    "build": "REACT_APP_ENV=production react-scripts build",
    "build:staging": "REACT_APP_ENV=staging react-scripts build"
  }
}
```