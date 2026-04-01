"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Check, Plus, Trash2 } from "lucide-react";
import type { Priority, Todo, TodoFilter } from "@/lib/types";
import * as db from "@/lib/db";

const PRIORITY_LABEL: Record<Priority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const PRIORITY_DOT_CLASS: Record<Priority, string> = {
  high: "bg-[#E42313]",
  medium: "bg-[#F59E0B]",
  low: "bg-[#22C55E]",
};

const PRIORITY_TEXT_CLASS: Record<Priority, string> = {
  high: "text-[#E42313]",
  medium: "text-[#F59E0B]",
  low: "text-[#22C55E]",
};

function formatDueDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    db.fetchTodos()
      .then((data) => {
        setTodos(data);
        setHydrated(true);
      })
      .catch(console.error);
  }, []);

  const counts = useMemo(() => {
    const active = todos.filter((t) => !t.completed).length;
    const completed = todos.filter((t) => t.completed).length;
    return { all: todos.length, active, completed };
  }, [todos]);

  const filteredTodos = useMemo(() => {
    const sorted = [...todos].sort((a, b) => a.order - b.order);
    if (filter === "active") return sorted.filter((t) => !t.completed);
    if (filter === "completed") return sorted.filter((t) => t.completed);
    return sorted;
  }, [todos, filter]);

  const nextOrder = useCallback(() => {
    if (todos.length === 0) return 0;
    return Math.max(...todos.map((t) => t.order)) + 1;
  }, [todos]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const todo: Todo = {
      id: uuidv4(),
      title,
      completed: false,
      priority: newPriority,
      createdAt: new Date().toISOString(),
      dueDate: newDueDate || undefined,
      order: nextOrder(),
    };
    setTodos((prev) => [...prev, todo]);
    setNewTitle("");
    setNewPriority("medium");
    setNewDueDate("");
    setShowAddForm(false);
    db.insertTodo(todo).catch(console.error);
  };

  const toggleComplete = (id: string) => {
    const target = todos.find((t) => t.id === id);
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
    if (target) {
      db.updateTodo(id, { completed: !target.completed }).catch(console.error);
    }
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditTitle("");
    }
    db.deleteTodo(id).catch(console.error);
  };

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((t) => !t.completed));
    setEditingId(null);
    setEditTitle("");
    db.deleteCompletedTodos().catch(console.error);
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
  };

  const commitEdit = () => {
    if (!editingId) return;
    const title = editTitle.trim();
    if (title) {
      setTodos((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, title } : t)),
      );
      db.updateTodo(editingId, { title }).catch(console.error);
    }
    setEditingId(null);
    setEditTitle("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const filterTabs: { key: TodoFilter; label: string; count: number }[] = [
    { key: "all", label: "全部", count: counts.all },
    { key: "active", label: "进行中", count: counts.active },
    { key: "completed", label: "已完成", count: counts.completed },
  ];

  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="px-12 py-10 flex flex-col gap-8 h-full min-h-0 font-sans">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-heading font-medium tracking-tight text-foreground">
          待办事项
        </h1>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-none bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90"
        >
          <Plus className="size-4" strokeWidth={2} />
          添加待办
        </button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border">
        <nav className="flex gap-8" aria-label="筛选待办">
          {filterTabs.map((tab) => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`relative pb-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}{" "}
                <span
                  className={
                    isActive ? "text-primary" : "text-muted-foreground"
                  }
                >
                  ({tab.count})
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={clearCompleted}
          disabled={counts.completed === 0}
          className="mb-2 inline-flex items-center gap-2 rounded-none border border-border bg-background px-3 py-2 text-sm text-foreground disabled:pointer-events-none disabled:opacity-40 hover:bg-secondary"
        >
          <Trash2 className="size-4" strokeWidth={2} />
          清除已完成
        </button>
      </div>

      <div className="flex flex-col gap-0 border border-border rounded-none overflow-hidden flex-1 min-h-0">
        {showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            className="flex flex-wrap items-end gap-4 border-b border-border bg-secondary px-5 py-4"
          >
            <label className="flex flex-col gap-1 min-w-[200px] flex-1">
              <span className="text-xs font-medium text-muted-foreground">
                标题
              </span>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="任务名称"
                className="rounded-none border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
                autoFocus
              />
            </label>
            <label className="flex flex-col gap-1 w-36">
              <span className="text-xs font-medium text-muted-foreground">
                优先级
              </span>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className="rounded-none border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 w-44">
              <span className="text-xs font-medium text-muted-foreground">
                截止日期
              </span>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="rounded-none border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-none bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                添加
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewTitle("");
                  setNewDueDate("");
                }}
                className="rounded-none border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary"
              >
                取消
              </button>
            </div>
          </form>
        )}

        <div
          className="flex items-center gap-4 px-5 py-4 border-b border-border bg-secondary text-xs font-medium uppercase tracking-wide text-muted-foreground"
          role="row"
        >
          <div className="w-4 shrink-0" aria-hidden />
          <div className="flex-1 min-w-0">任务</div>
          <div className="w-28 shrink-0">优先级</div>
          <div className="w-36 shrink-0">截止日期</div>
          <div className="w-10 shrink-0 text-right">操作</div>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          {filteredTodos.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              当前视图暂无任务
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0"
                role="row"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={todo.completed}
                  onClick={() => toggleComplete(todo.id)}
                  className={`size-4 shrink-0 flex items-center justify-center border border-border rounded-none transition-colors ${
                    todo.completed
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background"
                  }`}
                >
                  {todo.completed && <Check className="size-3" strokeWidth={3} />}
                </button>

                <div className="flex-1 min-w-0">
                  {editingId === todo.id ? (
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitEdit();
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          cancelEdit();
                        }
                      }}
                      className="w-full rounded-none border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      autoFocus
                    />
                  ) : (
                    <span
                      onDoubleClick={() => startEdit(todo)}
                      className={`block truncate text-sm text-foreground cursor-default select-none ${
                        todo.completed ? "line-through text-muted-foreground" : ""
                      }`}
                      title="双击编辑"
                    >
                      {todo.title}
                    </span>
                  )}
                </div>

                <div className="w-28 shrink-0 flex items-center gap-2">
                  <span
                    className={`size-2 shrink-0 rounded-none ${PRIORITY_DOT_CLASS[todo.priority]}`}
                    aria-hidden
                  />
                  <span
                    className={`text-sm ${PRIORITY_TEXT_CLASS[todo.priority]}`}
                  >
                    {PRIORITY_LABEL[todo.priority]}
                  </span>
                </div>

                <div className="w-36 shrink-0 text-sm text-foreground">
                  {formatDueDate(todo.dueDate)}
                </div>

                <div className="w-10 shrink-0 flex justify-end">
                  <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    className="rounded-none p-1 text-muted-foreground hover:text-primary"
                    aria-label={`删除 ${todo.title}`}
                  >
                    <Trash2 className="size-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
