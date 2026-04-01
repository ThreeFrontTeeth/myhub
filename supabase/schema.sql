-- ============================================================
-- MyHub Supabase Schema
-- 在 Supabase Dashboard → SQL Editor 中执行此脚本
-- ============================================================

-- ─── Todos ──────────────────────────────────────────────────
create table if not exists todos (
  id         uuid primary key,
  title      text    not null default '',
  completed  boolean not null default false,
  priority   text    not null default 'medium',
  created_at timestamptz not null default now(),
  due_date   text,
  sort_order integer not null default 0
);

alter table todos enable row level security;
create policy "Allow anonymous access on todos"
  on todos for all using (true) with check (true);

-- ─── Bookmarks ──────────────────────────────────────────────
create table if not exists bookmarks (
  id          uuid primary key,
  title       text    not null default '',
  url         text    not null default '',
  description text,
  category    text    not null default '',
  favicon     text,
  created_at  timestamptz not null default now(),
  sort_order  integer not null default 0
);

alter table bookmarks enable row level security;
create policy "Allow anonymous access on bookmarks"
  on bookmarks for all using (true) with check (true);

-- ─── Bookmark Categories ────────────────────────────────────
create table if not exists bookmark_categories (
  id         text primary key,
  name       text    not null default '',
  icon       text,
  sort_order integer not null default 0
);

alter table bookmark_categories enable row level security;
create policy "Allow anonymous access on bookmark_categories"
  on bookmark_categories for all using (true) with check (true);

insert into bookmark_categories (id, name, sort_order) values
  ('work',          '工作', 0),
  ('learning',      '学习', 1),
  ('tools',         '工具', 2),
  ('entertainment', '娱乐', 3)
on conflict (id) do nothing;

-- ─── Notes ──────────────────────────────────────────────────
create table if not exists notes (
  id         uuid primary key,
  title      text    not null default '',
  content    text    not null default '',
  tags       text[]  not null default '{}',
  pinned     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table notes enable row level security;
create policy "Allow anonymous access on notes"
  on notes for all using (true) with check (true);

-- ─── Saved Quotes ───────────────────────────────────────────
create table if not exists saved_quotes (
  id     serial primary key,
  text   text not null,
  author text not null
);

alter table saved_quotes enable row level security;
create policy "Allow anonymous access on saved_quotes"
  on saved_quotes for all using (true) with check (true);

-- ─── User Settings ──────────────────────────────────────────
create table if not exists user_settings (
  id           text primary key default 'default',
  display_name text not null default '用户',
  theme        text not null default 'light'
);

alter table user_settings enable row level security;
create policy "Allow anonymous access on user_settings"
  on user_settings for all using (true) with check (true);

insert into user_settings (id, display_name, theme)
values ('default', '用户', 'light')
on conflict (id) do nothing;
