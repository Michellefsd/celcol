# ✈️ Celcol

Celcol es un sistema integral de gestión para talleres mecánicos aeronáuticos.  
Permite controlar aviones, componentes, tareas, herramientas calibrables, stock, empleados y clientes desde una interfaz moderna.

**Stack**
- **Frontend:** Next.js 15.1.8 + React 19 + TailwindCSS 3.4
- **Backend:** Node.js (Express 5) + Prisma 6
- **DB:** PostgreSQL 17.5
- **Auth:** Keycloak (OIDC)
- **Storage:** Cloudflare R2

---

## 📜 Licencia
Este software es propiedad intelectual de **Michelle Rodriguez**.  
Todos los derechos reservados.  
No se autoriza la reproducción, redistribución ni modificación total o parcial sin consentimiento explícito.

---

## 📋 Requisitos previos
- Node.js **≥20.11** (recomendado; también funciona con 22.x)
- PostgreSQL **17.5**
- Git
- Keycloak **24+** (para auth local)
- Cuenta en **Cloudflare R2** (archivos)

> ℹ️ **Notas internas**: las credenciales de Keycloak (admin), Cloudflare (cuenta y tarjeta) y otras claves se guardan en un documento privado fuera del repositorio (ej. `infra/credentials.md` o gestor de contraseñas).

---

## 🗂️ Monorepo

celcol/
├─ backend/ → Express + Prisma
└─ frontend/ → Next.js

---

## 🚀 Desarrollo local

### 1) Clonar
```bash
git clone https://github.com/Michellefsd/celcol
cd celcol
2) Backend
cd backend
cp .env.example .env
Ejemplo .env (local):
# Base de datos
DATABASE_URL="postgresql://postgres:1234@localhost:5432/celcol?schema=public"
PORT=3001

# Cloudflare R2
R2_ENDPOINT="https://<your-account-id>.r2.cloudflarestorage.com"
R2_BUCKET="celcol"
R2_ACCESS_KEY_ID="xxxxx"
R2_SECRET_ACCESS_KEY="xxxxx"

# Keycloak
KEYCLOAK_URL="http://localhost:9090"
KEYCLOAK_REALM="Celcol"
KEYCLOAK_CLIENT_ID="celcol-app"
KEYCLOAK_CLIENT_SECRET="xxxxx"
Instalar y levantar:
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
API: http://localhost:3001
Healthcheck: http://localhost:3001/health
3) Frontend
cd ../frontend
cp .env.example .env.local
Ejemplo .env.local:
NEXT_PUBLIC_API_BASE="http://localhost:3001"
Instalar y levantar:
npm install
npm run dev
Frontend: http://localhost:3000
4) Keycloak local (referencia)
URL: http://localhost:9090
Realm: Celcol
Client: celcol-app (OIDC, confidential)
Redirect URI: http://localhost:3000/api/auth/callback
Web origin: http://localhost:3000
El login se realiza mediante OIDC con Keycloak (no existe endpoint /auth/login en el backend).
🌐 Rutas útiles (backend)
GET /health → estado del backend
GET /archivos/url-firmada → descarga/inline mediante URL firmada (R2)
(Endpoints de Órdenes de Trabajo, Stock, Herramientas, Empleados, etc., según controladores del proyecto)
☁️ Deploy (staging / prod)
Frontend: Vercel → carpeta frontend/
Backend: Railway → carpeta backend/
DB: Railway Postgres
Storage: Cloudflare R2
Auth: Keycloak (instancia accesible públicamente)
Variables necesarias en producción (Railway/Vercel):
DATABASE_URL="postgresql://..."
PORT=3001

R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_BUCKET="celcol"
R2_ACCESS_KEY_ID="xxxxx"
R2_SECRET_ACCESS_KEY="xxxxx"

KEYCLOAK_URL="https://auth.celcol.com"   # tu instancia
KEYCLOAK_REALM="Celcol"
KEYCLOAK_CLIENT_ID="celcol-app"
KEYCLOAK_CLIENT_SECRET="xxxxx"
Migraciones en server:
npx prisma migrate deploy
🧪 QA / Testing (escenarios mínimos)
Crear OT → Fase 3 (stock/herr/humanos) → Fase 4 (horas) → Cerrar/Cancelar.
Alertas de stock (bajo mínimo) en fase 3 y edición directa de stock.
Subida/descarga/reemplazo de archivos (todas las entidades).
PDF de OT (cerrada/cancelada/archivada).
Archivado y listados de archivados.
🛡️ Notas
Los archivos .env no se versionan.
Para staging/prod, usar variables de entorno en Railway / Vercel.
Mantener @prisma/client y prisma en la misma versión.
