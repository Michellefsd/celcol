# Celcol
Celcol es un sistema integral de gestión para talleres mecánicos aeronáuticos.
Permite controlar aviones, tareas, herramientas calibrables, stock, empleados y clientes desde una interfaz intuitiva y moderna desarrollada con Next.js, Tailwind CSS, Node.js, Express y PostgreSQL.
# 📜 Licencia
Este software es propiedad intelectual de Michelle Rodriguez.
Todos los derechos reservados.
No se autoriza la reproducción, redistribución ni modificación total o parcial sin consentimiento explícito.
# 📋 Requisitos previos
Node.js 22.x (recomendado instalar con nvm)
PostgreSQL 17.5
Git




# Celcol (monorepo)

## Apps
- `frontend/` (Next.js 14)
- `backend/` (Express + Prisma + Postgres)

## Dev local
### Backend
1. Crear `backend/.env` (ver ejemplo en README / arriba)
2. `cd backend`
3. `npm i`
4. `npx prisma migrate dev`
5. `npm run dev` (o `node index.js` si no tienes script)

### Frontend
1. Crear `frontend/.env.local`
2. `cd frontend`
3. `npm i`
4. `npm run dev` → http://localhost:3000

### Keycloak local
- URL: `http://localhost:8080`
- Realm: `Cellcol`
- Client: `cellcol-app` (OIDC, confidential)
- Redirect URI: `http://localhost:3000/api/auth/callback`
- Web origin: `http://localhost:3000`

## Rutas útiles
- Backend health: `GET http://localhost:3001/health`
- Login: botón en `/` o `/login` → redirige a Keycloak
- Callback: `GET /api/auth/callback` (backend)
- Área protegida: `GET /me` (requiere cookie `cc_access`)

## Deploy (staging)
- Frontend: Vercel apuntando a `frontend/`
- Backend: Render / Railway apuntando a `backend/`
- DB: Neon / Render Postgres
























1️⃣ Clonar el repositorio
git clone https://github.com/Michellefsd/celcol
cd celcol
2️⃣ Backend — configuración y base de datos
cd backend
cp .env.example .env
Editar el archivo .env para poner tus credenciales locales:
DATABASE_URL="postgresql://postgres:1234@localhost:5432/celcol?schema=public"
PORT=3001
Crear la base de datos (si no existe):
createdb celcol || true
# o:
# psql -U postgres -c "CREATE DATABASE celcol;"
Instalar dependencias y preparar Prisma:
npm install
npx prisma generate
npx prisma migrate dev --name init
Esto crea solo las tablas, no carga datos de ejemplo.
Levantar el backend:
npm run dev
📍 El API estará disponible en:
http://localhost:3001

# 3️⃣ Frontend
En otra terminal:
cd ../frontend
cp .env.example .env  # si existe; si no, crear uno con la URL del backend
# Ejemplo de contenido:
# NEXT_PUBLIC_API_BASE="http://localhost:3001"

npm install
npm run dev
📍 El frontend estará disponible en:
http://localhost:3000

# ℹ️ Notas
Este setup no carga datos de ejemplo: ingresá los datos desde la app.
El backend debe estar corriendo antes de iniciar el frontend.
Si cambia el puerto del backend, actualizá NEXT_PUBLIC_API_BASE en el frontend.
Si Prisma da errores de cliente, corré:
npx prisma generate
Asegurate de que PostgreSQL esté ejecutándose antes de iniciar.

# 🐳 (Opcional) Levantar PostgreSQL con Docker
docker run --name celcol-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=1234 \
  -e POSTGRES_DB=celcol \
  -p 5432:5432 \
  -d postgres:17.5
.env:
DATABASE_URL="postgresql://postgres:1234@localhost:5432/celcol?schema=public"


