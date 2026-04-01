import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, ensureSchema } from "@/db/client";
import { tasks } from "@/db/schema";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const updateTaskColumnSchema = z.object({
  columnId: z.coerce.number().int().positive(),
});

export async function PATCH(
  req: Request,
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

  const body = await req.json().catch(() => null);
  const parsedBody = updateTaskColumnSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsedBody.error.issues },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(tasks)
    .set({ columnId: parsedBody.data.columnId })
    .where(eq(tasks.id, parsedParams.data.id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
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

  const [deleted] = await db
    .delete(tasks)
    .where(eq(tasks.id, parsedParams.data.id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

