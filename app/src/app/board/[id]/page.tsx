import { BoardClient } from "./BoardClient";
import { headers } from "next/headers";
import { db, ensureSchema } from "@/db/client";
import { boards as boardsTable } from "@/db/schema";

type BoardPayload = {
  id: number;
  name: string;
  description: string | null;
  columns: Array<{
    id: number;
    title: string;
    order: number;
    boardId: number;
    tasks: Array<{
      id: number;
      title: string;
      description: string | null;
      priority: "low" | "medium" | "high";
      order: number;
      boardId: number;
      columnId: number;
    }>;
  }>;
};

type BoardSummary = {
  id: number;
  name: string;
  description: string | null;
};

async function getBoard(id: string): Promise<BoardPayload> {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const baseUrl = host ? `${proto}://${host}` : "";

  const res = await fetch(`${baseUrl}/api/boards/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load board (${res.status})`);
  }
  return (await res.json()) as BoardPayload;
}

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activeId = Number(id);
  const board = await getBoard(id);

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const baseUrl = host ? `${proto}://${host}` : "";

  const boardsRes = await fetch(`${baseUrl}/api/boards`, {
    cache: "no-store",
  });
  if (!boardsRes.ok) {
    throw new Error(`Failed to load boards (${boardsRes.status})`);
  }
  const boardList = (await boardsRes.json()) as BoardSummary[];

  return (
    <BoardClient
      initialBoard={board}
      initialBoards={boardList}
      activeBoardId={activeId}
    />
  );
}

