# Deployment Guide - PinkCare Backend v2

## Environment Configuration

### Development
Il file `.env` contiene la configurazione per l'ambiente di sviluppo locale:
- Database: PostgreSQL locale (localhost:5432)
- APP_URL: http://localhost:3000
- Email: Usa il server SMTP di produzione ma con URL locali

### Production
Per il deployment in produzione:

1. **Crea il file `.env.production`** copiando `.env.production.example`
2. **Aggiorna APP_URL**: `https://www.pinkcare.it`
3. **Aggiorna credenziali database** di produzione
4. **Usa JWT_SECRET diverso** e molto sicuro

## URL Configuration

L'applicazione usa `process.env.APP_URL` per:
- Link di recupero password
- Link di conferma email  
- Logo nelle email

**Importante**: 
- Development: `http://localhost:3000`
- Production: `https://www.pinkcare.it`

## Email Templates

I template email matchano il sistema legacy con:
- Header con logo PinkCare (bordo rosa #e42080)
- Firma "Servizio clienti PINKCARE"

