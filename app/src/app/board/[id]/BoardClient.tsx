"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Trash2,
  X,
  MoreHorizontal,
  LayoutGrid,
  Hash,
} from "lucide-react";

type Task = {
  id: number;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  order: number;
  boardId: number;
  columnId: number;
};

type Column = {
  id: number;
  title: string;
  order: number;
  boardId: number;
  tasks: Task[];
};

type BoardPayload = {
  id: number;
  name: string;
  description: string | null;
  columns: Column[];
};

type BoardSummary = {
  id: number;
  name: string;
  description: string | null;
};

type UserRole = "tech-lead" | "jr";

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

function priorityUi(p: Task["priority"]) {
  switch (p) {
    case "low":
      return {
        dot: "bg-emerald-500",
        pill: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        label: "Low",
      };
    case "high":
      return {
        dot: "bg-rose-500",
        pill: "bg-rose-50 text-rose-700 ring-rose-100",
        label: "High",
      };
    default:
      return {
        dot: "bg-amber-500",
        pill: "bg-amber-50 text-amber-800 ring-amber-100",
        label: "Medium",
      };
  }
}

export function BoardClient({
  initialBoard,
  initialBoards,
  activeBoardId,
}: {
  initialBoard: BoardPayload;
  initialBoards: BoardSummary[];
  activeBoardId: number;
}) {
  const router = useRouter();
  const [board, setBoard] = useState<BoardPayload>(initialBoard);
  const [boards, setBoards] = useState<BoardSummary[]>(initialBoards);
  const [role, setRole] = useState<UserRole>("tech-lead");
  const [avatarSrc, setAvatarSrc] = useState("/avatars/profile.jpg");
  const [busyTaskIds, setBusyTaskIds] = useState<Set<number>>(new Set());
  const [addingColumn, setAddingColumn] = useState(false);
  const [deletingColumnIds, setDeletingColumnIds] = useState<Set<number>>(
    new Set(),
  );
  const [addingBoard, setAddingBoard] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalColumnId, setModalColumnId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPriority, setFormPriority] = useState<Task["priority"]>("medium");

  const columnsSorted = useMemo(
    () => [...board.columns].sort((a, b) => a.order - b.order),
    [board.columns],
  );

  const columnOptions = useMemo(
    () =>
      columnsSorted.map((c) => ({
        id: c.id,
        title: c.title,
      })),
    [columnsSorted],
  );
  const canManageColumns = role === "tech-lead";
  const canCreateBoards = role === "tech-lead";

  function updateTaskLocally(taskId: number, updater: (t: Task) => Task) {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) => (t.id === taskId ? updater(t) : t)),
      })),
    }));
  }

  function removeTaskLocally(taskId: number) {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      })),
    }));
  }

  function moveTaskLocally(taskId: number, toColumnId: number) {
    setBoard((prev) => {
      let task: Task | undefined;
      const nextColumns = prev.columns.map((col) => {
        const kept = col.tasks.filter((t) => {
          if (t.id === taskId) task = t;
          return t.id !== taskId;
        });
        return { ...col, tasks: kept };
      });
      if (!task) return prev;
      const moved: Task = { ...task, columnId: toColumnId };
      return {
        ...prev,
        columns: nextColumns.map((col) =>
          col.id === toColumnId ? { ...col, tasks: [...col.tasks, moved] } : col,
        ),
      };
    });
  }

  async function onDeleteTask(taskId: number) {
    setBusyTaskIds((s) => new Set(s).add(taskId));
    try {
      await api<{ ok: true }>(`/api/tasks/${taskId}`, { method: "DELETE" });
      removeTaskLocally(taskId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error borrando la tarea";
      window.alert(message);
    } finally {
      setBusyTaskIds((s) => {
        const next = new Set(s);
        next.delete(taskId);
        return next;
      });
    }
  }

  async function onMoveTask(taskId: number, toColumnId: number) {
    setBusyTaskIds((s) => new Set(s).add(taskId));
    const fromBoard = board;
    try {
      moveTaskLocally(taskId, toColumnId);
      await api<Task>(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ columnId: toColumnId }),
      });
      updateTaskLocally(taskId, (t) => ({ ...t, columnId: toColumnId }));
    } catch (e) {
      setBoard(fromBoard);
      const message = e instanceof Error ? e.message : "Error moviendo la tarea";
      window.alert(message);
    } finally {
      setBusyTaskIds((s) => {
        const next = new Set(s);
        next.delete(taskId);
        return next;
      });
    }
  }

  function openAddTask(columnId?: number) {
    const targetColumnId = columnId ?? columnsSorted[0]?.id ?? null;
    if (!targetColumnId) return;
    setModalColumnId(targetColumnId);
    setFormTitle("");
    setFormDescription("");
    setFormPriority("medium");
    setModalOpen(true);
  }

  function closeModal() {
    if (creating) return;
    setModalOpen(false);
  }

  async function onAddColumn() {
    if (!canManageColumns) return;
    if (addingColumn) return;
    const title = window.prompt("Column name");
    if (!title?.trim()) return;

    setAddingColumn(true);
    try {
      const created = await api<Column>("/api/columns", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), boardId: board.id }),
      });

      setBoard((prev) => ({
        ...prev,
        columns: [...prev.columns, { ...created, tasks: [] }],
      }));
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Error creando la columna";
      window.alert(message);
    } finally {
      setAddingColumn(false);
    }
  }

  async function onDeleteColumn(columnId: number) {
    if (!canManageColumns) return;
    if (!window.confirm("Delete this column and its tasks?")) return;

    setDeletingColumnIds((s) => new Set(s).add(columnId));
    try {
      await api<{ ok: true }>(`/api/columns/${columnId}`, { method: "DELETE" });
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.filter((c) => c.id !== columnId),
      }));
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Error borrando la columna";
      window.alert(message);
    } finally {
      setDeletingColumnIds((s) => {
        const next = new Set(s);
        next.delete(columnId);
        return next;
      });
    }
  }

  async function onAddBoard() {
    if (!canCreateBoards || addingBoard) return;
    const name = window.prompt("Board name");
    if (!name?.trim()) return;

    setAddingBoard(true);
    try {
      const created = await api<BoardSummary>("/api/boards", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      setBoards((prev) => [...prev, created]);
      router.push(`/board/${created.id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error creando board";
      window.alert(message);
    } finally {
      setAddingBoard(false);
    }
  }

  async function onDeleteBoard() {
    if (!canCreateBoards) return;
    if (!window.confirm(`¿Estás seguro de que quieres borrar el board "${board.name}"? Esto también borrará todas las columnas y tareas.`)) return;

    try {
      await api<{ ok: true }>(`/api/boards/${board.id}`, { method: "DELETE" });
      setBoards((prev) => prev.filter((b) => b.id !== board.id));
      router.push(`/board/${boards.find(b => b.id !== board.id)?.id || ''}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error borrando el board";
      window.alert(message);
    }
  }

  async function createTask() {
    if (creating) return;
    const title = formTitle.trim();
    if (!title) {
      window.alert("El título no puede estar vacío.");
      return;
    }
    if (!modalColumnId) return;

    const col = columnsSorted.find((c) => c.id === modalColumnId);
    if (!col) return;

    setCreating(true);
    const optimisticId = -Date.now();
    try {
      const nextOrder = Math.max(0, ...col.tasks.map((t) => t.order ?? 0)) + 1;

      const optimisticTask: Task = {
        id: optimisticId,
        title,
        description: formDescription.trim() ? formDescription.trim() : null,
        priority: formPriority,
        order: nextOrder,
        boardId: board.id,
        columnId: col.id,
      };

      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((c) =>
          c.id === col.id ? { ...c, tasks: [...c.tasks, optimisticTask] } : c,
        ),
      }));

      const created = await api<Task>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title,
          description: optimisticTask.description ?? undefined,
          priority: optimisticTask.priority,
          order: nextOrder,
          boardId: board.id,
          columnId: col.id,
        }),
      });

      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((c) =>
          c.id === col.id
            ? {
                ...c,
                tasks: c.tasks.map((t) => (t.id === optimisticId ? created : t)),
              }
            : c,
        ),
      }));

      setModalOpen(false);
    } catch (e) {
      removeTaskLocally(optimisticId);
      const message = e instanceof Error ? e.message : "Error creando la tarea";
      window.alert(message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white p-4 md:flex">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <LayoutGrid className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">PROJECT SYNC</p>
              <p className="text-xs text-zinc-500">My Boards</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Boards
              </p>
              <button
                type="button"
                disabled={!canCreateBoards || addingBoard}
                onClick={onAddBoard}
                className="rounded-md border border-zinc-200 bg-gray-50 px-2 py-0.5 text-xs text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Add
              </button>
            </div>
            <nav className="space-y-1 text-sm">
              {boards.map((b) => {
                const active = b.id === activeBoardId;
                return (
                  <Link
                    key={b.id}
                    href={`/board/${b.id}`}
                    className={[
                      "flex items-center gap-2 rounded-md px-2 py-1.5",
                      active
                        ? "bg-gray-100 text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                    ].join(" ")}
                  >
                    <Hash className="h-4 w-4 text-zinc-400" />
                    <span className="truncate">{b.name}</span>
                  </Link>
                );
              })}
            </nav>
            {boards.length <= 1 ? (
              <p className="mt-3 text-xs text-zinc-400">No hay otros tableros</p>
            ) : null}
          </div>

          <div className="mt-auto rounded-lg border border-zinc-200 bg-white p-3">
            <div className="flex items-center gap-3">
              <span className="relative h-9 w-9 overflow-hidden rounded-full bg-zinc-100">
                <Image
                  src={avatarSrc}
                  alt="Profile photo"
                  fill
                  className="object-cover"
                  onError={() => setAvatarSrc("/avatars/default.svg")}
                />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">
                  Dana G.
                </p>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700"
                >
                  <option value="tech-lead">Tech-lead</option>
                  <option value="jr">Programador Jr</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="w-full px-6 pt-10">
            <header className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-zinc-900">
                Board: {board.name}
              </h1>
              <button
                type="button"
                onClick={onDeleteBoard}
                disabled={!canCreateBoards}
                className="ml-2 inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-gray-50 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                title={
                  canCreateBoards
                    ? "Delete Board"
                    : "Solo Tech-lead puede borrar boards"
                }
              >
                <Trash2 className="h-4 w-4" />
                Delete Board
              </button>
              <button
                type="button"
                onClick={onAddColumn}
                disabled={!canManageColumns || addingColumn}
                className="ml-2 inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-gray-50 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                title={
                  canManageColumns
                    ? "Add Column"
                    : "Solo Tech-lead puede crear columnas"
                }
              >
                <LayoutGrid className="h-4 w-4" />
                Add Column
              </button>
            </header>

            <div className="mt-6 flex w-full gap-4 overflow-x-auto pb-8">
              {columnsSorted.map((col) => (
                <section
                  key={col.id}
                  className="min-w-[300px] rounded-xl border border-zinc-200 bg-gray-100/70 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-medium text-zinc-800">
                        {col.title}{" "}
                        <span className="font-normal text-zinc-400">
                          ({col.tasks.length})
                        </span>
                      </h2>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded-md p-1 text-zinc-400 hover:bg-white/70 hover:text-zinc-700"
                        aria-label="Column actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteColumn(col.id)}
                        disabled={!canManageColumns || deletingColumnIds.has(col.id)}
                        className="rounded-md p-1 text-zinc-300 hover:bg-white/70 hover:text-rose-600 disabled:opacity-50"
                        title={
                          canManageColumns
                            ? "Delete column"
                            : "Solo Tech-lead puede borrar columnas"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {col.tasks
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((t) => {
                        const busy = busyTaskIds.has(t.id);
                        const ui = priorityUi(t.priority);
                        return (
                          <article
                            key={t.id}
                            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-zinc-900">
                                  {t.title}
                                </p>
                                {t.description ? (
                                  <p className="mt-1 text-xs text-zinc-500">
                                    {t.description}
                                  </p>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                onClick={() => onDeleteTask(t.id)}
                                disabled={busy}
                                className="rounded-md p-1 text-zinc-300 hover:bg-zinc-50 hover:text-zinc-600 disabled:opacity-50"
                                aria-label="Delete task"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ${ui.pill}`}
                              >
                                <span className={`h-2 w-2 rounded-full ${ui.dot}`} />
                                {ui.label}
                              </span>

                              <div className="flex items-center gap-2">
                                <select
                                  className="h-7 rounded-md border border-transparent bg-transparent px-2 text-xs text-zinc-400 hover:border-zinc-200 hover:bg-white focus:border-zinc-300 focus:outline-none"
                                  value={t.columnId}
                                  disabled={busy}
                                  onChange={(e) =>
                                    onMoveTask(t.id, Number(e.target.value))
                                  }
                                  aria-label="Move task"
                                >
                                  {columnOptions.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                      {opt.title}
                                    </option>
                                  ))}
                                </select>
                                <span className="relative inline-flex h-7 w-7 overflow-hidden rounded-full bg-zinc-100">
                                  <Image
                                    src={avatarSrc}
                                    alt="User avatar"
                                    fill
                                    className="object-cover"
                                    onError={() => setAvatarSrc("/avatars/default.svg")}
                                  />
                                </span>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={() => openAddTask(col.id)}
                    className="mt-3 w-full rounded-lg border border-dashed border-zinc-300 py-2 text-center text-sm text-zinc-500 hover:bg-white/50"
                  >
                    + Add Task
                  </button>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/10"
            onClick={closeModal}
            aria-label="Close modal overlay"
          />
          <div className="relative w-[420px] max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">Add Task</h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Title
                </label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Develop new user profile API"
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-300"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide more details about this task..."
                  rows={3}
                  className="mt-1 w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-700">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) =>
                      setFormPriority(e.target.value as Task["priority"])
                    }
                    className="mt-1 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-300"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-700">
                    Column
                  </label>
                  <select
                    value={modalColumnId ?? ""}
                    onChange={(e) => setModalColumnId(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-300"
                  >
                    {columnOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={creating}
                  className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={createTask}
                  disabled={creating}
                  className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

