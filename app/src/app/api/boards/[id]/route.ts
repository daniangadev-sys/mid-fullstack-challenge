import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, ensureSchema } from "@/db/client";
import { boards, columns, tasks } from "@/db/schema";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await ensureSchema();
  const rawParams = await ctx.params;
  const parsedParams = paramsSchema.safeParse(rawParams);
  if (!parsedParams.success) {
    return NextResponse.json(
      { error: "Invalid id", issues: parsedParams.error.issues },
      { status: 400 },
    );
  }

  const boardId = parsedParams.data.id;

  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  const cols = await db
    .select()
    .from(columns)
    .where(eq(columns.boardId, boardId))
    .orderBy(columns.order);

  const tsks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.boardId, boardId))
    .orderBy(tasks.order);

  const tasksByColumnId = new Map<number, typeof tsks>();
  for (const t of tsks.map((x) => ({ ...x, priority: x.priority ?? "medium" }))) {
    const arr = tasksByColumnId.get(t.columnId) ?? [];
    arr.push(t);
    tasksByColumnId.set(t.columnId, arr);
  }

  return NextResponse.json({
    ...board,
    columns: cols.map((c) => ({
      ...c,
      tasks: tasksByColumnId.get(c.id) ?? [],
    })),
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await ensureSchema();
  const rawParams = await ctx.params;
  const parsedParams = paramsSchema.safeParse(rawParams);
  if (!parsedParams.success) {
    return NextResponse.json(
      { error: "Invalid id", issues: parsedParams.error.issues },
      { status: 400 },
    );
  }

  const boardId = parsedParams.data.id;

  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  await db.delete(boards).where(eq(boards.id, boardId));

  return NextResponse.json({ ok: true });
}

