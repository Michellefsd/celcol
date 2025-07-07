# Celcol

**Celcol** es un sistema integral de gestión para talleres mecánicos aeronáuticos. Permite controlar aviones, tareas, herramientas calibrables, stock, empleados y clientes desde una interfaz intuitiva y moderna desarrollada con Next.js, Tailwind CSS, Node.js, Express y PostgreSQL.

## Licencia

Este software es propiedad intelectual de Michelle Rodriguez.
**Todos los derechos reservados.**
No se autoriza la reproducción, redistribución ni modificación total o parcial sin consentimiento explícito.

## Características principales

* Gestión de múltiples aviones y dueños
* Registro detallado de tareas y trabajos realizados
* Control de horas de trabajo por empleado (filtrable por fecha para informes DINACIA)
* Administración de herramientas calibrables con conteo de horas de uso
* Control de stock e insumos técnicos con trazabilidad
* Backend con Prisma y API RESTful
* Frontend moderno con Next.js y Tailwind

## Estructura del proyecto

```
celcol/
├── frontend/       # Interfaz en Next.js
├── backend/        # API en Express + Prisma + PostgreSQL
└── .gitignore
```







📦 Local PostgreSQL Docker Setup
Contenedor: celcol-db
Comando para crear:

docker run --name celcol-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=1234 \
  -e POSTGRES_DB=celcol \
  -p 5432:5432 \
  -d postgres


DATABASE_URL="postgresql://postgres:1234@localhost:5432/celcol?schema=public"
