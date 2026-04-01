## Technical Challenge — Mid-Level

### Background

A small project management startup wants to build a simple internal tool for their team to organize work visually. They need a basic task board where team members can create boards, organize tasks into columns, and move tasks between stages.

In this challenge, you'll build a simplified task board application with a REST API, a database, and a functional UI.

We are **not evaluating specific tools or patterns**. We simply want to understand how you think, how you code, and how you approach real-world problems. Be yourself.


### What You Need to Build

A functional **full stack application** with the ability to:

1. Create and view boards
2. Add columns to a board
3. Create, update, and delete tasks within columns
4. Move tasks between columns
5. View a board in a kanban-style layout


### Database Schema

Design the schema yourself. At minimum, you should support:

- **Boards** with a name and creation date
- **Columns** belonging to a board, with a name and display order
- **Tasks** belonging to a column, with: title, description, priority, and creation date

Include appropriate indexes and a seed script that creates one board with sample data.


### Tech Stack

#### Backend

* Runtime: **Bun**
* Framework: **Next.js** (App Router)
* Database: **SQLite** (ORM, query builder, or raw SQL — your choice)

#### Frontend

* Framework: **Next.js**
* Styling: **TailwindCSS**
* Additional UI libraries are welcome but not required


### Required API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | List all boards |
| POST | `/api/boards` | Create a board |
| GET | `/api/boards/:id` | Get a board with its columns and tasks |
| POST | `/api/columns` | Create a column (linked to a board) |
| POST | `/api/tasks` | Create a task (linked to a column) |
| PATCH | `/api/tasks/:id` | Update a task (title, description, move to another column) |
| DELETE | `/api/tasks/:id` | Delete a task |

- Validate input on every endpoint.
- Return proper HTTP status codes (400, 404, etc.).
- Use a consistent JSON response structure.


### Required UI

1. A page showing a board in **kanban-style layout** (columns side by side, tasks as cards)
2. Ability to **create a new task** via a modal or dialog
3. Ability to **move a task** between columns (a simple dropdown is fine, no drag-and-drop required)
4. Loading and empty states


### Current Implementation Status

- [x] Create and view boards (`GET/POST /api/boards`, UI `pages/board/[id]`)
- [x] Add columns to a board (`POST /api/columns`, `Add Column` UI)
- [x] Create, update, delete tasks (`POST/PATCH/DELETE /api/tasks`, UI forms)
- [x] Move tasks between columns (dropdown move action)
- [x] Kanban board layout with columns side-by-side (`src/app/board/[id]/BoardClient.tsx`)
- [x] DB schema in `src/db/schema.ts` (boards, columns, tasks with timestamps)
- [x] Seed script `bun run seed` (`src/db/seed.ts`)
- [x] Input validation with Zod in endpoints
- [x] Proper HTTP status codes and JSON structure


### Installation local

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


### Endpoints

- GET `/api/boards`
- POST `/api/boards`
- GET `/api/boards/:id`
- DELETE `/api/boards/:id`
- POST `/api/columns`
- POST `/api/tasks`
- PATCH `/api/tasks/:id`
- DELETE `/api/tasks/:id`


### Scripts disponibles

- `bun run dev`: Inicia servidor dev
- `bun run build`: Construcción
- `bun run start`: Ejecutar producción
- `bun run seed`: Crea datos de prueba
- `npm run lint`: ESLint


### Notas adicionales

- La meta es que este README sea idéntico al planteamiento original de la prueba, con el estado del proyecto descrito en forma de lista de verificación.