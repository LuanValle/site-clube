create extension if not exists pgcrypto;

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  content text not null,
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  tags text[] not null default '{}',
  published_at timestamptz,
  created_by uuid references admin_users(id) on delete set null,
  updated_by uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists library_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  category text,
  author text,
  year integer,
  cover_image_url text,
  drive_url text,
  external_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  tags text[] not null default '{}',
  created_by uuid references admin_users(id) on delete set null,
  updated_by uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_posts_status_published_at_idx
  on news_posts (status, published_at desc);

create index if not exists library_items_status_created_at_idx
  on library_items (status, created_at desc);

create index if not exists library_items_category_idx
  on library_items (category);

-- Crie o admin inicial no Neon com uma senha fora do repositorio.
-- Exemplo no SQL Editor do Neon:
-- insert into admin_users (username, password_hash)
-- values ('admin', crypt('SENHA_FORTE_AQUI', gen_salt('bf')));
