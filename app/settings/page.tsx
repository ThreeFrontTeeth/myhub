"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Pin, Trash2, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import * as db from "@/lib/db";
import type { UserSettings } from "@/lib/types";

type ThemeChoice = UserSettings["theme"];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [currentSettings, setCurrentSettings] = useState<UserSettings>({
    displayName: "用户",
    theme: "light",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.fetchSettings()
      .then((settings) => {
        setCurrentSettings(settings);
        setDisplayName(settings.displayName);
        setTheme(settings.theme);
        setMounted(true);
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
        setMounted(true);
      });
  }, [setTheme]);

  const persistDisplayName = useCallback(
    (nextName: string) => {
      const trimmed = nextName.trim();
      if (!trimmed || trimmed === currentSettings.displayName) return;
      const updated = { ...currentSettings, displayName: trimmed };
      setCurrentSettings(updated);
      setDisplayName(trimmed);
      db.upsertSettings(updated).catch(console.error);
    },
    [currentSettings],
  );

  const handleDisplayNameBlur = () => {
    persistDisplayName(displayName);
  };

  const handleDisplayNameKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleThemeSelect = (choice: ThemeChoice) => {
    setTheme(choice);
    const updated = { ...currentSettings, theme: choice };
    setCurrentSettings(updated);
    db.upsertSettings(updated).catch(console.error);
  };

  const handleExport = async () => {
    try {
      const json = await db.exportAll();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `myhub-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      window.alert("导出失败。");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const ok = await db.importAll(text);
      if (!ok) {
        window.alert("导入失败：无效的 JSON 文件。");
        return;
      }
      const settings = await db.fetchSettings();
      setCurrentSettings(settings);
      setDisplayName(settings.displayName);
      setTheme(settings.theme);
      window.alert("导入成功。");
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      "确定要重置所有数据吗？此操作不可撤销。你的待办、收藏、笔记和设置将全部被删除。",
    );
    if (!confirmed) return;
    await db.resetAll();
    const settings = await db.fetchSettings();
    setCurrentSettings(settings);
    setDisplayName(settings.displayName);
    setTheme(settings.theme);
  };

  const activeTheme: ThemeChoice =
    mounted && theme === "light"
      ? "light"
      : mounted && theme === "dark"
        ? "dark"
        : mounted && theme === "system"
          ? "system"
          : "light";

  const toggleClass = (isActive: boolean) =>
    isActive
      ? "px-5 py-2 bg-foreground text-background font-heading text-[13px] font-medium"
      : "px-5 py-2 border border-border font-heading text-[13px] font-medium text-foreground";

  return (
    <div className="px-12 py-10 flex flex-col gap-12">
      <div className="mx-auto w-full max-w-[640px] flex flex-col gap-12">
        <h1 className="text-4xl font-heading font-medium tracking-tight text-foreground">
          设置
        </h1>

        <section className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h2 className="text-lg font-heading font-semibold text-foreground">
              个人资料
            </h2>
          </div>
          <div className="border-t border-border" />
          <div className="flex items-center justify-between gap-6">
            <span className="text-sm font-sans text-foreground">显示名称</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={handleDisplayNameBlur}
              onKeyDown={handleDisplayNameKeyDown}
              className="w-[320px] px-4 py-2.5 border border-border bg-transparent text-sm font-sans text-foreground focus:outline-none focus:border-foreground"
              autoComplete="name"
            />
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="text-lg font-heading font-semibold text-foreground">
            外观
          </h2>
          <div className="border-t border-border" />
          <div className="flex items-center justify-between gap-6">
            <span className="text-sm font-sans text-foreground">主题</span>
            <div
              className="flex flex-wrap items-center gap-0"
              role="group"
              aria-label="主题"
            >
              <button
                type="button"
                onClick={() => handleThemeSelect("light")}
                className={toggleClass(mounted && activeTheme === "light")}
              >
                浅色
              </button>
              <button
                type="button"
                onClick={() => handleThemeSelect("dark")}
                className={toggleClass(mounted && activeTheme === "dark")}
              >
                深色
              </button>
              <button
                type="button"
                onClick={() => handleThemeSelect("system")}
                className={toggleClass(mounted && activeTheme === "system")}
              >
                跟随系统
              </button>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="text-lg font-heading font-semibold text-foreground">
            数据管理
          </h2>
          <div className="border-t border-border" />
          <div className="flex items-center justify-between gap-6">
            <div className="flex max-w-md flex-col gap-1">
              <span className="text-sm font-sans font-medium text-foreground">
                导出数据
              </span>
              <span className="text-sm font-sans text-muted-foreground">
                将待办、收藏、笔记和设置导出为 JSON 备份文件。
              </span>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex shrink-0 items-center gap-2 border border-border px-4 py-2.5 font-heading text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground"
            >
              <Download className="h-4 w-4" aria-hidden />
              导出
            </button>
          </div>
          <div className="flex items-center justify-between gap-6">
            <div className="flex max-w-md flex-col gap-1">
              <span className="text-sm font-sans font-medium text-foreground">
                导入数据
              </span>
              <span className="text-sm font-sans text-muted-foreground">
                从之前导出的 JSON 文件恢复数据，匹配的数据将被覆盖。
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportFile}
            />
            <button
              type="button"
              onClick={handleImportClick}
              className="inline-flex shrink-0 items-center gap-2 border border-border px-4 py-2.5 font-heading text-[13px] font-medium text-foreground focus:outline-none focus:border-foreground"
            >
              <Upload className="h-4 w-4" aria-hidden />
              导入
            </button>
          </div>
          <div className="border-t border-border" />
          <div className="flex items-center justify-between gap-6">
            <div className="flex max-w-md flex-col gap-1">
              <span className="text-sm font-sans font-medium text-primary">
                重置所有数据
              </span>
              <span className="text-sm font-sans text-muted-foreground">
                永久删除所有数据库中的数据。
              </span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex shrink-0 items-center gap-2 bg-primary px-4 py-2.5 font-heading text-[13px] font-medium text-primary-foreground focus:outline-none focus:opacity-90"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              重置
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
