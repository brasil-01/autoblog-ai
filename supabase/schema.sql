-- ============================================
-- AutoBlog AI — Schema do banco (Supabase)
-- Cole no SQL Editor do Supabase e clique em "Run".
-- Idempotente: pode rodar mais de uma vez.
-- ============================================

create extension if not exists pgcrypto;

create table if not exists public.articles (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  slug              text,
  keyword           text,
  meta_description  text,
  excerpt           text,
  content_html      text,
  tags              text[] default '{}',
  secondary_keywords text[] default '{}',
  faq               jsonb default '[]'::jsonb,
  references_json   jsonb default '[]'::jsonb,
  json_ld           jsonb,
  image_url         text,
  image_credit      text,
  provider          text,
  model             text,
  status            text default 'draft',   -- draft | published_blogger | published_wordpress
  seo_score         integer,
  seo_report        jsonb,
  blogger_post_id   text,
  wordpress_post_id bigint,
  published_urls    jsonb default '{}'::jsonb,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists articles_created_at_idx on public.articles (created_at desc);
create index if not exists articles_status_idx     on public.articles (status);

-- Configurações e tokens (blogger_blog_id, wp_*, google_oauth, site_name, cron_*)
create table if not exists public.settings (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz default now()
);

-- Segurança: RLS ligado sem políticas públicas.
-- O app usa a SERVICE ROLE key (somente no servidor), que ignora o RLS.
alter table public.articles enable row level security;
alter table public.settings enable row level security;

-- Atualiza updated_at automaticamente
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists articles_touch on public.articles;
create trigger articles_touch before update on public.articles
  for each row execute function public.touch_updated_at();
