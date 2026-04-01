import { NextResponse } from "next/server";
import { z } from "zod";
import { db, ensureSchema } from "@/db/client";
import { boards } from "@/db/schema";

export const runtime = "nodejs";

export async function GET() {
  await ensureSchema();
  const rows = await db.select().from(boards);
  return NextResponse.json(rows);
}

const createBoardSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  await ensureSchema();
  const body = await req.json().catch(() => null);
  const parsed = createBoardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const [created] = await db
    .insert(boards)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

