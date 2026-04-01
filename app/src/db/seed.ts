import { boards, columns, tasks } from "./schema";
import { db, ensureSchema } from "./client";

async function main() {
  await ensureSchema();
  const now = Math.floor(Date.now() / 1000);
  const [board] = await db
    .insert(boards)
    .values({
      name: "Q4 Product Launch",
      description: "Project Sync example board",
      createdAt: now,
    })
    .returning();

  const insertedColumns = await db
    .insert(columns)
    .values([
      { title: "Backlog", order: 1, boardId: board.id },
      { title: "To Do", order: 2, boardId: board.id },
      { title: "In Progress", order: 3, boardId: board.id },
      { title: "Done", order: 4, boardId: board.id },
    ])
    .returning();

  const backlog = insertedColumns[0];
  const todo = insertedColumns[1];
  const inProgress = insertedColumns[2];
  const done = insertedColumns[3];

  await db.insert(tasks).values([
    {
      title: "Market Research",
      priority: "low",
      createdAt: now,
      order: 1,
      boardId: board.id,
      columnId: backlog.id,
    },
    {
      title: "Define MVP",
      priority: "medium",
      createdAt: now,
      order: 2,
      boardId: board.id,
      columnId: backlog.id,
    },
    {
      title: "User Personas",
      priority: "low",
      createdAt: now,
      order: 3,
      boardId: board.id,
      columnId: backlog.id,
    },
    {
      title: "Design Landing Page",
      priority: "medium",
      createdAt: now,
      order: 1,
      boardId: board.id,
      columnId: todo.id,
    },
    {
      title: "API Mockups",
      priority: "medium",
      createdAt: now,
      order: 2,
      boardId: board.id,
      columnId: todo.id,
    },
    {
      title: "Integrate Payment Gateway",
      priority: "medium",
      createdAt: now,
      order: 1,
      boardId: board.id,
      columnId: inProgress.id,
    },
    {
      title: "Database Schema",
      priority: "high",
      createdAt: now,
      order: 1,
      boardId: board.id,
      columnId: done.id,
    },
    {
      title: "Setup CI/CD",
      priority: "medium",
      createdAt: now,
      order: 2,
      boardId: board.id,
      columnId: done.id,
    },
    {
      title: "Write API Docs",
      priority: "high",
      createdAt: now,
      order: 3,
      boardId: board.id,
      columnId: done.id,
    },
    {
      title: "Design Logo",
      priority: "low",
      createdAt: now,
      order: 4,
      boardId: board.id,
      columnId: done.id,
    },
  ]);
}

main()
  .then(() => {
    console.log("Seed completado correctamente");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

