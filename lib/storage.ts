import { Todo, Bookmark, BookmarkCategory, Note, UserSettings, Quote } from "./types";

const KEYS = {
  TODOS: "myhub_todos",
  BOOKMARKS: "myhub_bookmarks",
  BOOKMARK_CATEGORIES: "myhub_bookmark_categories",
  NOTES: "myhub_notes",
  SETTINGS: "myhub_settings",
  SAVED_QUOTES: "myhub_saved_quotes",
} as const;

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getTodos: (): Todo[] => getItem(KEYS.TODOS, []),
  setTodos: (todos: Todo[]) => setItem(KEYS.TODOS, todos),

  getBookmarks: (): Bookmark[] => getItem(KEYS.BOOKMARKS, []),
  setBookmarks: (bookmarks: Bookmark[]) => setItem(KEYS.BOOKMARKS, bookmarks),

  getBookmarkCategories: (): BookmarkCategory[] =>
    getItem(KEYS.BOOKMARK_CATEGORIES, [
      { id: "work", name: "工作", order: 0 },
      { id: "learning", name: "学习", order: 1 },
      { id: "tools", name: "工具", order: 2 },
      { id: "entertainment", name: "娱乐", order: 3 },
    ]),
  setBookmarkCategories: (categories: BookmarkCategory[]) =>
    setItem(KEYS.BOOKMARK_CATEGORIES, categories),

  getNotes: (): Note[] => getItem(KEYS.NOTES, []),
  setNotes: (notes: Note[]) => setItem(KEYS.NOTES, notes),

  getSettings: (): UserSettings =>
    getItem(KEYS.SETTINGS, { displayName: "用户", theme: "light" as const }),
  setSettings: (settings: UserSettings) => setItem(KEYS.SETTINGS, settings),

  getSavedQuotes: (): Quote[] => getItem(KEYS.SAVED_QUOTES, []),
  setSavedQuotes: (quotes: Quote[]) => setItem(KEYS.SAVED_QUOTES, quotes),

  exportAll: (): string => {
    const data = {
      todos: storage.getTodos(),
      bookmarks: storage.getBookmarks(),
      bookmarkCategories: storage.getBookmarkCategories(),
      notes: storage.getNotes(),
      settings: storage.getSettings(),
      savedQuotes: storage.getSavedQuotes(),
    };
    return JSON.stringify(data, null, 2);
  },

  importAll: (json: string): boolean => {
    try {
      const data = JSON.parse(json);
      if (data.todos) storage.setTodos(data.todos);
      if (data.bookmarks) storage.setBookmarks(data.bookmarks);
      if (data.bookmarkCategories) storage.setBookmarkCategories(data.bookmarkCategories);
      if (data.notes) storage.setNotes(data.notes);
      if (data.settings) storage.setSettings(data.settings);
      if (data.savedQuotes) storage.setSavedQuotes(data.savedQuotes);
      return true;
    } catch {
      return false;
    }
  },

  resetAll: () => {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  },
};
