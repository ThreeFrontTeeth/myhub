"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  BookmarkPlus,
  FileText,
  ListChecks,
  Quote as QuoteIcon,
  RefreshCw,
} from "lucide-react";
import { getRandomQuote } from "@/lib/quotes";
import * as db from "@/lib/db";
import type { Quote, Todo, UserSettings } from "@/lib/types";

function getGreetingLabel(hour: number): string {
  if (hour >= 6 && hour < 12) return "早上好";
  if (hour >= 12 && hour < 18) return "下午好";
  return "晚上好";
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("zh-CN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDueDate(iso?: string): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function priorityDotClass(priority: Todo["priority"]): string {
  switch (priority) {
    case "high":
      return "bg-[#E42313]";
    case "medium":
      return "bg-[#F59E0B]";
    case "low":
      return "bg-[#22C55E]";
    default:
      return "bg-muted-foreground";
  }
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    displayName: "用户",
    theme: "light",
  });
  const [todos, setTodos] = useState<Todo[]>([]);
  const [bookmarks, setBookmarks] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [savedQuotesCount, setSavedQuotesCount] = useState(0);
  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);
  const [dailyQuote, setDailyQuote] = useState<Quote>({ text: "", author: "" });

  useEffect(() => {
    setNow(new Date());
    setDailyQuote(getRandomQuote());

    async function load() {
      try {
        const [s, t, b, n, q] = await Promise.all([
          db.fetchSettings(),
          db.fetchTodos(),
          db.fetchBookmarks(),
          db.fetchNotes(),
          db.fetchSavedQuotes(),
        ]);
        setSettings(s);
        setTodos(t);
        setBookmarks(b.length);
        setNotesCount(n.length);
        setSavedQuotes(q);
        setSavedQuotesCount(q.length);
      } catch (err) {
        console.error("Failed to load data from Supabase:", err);
      }
      setMounted(true);
    }
    load();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const completedCount = useMemo(
    () => todos.filter((t) => t.completed).length,
    [todos],
  );
  const totalTodos = todos.length;

  const recentTodos = useMemo(() => {
    return [...todos]
      .sort((a, b) => {
        const ta = new Date(a.createdAt).getTime();
        const tb = new Date(b.createdAt).getTime();
        return tb - ta;
      })
      .slice(0, 5);
  }, [todos]);

  const isQuoteSaved = useMemo(() => {
    return savedQuotes.some(
      (q) => q.text === dailyQuote.text && q.author === dailyQuote.author,
    );
  }, [savedQuotes, dailyQuote]);

  const handleToggleTodo = useCallback(
    (id: string) => {
      const target = todos.find((t) => t.id === id);
      setTodos((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t,
        ),
      );
      if (target) {
        db.updateTodo(id, { completed: !target.completed }).catch(
          console.error,
        );
      }
    },
    [todos],
  );

  const handleRefreshQuote = useCallback(() => {
    setDailyQuote(getRandomQuote());
  }, []);

  const handleSaveQuote = useCallback(() => {
    if (isQuoteSaved) return;
    setSavedQuotes((prev) => {
      const next = [...prev, dailyQuote];
      setSavedQuotesCount(next.length);
      return next;
    });
    db.insertSavedQuote(dailyQuote).catch(console.error);
  }, [dailyQuote, isQuoteSaved]);

  const greeting = now ? getGreetingLabel(now.getHours()) : "";
  const userName = settings.displayName || "用户";

  if (!mounted || !now) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <main className="min-h-screen rounded-none bg-background font-sans">
      <div className="flex flex-col gap-12 px-12 py-10">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-heading font-medium tracking-tight text-foreground">
              {greeting}, {userName}
            </h1>
            <p className="font-sans text-sm text-muted-foreground">
              {formatDisplayDate(now)}
            </p>
          </div>
          <time
            dateTime={now.toISOString()}
            className="text-4xl font-heading font-semibold tracking-tight text-foreground tabular-nums sm:text-right"
          >
            {formatTime(now)}
          </time>
        </header>

        <section
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="仪表盘指标"
        >
          <div className="flex gap-6 rounded-none border border-border bg-secondary p-7">
            <ListChecks
              className="h-8 w-8 shrink-0 text-primary"
              strokeWidth={1.5}
              aria-hidden
            />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="font-sans text-sm text-muted-foreground">
                待办完成
              </p>
              <p className="text-4xl font-heading font-semibold tracking-tight text-foreground">
                {completedCount} / {totalTodos}
              </p>
            </div>
          </div>
          <div className="flex gap-6 rounded-none border border-border bg-secondary p-7">
            <Bookmark
              className="h-8 w-8 shrink-0 text-primary"
              strokeWidth={1.5}
              aria-hidden
            />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="font-sans text-sm text-muted-foreground">
                网站收藏
              </p>
              <p className="text-4xl font-heading font-semibold tracking-tight text-foreground">
                {bookmarks}
              </p>
            </div>
          </div>
          <div className="flex gap-6 rounded-none border border-border bg-secondary p-7">
            <FileText
              className="h-8 w-8 shrink-0 text-primary"
              strokeWidth={1.5}
              aria-hidden
            />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="font-sans text-sm text-muted-foreground">
                笔记数量
              </p>
              <p className="text-4xl font-heading font-semibold tracking-tight text-foreground">
                {notesCount}
              </p>
            </div>
          </div>
          <div className="flex gap-6 rounded-none border border-border bg-secondary p-7">
            <QuoteIcon
              className="h-8 w-8 shrink-0 text-primary"
              strokeWidth={1.5}
              aria-hidden
            />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="font-sans text-sm text-muted-foreground">
                收藏名言
              </p>
              <p className="text-4xl font-heading font-semibold tracking-tight text-foreground">
                {savedQuotesCount}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="flex flex-col rounded-none border border-border bg-secondary p-7">
            <h2 className="mb-6 font-heading text-xl font-medium tracking-tight text-foreground">
              近期待办
            </h2>
            {recentTodos.length === 0 ? (
              <p className="font-sans text-sm text-muted-foreground">
                暂无待办事项
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {recentTodos.map((todo) => (
                  <li
                    key={todo.id}
                    className="flex items-start gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0"
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo.id)}
                      className="mt-1 h-4 w-4 shrink-0 rounded-none border border-border accent-primary"
                      aria-label={`将「${todo.title}」标记为${todo.completed ? "未完成" : "已完成"}`}
                    />
                    <span
                      className={`min-w-0 flex-1 font-sans text-sm ${
                        todo.completed
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {todo.title}
                    </span>
                    <span className="shrink-0 font-sans text-xs text-muted-foreground">
                      {formatDueDate(todo.dueDate)}
                    </span>
                    <span
                      className={`mt-1.5 h-[8px] w-[8px] shrink-0 rounded-full ${priorityDotClass(todo.priority)}`}
                      title={todo.priority}
                      aria-label={`优先级：${todo.priority}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col rounded-none border border-border bg-secondary p-7">
            <h2 className="mb-6 font-heading text-xl font-medium tracking-tight text-foreground">
              每日一言
            </h2>
            <div className="flex flex-1 flex-col gap-4">
              <QuoteIcon
                className="h-10 w-10 text-primary opacity-80"
                strokeWidth={1.25}
                aria-hidden
              />
              <blockquote className="font-sans text-base leading-relaxed text-foreground">
                "{dailyQuote.text}"
              </blockquote>
              <cite className="font-sans text-sm not-italic text-muted-foreground">
                — {dailyQuote.author}
              </cite>
              <div className="mt-auto flex flex-wrap gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleSaveQuote}
                  disabled={isQuoteSaved}
                  className="inline-flex items-center gap-2 rounded-none border border-border bg-background px-4 py-2 font-sans text-sm text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <BookmarkPlus className="h-4 w-4" aria-hidden />
                  {isQuoteSaved ? "已收藏" : "收藏"}
                </button>
                <button
                  type="button"
                  onClick={handleRefreshQuote}
                  className="inline-flex items-center gap-2 rounded-none border border-border bg-background px-4 py-2 font-sans text-sm text-foreground transition-colors hover:bg-secondary"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  换一条
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
