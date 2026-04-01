"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Pin, Plus, Search, Trash2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Note } from "@/lib/types";
import * as db from "@/lib/db";

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function listPreview(content: string, maxLen: number): string {
  const oneLine = content.replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLen) return oneLine || "暂无内容";
  return `${oneLine.slice(0, maxLen)}…`;
}

function sortNotesForDisplay(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function noteMatchesQuery(note: Note, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    note.title.toLowerCase().includes(q) ||
    note.content.toLowerCase().includes(q) ||
    note.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}

const DEBOUNCE_MS = 500;

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    db.fetchNotes()
      .then((data) => {
        setNotes(data);
        setHydrated(true);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    return () => clearTimeout(saveTimerRef.current ?? undefined);
  }, []);

  const filteredNotes = useMemo(() => {
    const filtered = notes.filter((n) => noteMatchesQuery(n, searchQuery));
    return sortNotesForDisplay(filtered);
  }, [notes, searchQuery]);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedId) ?? null,
    [notes, selectedId],
  );

  useEffect(() => {
    if (!selectedId) return;
    if (!notes.some((n) => n.id === selectedId)) {
      const next = sortNotesForDisplay(notes)[0]?.id ?? null;
      setSelectedId(next);
    }
  }, [notes, selectedId]);

  const handleNewNote = useCallback(() => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: uuidv4(),
      title: "无标题",
      content: "",
      tags: [],
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedId(newNote.id);
    setTagDraft("");
    db.insertNote(newNote).catch(console.error);
  }, []);

  const patchSelected = useCallback(
    (patch: Partial<Note>) => {
      if (!selectedId) return;
      const now = new Date().toISOString();
      const fullPatch = { ...patch, updatedAt: now };
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedId ? { ...n, ...fullPatch } : n,
        ),
      );
      clearTimeout(saveTimerRef.current ?? undefined);
      const idToSave = selectedId;
      saveTimerRef.current = setTimeout(() => {
        db.updateNote(idToSave, fullPatch).catch(console.error);
      }, DEBOUNCE_MS);
    },
    [selectedId],
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      patchSelected({ title });
    },
    [patchSelected],
  );

  const handleContentChange = useCallback(
    (content: string) => {
      patchSelected({ content });
    },
    [patchSelected],
  );

  const handleTogglePin = useCallback(() => {
    if (!selectedNote) return;
    const pinned = !selectedNote.pinned;
    if (!selectedId) return;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedId
          ? { ...n, pinned, updatedAt: new Date().toISOString() }
          : n,
      ),
    );
    db.updateNote(selectedId, {
      pinned,
      updatedAt: new Date().toISOString(),
    }).catch(console.error);
  }, [selectedNote, selectedId]);

  const handleDeleteNote = useCallback(() => {
    if (!selectedId) return;
    const idToDelete = selectedId;
    setNotes((prev) => prev.filter((n) => n.id !== idToDelete));
    db.deleteNote(idToDelete).catch(console.error);
  }, [selectedId]);

  const addTagFromDraft = useCallback(() => {
    if (!selectedNote) return;
    const raw = tagDraft.trim();
    if (!raw) return;
    const parts = raw
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
    const merged = [...new Set([...selectedNote.tags, ...parts])];
    patchSelected({ tags: merged });
    setTagDraft("");
  }, [selectedNote, tagDraft, patchSelected]);

  const removeTag = useCallback(
    (tag: string) => {
      if (!selectedNote) return;
      patchSelected({
        tags: selectedNote.tags.filter((t) => t !== tag),
      });
    },
    [selectedNote, patchSelected],
  );

  const onTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTagFromDraft();
    }
  };

  if (!hydrated) {
    return <div className="flex h-full min-h-0 bg-background" />;
  }

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex h-full w-[360px] shrink-0 flex-col border-r border-border">
        <div className="flex shrink-0 items-center justify-between px-6 py-8">
          <h1 className="font-heading text-xl font-semibold text-foreground">
            笔记
          </h1>
          <button
            type="button"
            onClick={handleNewNote}
            className="inline-flex items-center gap-1.5 bg-black px-3 py-2 text-xs font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            新建
          </button>
        </div>
        <div className="shrink-0 px-6 pb-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={2}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索笔记…"
              className="w-full border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="搜索笔记"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">
              {notes.length === 0
                ? "暂无笔记，点击「新建」创建一篇。"
                : "没有匹配的笔记。"}
            </p>
          ) : (
            <ul className="list-none">
              {filteredNotes.map((note) => {
                const isActive = note.id === selectedId;
                return (
                  <li key={note.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(note.id)}
                      className={`w-full cursor-pointer border-b border-border px-6 py-4 text-left hover:bg-secondary/50 ${
                        isActive ? "bg-secondary" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {note.pinned ? (
                          <Pin
                            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                            strokeWidth={2}
                            aria-hidden
                          />
                        ) : (
                          <span className="w-4 shrink-0" aria-hidden />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">
                            {note.title || "无标题"}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {listPreview(note.content, 100)}
                          </p>
                          {note.tags.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {note.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[11px] text-muted-foreground px-1.5 py-0.5 border border-border"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            {formatUpdatedAt(note.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className="flex min-h-0 flex-1 flex-col overflow-y-auto px-12 py-10">
        {!selectedNote ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="font-heading text-lg text-muted-foreground">
              选择一篇笔记或新建一篇
            </p>
          </div>
        ) : (
          <>
            <header className="shrink-0">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="min-w-0 flex-1 border-0 bg-transparent font-heading text-2xl font-semibold text-foreground outline-none focus:ring-0"
                  aria-label="笔记标题"
                />
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTogglePin}
                    className={`inline-flex h-9 w-9 items-center justify-center border border-border hover:bg-secondary ${
                      selectedNote.pinned ? "bg-secondary text-primary" : ""
                    }`}
                    aria-label={
                      selectedNote.pinned ? "取消置顶" : "置顶笔记"
                    }
                  >
                    <Pin className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteNote}
                    className="inline-flex h-9 w-9 items-center justify-center border border-border text-destructive hover:bg-secondary"
                    aria-label="删除笔记"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {selectedNote.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground px-1.5 py-0.5 border border-border hover:bg-secondary"
                  >
                    {tag}
                    <X className="h-3 w-3" strokeWidth={2} aria-hidden />
                  </button>
                ))}
                <input
                  type="text"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={onTagKeyDown}
                  onBlur={addTagFromDraft}
                  placeholder="添加标签…"
                  className="min-w-[120px] flex-1 border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:max-w-[200px]"
                  aria-label="添加标签"
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                更新于 {formatUpdatedAt(selectedNote.updatedAt)}
              </p>
            </header>
            <hr className="my-8 shrink-0 border-border" />
            <div className="flex min-h-0 flex-1 flex-col gap-8">
              <div className="shrink-0">
                <label
                  htmlFor="note-content"
                  className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  Markdown
                </label>
                <textarea
                  id="note-content"
                  value={selectedNote.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={12}
                  className="min-h-[200px] w-full resize-y border border-border bg-background p-4 font-mono text-sm leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  spellCheck
                />
              </div>
              <div className="min-h-0 flex-1 border-t border-border pt-8">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  预览
                </p>
                <div className="prose prose-sm max-w-none notes-prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedNote.content || "*暂无内容*"}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
