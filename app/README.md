## Mid Fullstack Technical Test — Kanban

Kanban board built with:

- **Next.js (App Router)** (`src/app`)
- **Bun** (package manager + scripts)
- **SQLite (local file)** via `@libsql/client` using `DATABASE_URL="file:..."`
- **Drizzle ORM**
- **TailwindCSS**

## Quickstart (local)

From the `app/` folder:

1) Install deps

```bash
bun install
```

2) (Optional) choose DB file location

By default the app uses `file:./local.db`. You can override it:

```bash
set DATABASE_URL=file:./local.db
```

3) Seed example data (creates tables + example board)

```bash
bun run seed
```

4) Run dev server

```bash
bun run dev
```

Open `http://localhost:3000/board/1` (or the latest created board id).

## Architecture / design decisions

- **DB bootstrap & lightweight migrations**
  - `src/db/client.ts` exposes `ensureSchema()` which:
    - creates tables with `CREATE TABLE IF NOT EXISTS`
    - applies additive migrations (e.g. `ALTER TABLE ... ADD COLUMN`) when new columns are introduced
    - creates indexes used by the API.

- **API**
  - Route Handlers live under `src/app/api/**/route.ts`.
  - Inputs are validated with **Zod**. Invalid requests return `400` with `{ error, issues }`.

- **UI**
  - Main Kanban view is `src/app/board/[id]/BoardClient.tsx`.
  - Uses a modal to create tasks and a `<select>` to move tasks between columns.

## Useful scripts

- `bun run dev`: start Next dev server
- `bun run seed`: create example board/columns/tasks in SQLite file
