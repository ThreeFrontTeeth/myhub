import { supabase } from "./supabase";
import type {
  Todo,
  Bookmark,
  BookmarkCategory,
  Note,
  Quote,
  UserSettings,
} from "./types";

// ─── Row Types (snake_case DB columns) ─────────────────────

interface TodoRow {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  created_at: string;
  due_date: string | null;
  sort_order: number;
}

interface BookmarkRow {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  favicon: string | null;
  created_at: string;
  sort_order: number;
}

interface CategoryRow {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

interface NoteRow {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Mappers ────────────────────────────────────────────────

function todoFromRow(r: TodoRow): Todo {
  return {
    id: r.id,
    title: r.title,
    completed: r.completed,
    priority: r.priority as Todo["priority"],
    createdAt: r.created_at,
    dueDate: r.due_date ?? undefined,
    order: r.sort_order,
  };
}

function todoToRow(t: Todo): TodoRow {
  return {
    id: t.id,
    title: t.title,
    completed: t.completed,
    priority: t.priority,
    created_at: t.createdAt,
    due_date: t.dueDate ?? null,
    sort_order: t.order,
  };
}

function bookmarkFromRow(r: BookmarkRow): Bookmark {
  return {
    id: r.id,
    title: r.title,
    url: r.url,
    description: r.description ?? undefined,
    category: r.category,
    favicon: r.favicon ?? undefined,
    createdAt: r.created_at,
    order: r.sort_order,
  };
}

function bookmarkToRow(b: Bookmark): BookmarkRow {
  return {
    id: b.id,
    title: b.title,
    url: b.url,
    description: b.description ?? null,
    category: b.category,
    favicon: b.favicon ?? null,
    created_at: b.createdAt,
    sort_order: b.order,
  };
}

function categoryFromRow(r: CategoryRow): BookmarkCategory {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon ?? undefined,
    order: r.sort_order,
  };
}

function noteFromRow(r: NoteRow): Note {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    tags: r.tags,
    pinned: r.pinned,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function noteToRow(n: Note): NoteRow {
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    tags: n.tags,
    pinned: n.pinned,
    created_at: n.createdAt,
    updated_at: n.updatedAt,
  };
}

// ─── Todos ──────────────────────────────────────────────────

export async function fetchTodos(): Promise<Todo[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map(todoFromRow);
}

export async function insertTodo(todo: Todo): Promise<void> {
  const { error } = await supabase.from("todos").insert(todoToRow(todo));
  if (error) throw error;
}

export async function updateTodo(
  id: string,
  patch: Partial<Todo>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.completed !== undefined) row.completed = patch.completed;
  if (patch.priority !== undefined) row.priority = patch.priority;
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate ?? null;
  if (patch.order !== undefined) row.sort_order = patch.order;
  const { error } = await supabase.from("todos").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteCompletedTodos(): Promise<void> {
  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("completed", true);
  if (error) throw error;
}

// ─── Bookmarks ──────────────────────────────────────────────

export async function fetchBookmarks(): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map(bookmarkFromRow);
}

export async function insertBookmark(b: Bookmark): Promise<void> {
  const { error } = await supabase.from("bookmarks").insert(bookmarkToRow(b));
  if (error) throw error;
}

export async function updateBookmark(
  id: string,
  patch: Partial<Bookmark>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.url !== undefined) row.url = patch.url;
  if (patch.description !== undefined)
    row.description = patch.description ?? null;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.favicon !== undefined) row.favicon = patch.favicon ?? null;
  if (patch.order !== undefined) row.sort_order = patch.order;
  const { error } = await supabase.from("bookmarks").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteBookmark(id: string): Promise<void> {
  const { error } = await supabase.from("bookmarks").delete().eq("id", id);
  if (error) throw error;
}

// ─── Bookmark Categories ────────────────────────────────────

export async function fetchBookmarkCategories(): Promise<BookmarkCategory[]> {
  const { data, error } = await supabase
    .from("bookmark_categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map(categoryFromRow);
}

// ─── Notes ──────────────────────────────────────────────────

export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(noteFromRow);
}

export async function insertNote(n: Note): Promise<void> {
  const { error } = await supabase.from("notes").insert(noteToRow(n));
  if (error) throw error;
}

export async function updateNote(
  id: string,
  patch: Partial<Note>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.content !== undefined) row.content = patch.content;
  if (patch.tags !== undefined) row.tags = patch.tags;
  if (patch.pinned !== undefined) row.pinned = patch.pinned;
  if (patch.updatedAt !== undefined) row.updated_at = patch.updatedAt;
  const { error } = await supabase.from("notes").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

// ─── Saved Quotes ───────────────────────────────────────────

export async function fetchSavedQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from("saved_quotes")
    .select("text, author");
  if (error) throw error;
  return (data ?? []) as Quote[];
}

export async function insertSavedQuote(q: Quote): Promise<void> {
  const { error } = await supabase
    .from("saved_quotes")
    .insert({ text: q.text, author: q.author });
  if (error) throw error;
}

// ─── User Settings ──────────────────────────────────────────

const DEFAULT_SETTINGS: UserSettings = { displayName: "用户", theme: "light" };

export async function fetchSettings(): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("display_name, theme")
    .eq("id", "default")
    .single();
  if (error || !data) return DEFAULT_SETTINGS;
  return {
    displayName: data.display_name,
    theme: data.theme as UserSettings["theme"],
  };
}

export async function upsertSettings(s: UserSettings): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .upsert({ id: "default", display_name: s.displayName, theme: s.theme });
  if (error) throw error;
}

// ─── Bulk Operations (export / import / reset) ─────────────

function deleteAll(table: string) {
  return supabase.from(table).delete().not("id", "is", null);
}

export async function exportAll(): Promise<string> {
  const [todos, bookmarks, bookmarkCategories, notes, settings, savedQuotes] =
    await Promise.all([
      fetchTodos(),
      fetchBookmarks(),
      fetchBookmarkCategories(),
      fetchNotes(),
      fetchSettings(),
      fetchSavedQuotes(),
    ]);
  return JSON.stringify(
    { todos, bookmarks, bookmarkCategories, notes, settings, savedQuotes },
    null,
    2,
  );
}

export async function importAll(json: string): Promise<boolean> {
  try {
    const data = JSON.parse(json);

    await Promise.all([
      deleteAll("todos"),
      deleteAll("bookmarks"),
      deleteAll("bookmark_categories"),
      deleteAll("notes"),
      deleteAll("saved_quotes"),
      deleteAll("user_settings"),
    ]);

    const ops: Promise<unknown>[] = [];

    if (Array.isArray(data.todos) && data.todos.length > 0) {
      ops.push(
        supabase
          .from("todos")
          .insert(data.todos.map((t: Todo) => todoToRow(t)))
          .then(),
      );
    }

    if (Array.isArray(data.bookmarks) && data.bookmarks.length > 0) {
      ops.push(
        supabase
          .from("bookmarks")
          .insert(data.bookmarks.map((b: Bookmark) => bookmarkToRow(b)))
          .then(),
      );
    }

    if (
      Array.isArray(data.bookmarkCategories) &&
      data.bookmarkCategories.length > 0
    ) {
      ops.push(
        supabase
          .from("bookmark_categories")
          .insert(
            data.bookmarkCategories.map((c: BookmarkCategory) => ({
              id: c.id,
              name: c.name,
              icon: c.icon ?? null,
              sort_order: c.order,
            })),
          )
          .then(),
      );
    }

    if (Array.isArray(data.notes) && data.notes.length > 0) {
      ops.push(
        supabase
          .from("notes")
          .insert(data.notes.map((n: Note) => noteToRow(n)))
          .then(),
      );
    }

    if (Array.isArray(data.savedQuotes) && data.savedQuotes.length > 0) {
      ops.push(
        supabase
          .from("saved_quotes")
          .insert(
            data.savedQuotes.map((q: Quote) => ({
              text: q.text,
              author: q.author,
            })),
          )
          .then(),
      );
    }

    if (data.settings) {
      ops.push(upsertSettings(data.settings));
    }

    await Promise.all(ops);
    return true;
  } catch {
    return false;
  }
}

export async function resetAll(): Promise<void> {
  await Promise.all([
    deleteAll("todos"),
    deleteAll("bookmarks"),
    deleteAll("bookmark_categories"),
    deleteAll("notes"),
    deleteAll("saved_quotes"),
    deleteAll("user_settings"),
  ]);

  await supabase.from("bookmark_categories").insert([
    { id: "work", name: "工作", sort_order: 0 },
    { id: "learning", name: "学习", sort_order: 1 },
    { id: "tools", name: "工具", sort_order: 2 },
    { id: "entertainment", name: "娱乐", sort_order: 3 },
  ]);

  await supabase
    .from("user_settings")
    .upsert({ id: "default", display_name: "用户", theme: "light" });
}
