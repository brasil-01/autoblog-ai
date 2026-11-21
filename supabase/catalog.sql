-- ============================================
-- AutoBlog AI — Catálogo: nichos, categorias,
-- palavras-chave e idioma dos artigos.
-- Cole no SQL Editor do Supabase (mesmo projeto)
-- e clique em "Run". Idempotente.
-- Se a instalação for nova, rode também supabase/schema.sql antes.
-- ============================================

-- Idioma do artigo (pt-BR padrão) — habilita blogs em outros idiomas
alter table public.articles add column if not exists language text default 'pt-BR';

-- Categorias de blog por nicho/idioma
create table if not exists public.blog_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text,
  niche       text not null default 'financas',   -- ex.: financas, tecnologia, saude, receitas
  language    text not null default 'pt-BR',      -- ex.: pt-BR, pt-PT, en, es
  description text,
  created_at  timestamptz default now()
);

-- Palavras-chave pré-cadastradas (cluster por categoria/nicho/idioma)
create table if not exists public.keywords (
  id          uuid primary key default gen_random_uuid(),
  keyword     text not null,
  niche       text not null default 'financas',
  language    text not null default 'pt-BR',
  intent      text not null default 'informacional',  -- informacional | comercial | transacional
  difficulty  text not null default 'medio',          -- baixo | medio | alto
  category_id uuid references public.blog_categories(id) on delete set null,
  notes       text,
  created_at  timestamptz default now(),
  unique (keyword, language)
);

create index if not exists keywords_niche_lang_idx   on public.keywords (niche, language);
create index if not exists categories_niche_lang_idx on public.blog_categories (niche, language);
create unique index if not exists blog_categories_name_lang_uq on public.blog_categories (name, language);

alter table public.blog_categories enable row level security;
alter table public.keywords        enable row level security;

-- Observação: o app usa a SERVICE ROLE key (servidor), que ignora o RLS.
-- Nada fica público — os dados só são lidos pelo painel autenticado.
