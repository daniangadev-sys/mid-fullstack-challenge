import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, ensureSchema } from "@/db/client";
import { columns, tasks } from "@/db/schema";

export const runtime = "nodejs";

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  await ensureSchema();
  const rawParams = await ctx.params;
  const parsed = paramsSchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid id", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const id = parsed.data.id;
  await db.delete(tasks).where(eq(tasks.columnId, id));
  const [deleted] = await db.delete(columns).where(eq(columns.id, id)).returning();

  if (!deleted) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

