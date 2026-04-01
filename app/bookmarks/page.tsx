"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import type { Bookmark, BookmarkCategory } from "@/lib/types";
import * as db from "@/lib/db";
import { cn } from "@/lib/utils";

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function titleInitial(title: string): string {
  const c = title.trim().charAt(0);
  return c ? c.toUpperCase() : "?";
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarksState] = useState<Bookmark[]>([]);
  const [categories, setCategoriesState] = useState<BookmarkCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all">(
    "all",
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [bms, cats] = await Promise.all([
        db.fetchBookmarks(),
        db.fetchBookmarkCategories(),
      ]);
      setBookmarksState(bms);
      setCategoriesState(cats.sort((a, b) => a.order - b.order));
    } catch (err) {
      console.error("Failed to load bookmarks:", err);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalOpen(false);
        setEditingId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  const categoryById = useMemo(() => {
    const map = new Map<string, BookmarkCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const filteredBookmarks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = [...bookmarks].sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.createdAt.localeCompare(b.createdAt);
    });

    if (activeCategoryId !== "all") {
      list = list.filter((b) => b.category === activeCategoryId);
    }

    if (q) {
      list = list.filter((b) => {
        const title = b.title.toLowerCase();
        const desc = (b.description ?? "").toLowerCase();
        return title.includes(q) || desc.includes(q);
      });
    }

    return list;
  }, [bookmarks, searchQuery, activeCategoryId]);

  const openAddModal = () => {
    setEditingId(null);
    setFormTitle("");
    setFormUrl("");
    setFormDescription("");
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    setFormCategoryId(sorted[0]?.id ?? "");
    setModalOpen(true);
  };

  const openEditModal = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setFormTitle(bookmark.title);
    setFormUrl(bookmark.url);
    setFormDescription(bookmark.description ?? "");
    setFormCategoryId(
      categoryById.has(bookmark.category)
        ? bookmark.category
        : categories.sort((a, b) => a.order - b.order)[0]?.id ?? "",
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSaveBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    const url = normalizeUrl(formUrl);
    if (!formTitle.trim() || !url) return;

    if (editingId) {
      const patch: Partial<Bookmark> = {
        title: formTitle.trim(),
        url,
        description: formDescription.trim() || undefined,
        category: formCategoryId,
      };
      setBookmarksState((prev) =>
        prev.map((b) => (b.id === editingId ? { ...b, ...patch } : b)),
      );
      db.updateBookmark(editingId, patch).catch(console.error);
    } else {
      const maxOrder = bookmarks.reduce((m, b) => Math.max(m, b.order), -1);
      const newBookmark: Bookmark = {
        id: uuidv4(),
        title: formTitle.trim(),
        url,
        description: formDescription.trim() || undefined,
        category: formCategoryId,
        createdAt: new Date().toISOString(),
        order: maxOrder + 1,
      };
      setBookmarksState((prev) => [...prev, newBookmark]);
      db.insertBookmark(newBookmark).catch(console.error);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    setBookmarksState((prev) => prev.filter((b) => b.id !== id));
    db.deleteBookmark(id).catch(console.error);
  };

  const openBookmarkUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const chipInactive =
    "border border-border bg-background text-foreground hover:bg-secondary";
  const chipActive = "border border-black bg-black text-white";

  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="px-12 py-10 flex flex-col gap-8 h-full font-sans">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          收藏夹
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-[240px] shrink-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索…"
              className="h-10 w-full border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-none"
              aria-label="搜索收藏"
            />
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex h-10 items-center gap-2 border border-black bg-black px-4 text-sm font-medium text-white hover:opacity-90 rounded-none"
          >
            <Plus className="h-4 w-4" aria-hidden />
            添加收藏
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveCategoryId("all")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors rounded-none",
            activeCategoryId === "all" ? chipActive : chipInactive,
          )}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategoryId(cat.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors rounded-none",
              activeCategoryId === cat.id ? chipActive : chipInactive,
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {filteredBookmarks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {bookmarks.length === 0
            ? "暂无收藏，添加第一个吧。"
            : "没有匹配的收藏。"}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {filteredBookmarks.map((bookmark) => {
            const cat = categoryById.get(bookmark.category);
            const badgeLabel = cat?.name ?? bookmark.category;

            return (
              <article
                key={bookmark.id}
                role="link"
                tabIndex={0}
                onClick={() => openBookmarkUrl(bookmark.url)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openBookmarkUrl(bookmark.url);
                  }
                }}
                className="group relative cursor-pointer border border-border bg-background p-5 flex flex-col gap-4 transition-colors hover:bg-secondary/50 rounded-none outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 bg-secondary border border-border flex items-center justify-center font-heading text-sm font-semibold text-foreground shrink-0"
                    aria-hidden
                  >
                    {bookmark.favicon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={bookmark.favicon}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      titleInitial(bookmark.title)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-heading text-base font-semibold leading-snug text-foreground line-clamp-2">
                      {bookmark.title}
                    </h2>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {bookmark.url}
                    </p>
                  </div>
                </div>

                <p className="min-h-[2.5rem] text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {bookmark.description?.trim() ? (
                    bookmark.description
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </p>

                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground px-2 py-0.5">
                    {badgeLabel}
                  </span>
                  <div
                    className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center border border-border bg-background text-foreground hover:bg-secondary rounded-none"
                      aria-label="打开链接"
                      onClick={() => openBookmarkUrl(bookmark.url)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center border border-border bg-background text-foreground hover:bg-secondary rounded-none"
                      aria-label="编辑收藏"
                      onClick={() => openEditModal(bookmark)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center border border-border bg-background text-destructive hover:bg-secondary rounded-none"
                      aria-label="删除收藏"
                      onClick={() => handleDelete(bookmark.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4"
          role="presentation"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bookmark-modal-title"
            className="w-full max-w-md border border-border bg-background p-6 shadow-lg rounded-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2
                id="bookmark-modal-title"
                className="font-heading text-lg font-semibold text-foreground"
              >
                {editingId ? "编辑收藏" : "添加收藏"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-border text-foreground hover:bg-secondary rounded-none"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBookmark} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="bm-title"
                  className="text-xs font-medium text-muted-foreground"
                >
                  标题
                </label>
                <input
                  id="bm-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="h-10 w-full border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="bm-url"
                  className="text-xs font-medium text-muted-foreground"
                >
                  URL
                </label>
                <input
                  id="bm-url"
                  type="text"
                  inputMode="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  required
                  placeholder="https://"
                  className="h-10 w-full border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="bm-desc"
                  className="text-xs font-medium text-muted-foreground"
                >
                  描述
                </label>
                <textarea
                  id="bm-desc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full resize-y border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="bm-cat"
                  className="text-xs font-medium text-muted-foreground"
                >
                  分类
                </label>
                <select
                  id="bm-cat"
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="h-10 w-full border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-none"
                >
                  {categories.length === 0 ? (
                    <option value="">—</option>
                  ) : (
                    categories
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                  )}
                </select>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-10 border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-secondary rounded-none"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="h-10 border border-border bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 rounded-none"
                >
                  {editingId ? "保存" : "添加"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
