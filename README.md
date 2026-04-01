# Mid Fullstack Technical Test

Kanban board built with:

- Next.js (App Router)
- Bun (package manager + runtime)
- SQLite + Drizzle ORM
- TailwindCSS
- Zod for validation

## Requisitos (cubiertos)

- Create and view boards: implementado en `/api/boards` y UI `/board/[id]`
- Add columns to a board: `/api/columns` y UI con botón `Add Column`
- Create/update/delete tasks: `/api/tasks` + UI formulación + acciones
- Move tasks between columns: dropdown con `onMoveTask`
- Kanban board layout: columnas columna lado a lado en `BoardClient`
- DB schema: `src/db/schema.ts` con boards/columns/tasks + timestamps
- Seed script: `bun run seed` en `package.json` (ejecuta `src/db/seed.ts`)
- Input validation: Zod en cada endpoint
- HTTP codes correctos: 400/404/201 etc
- JSON responses consistentes

## Instalación local

1. Clonar repo:

```bash
git clone https://github.com/<TU_USUARIO>/MId-Fullstack-TechnicalTest.git
cd MId-Fullstack-TechnicalTest/app
```

2. Instalar dependencias:

```bash
bun install
```

3. (Opcional) definir base de datos local:

```bash
set DATABASE_URL=file:./local.db
```

4. Sembrar datos de ejemplo:

```bash
bun run seed
```

5. Ejecutar:

```bash
bun run dev
```

6. Abrir en el navegador:

`http://localhost:3000/board/1`

## Endpoints

- GET `/api/boards`
- POST `/api/boards`
- GET `/api/boards/:id`
- DELETE `/api/boards/:id`
- POST `/api/columns`
- POST `/api/tasks`
- PATCH `/api/tasks/:id`
- DELETE `/api/tasks/:id`

## Scripts disponibles

- `bun run dev`: Inicia servidor dev
- `bun run build`: Construcción
- `bun run start`: Ejecutar producción
- `bun run seed`: Crea datos de prueba
- `npm run lint`: ESLint

## Diseño técnico y decisiones

1. **Backend**: Next.js App Router con rutas API en `src/app/api`.
2. **ORM**: Drizzle, con relaciones y cascada de borrado.
3. **Validación**: Zod en cada ruta API para `body` y `params`.
4. **Frontend**: React client component en `src/app/board/[id]/BoardClient.tsx`.
5. **UI**: Kanban simple, tareas con dropdown para mover entre columnas.

## Notas adicionales

- Se agregó `onDeleteBoard` para borrar un board completo.
- El control de roles `tech-lead/jr` está presente para habilitar botones.
- `app/.gitignore` incluye `local.db` y `*.db` para evitar versionar la base de datos local.
