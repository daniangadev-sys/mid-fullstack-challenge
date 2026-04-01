import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db, ensureSchema } from "@/db/client";
import { columns } from "@/db/schema";

export const runtime = "nodejs";

const createColumnSchema = z.object({
  title: z.string().min(1),
  boardId: z.coerce.number().int().positive(),
});

export async function POST(req: Request) {
  await ensureSchema();
  const body = await req.json().catch(() => null);
  const parsed = createColumnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const last = await db
    .select()
    .from(columns)
    .where(eq(columns.boardId, parsed.data.boardId))
    .orderBy(desc(columns.order))
    .limit(1);

  const nextOrder = (last[0]?.order ?? 0) + 1;

  const [created] = await db
    .insert(columns)
    .values({
      title: parsed.data.title,
      boardId: parsed.data.boardId,
      order: nextOrder,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

