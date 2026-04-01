import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

function getSqliteUrl() {
  const url = process.env.DATABASE_URL ?? "file:./local.db";
  if (!url.startsWith("file:")) {
    throw new Error(
      `DATABASE_URL must start with "file:" for local SQLite. Got: ${url}`,
    );
  }
  return url;
}

export const libsqlClient = createClient({
  url: getSqliteUrl(),
});

export const db = drizzle(libsqlClient);

let schemaInitPromise: Promise<void> | null = null;

export async function ensureSchema() {
  if (!schemaInitPromise) {
    schemaInitPromise = (async () => {
      await libsqlClient.execute(`
        CREATE TABLE IF NOT EXISTS boards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
        );
      `);

      await libsqlClient.execute(`
        CREATE TABLE IF NOT EXISTS columns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          "order" INTEGER NOT NULL,
          board_id INTEGER NOT NULL,
          FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
        );
      `);

      await libsqlClient.execute(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          priority TEXT NOT NULL DEFAULT 'medium',
          created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
          "order" INTEGER NOT NULL,
          board_id INTEGER NOT NULL,
          column_id INTEGER NOT NULL,
          FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
          FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
        );
      `);

      // Lightweight "migrations" for existing DBs.
      const boardsInfo = await libsqlClient.execute(`PRAGMA table_info(boards);`);
      const hasBoardsCreatedAt = boardsInfo.rows.some((r) => r.name === "created_at");
      if (!hasBoardsCreatedAt) {
        await libsqlClient.execute(
          `ALTER TABLE boards ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0;`,
        );
        await libsqlClient.execute(
          `UPDATE boards SET created_at = strftime('%s','now') WHERE created_at = 0;`,
        );
      }

      const tasksInfo = await libsqlClient.execute(`PRAGMA table_info(tasks);`);
      const hasPriority = tasksInfo.rows.some((r) => r.name === "priority");
      if (!hasPriority) {
        await libsqlClient.execute(
          `ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium';`,
        );
      }
      const hasTasksCreatedAt = tasksInfo.rows.some((r) => r.name === "created_at");
      if (!hasTasksCreatedAt) {
        await libsqlClient.execute(
          `ALTER TABLE tasks ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0;`,
        );
        await libsqlClient.execute(
          `UPDATE tasks SET created_at = strftime('%s','now') WHERE created_at = 0;`,
        );
      }

      await libsqlClient.execute(
        `CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);`,
      );
      await libsqlClient.execute(
        `CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id);`,
      );
      await libsqlClient.execute(
        `CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id);`,
      );
    })();
  }

  await schemaInitPromise;
}

