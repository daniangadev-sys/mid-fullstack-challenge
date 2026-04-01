import { NextResponse } from "next/server";
import { z } from "zod";
import { db, ensureSchema } from "@/db/client";
import { tasks } from "@/db/schema";

export const runtime = "nodejs";

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  order: z.coerce.number().int(),
  boardId: z.coerce.number().int().positive(),
  columnId: z.coerce.number().int().positive(),
});

export async function POST(req: Request) {
  await ensureSchema();
  const body = await req.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const [created] = await db
    .insert(tasks)
    .values({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      priority: parsed.data.priority ?? "medium",
      createdAt: Math.floor(Date.now() / 1000),
      order: parsed.data.order,
      boardId: parsed.data.boardId,
      columnId: parsed.data.columnId,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

