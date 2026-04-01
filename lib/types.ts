export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  createdAt: string;
  dueDate?: string;
  order: number;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: string;
  favicon?: string;
  createdAt: string;
  order: number;
}

export interface BookmarkCategory {
  id: string;
  name: string;
  icon?: string;
  order: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  text: string;
  author: string;
}

export interface UserSettings {
  displayName: string;
  theme: "light" | "dark" | "system";
}

export type TodoFilter = "all" | "active" | "completed";
export type Priority = "high" | "medium" | "low";
