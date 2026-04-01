"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ListChecks,
  Bookmark,
  FileText,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";

const NAV_ITEMS = [
  { href: "/", label: "仪表盘", icon: LayoutGrid },
  { href: "/todos", label: "待办事项", icon: ListChecks },
  { href: "/bookmarks", label: "收藏夹", icon: Bookmark },
  { href: "/notes", label: "笔记", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("用户");

  useEffect(() => {
    setDisplayName(storage.getSettings().displayName);
  }, []);

  return (
    <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-border bg-card px-8 py-8">
      <Link href="/" className="flex items-center gap-3 mb-8">
        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
        <span className="font-heading text-lg font-semibold text-foreground">
          MyHub
        </span>
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-heading transition-colors ${
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 text-sm font-heading transition-colors ${
            pathname === "/settings"
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="w-[18px] h-[18px]" />
          设置
        </Link>
        <div className="border-t border-border pt-4 mt-2">
          <div className="flex items-center gap-3 px-3">
            <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-heading font-medium text-foreground">
                {displayName}
              </span>
              <span className="text-xs text-muted-foreground">本地用户</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
