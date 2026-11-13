# ⚡ AutoBlog AI

**Gerador automático de artigos SEO para Blogger e WordPress** — com Google Gemini, DeepSeek, OpenAI ou qualquer API compatível com OpenAI. O artigo nasce completo (título, meta description, slug, conteúdo HTML hierarquizado, FAQ com schema, referências confiáveis, imagem destacada) e é auditado por **13 verificações de SEO** com nota de 0 a 100. Tudo fica como **rascunho** até você revisar — o caminho certo para ranquear e aprovar no AdSense.

## O que ele faz

| Recurso | Detalhe |
|---|---|
| 🤖 Multi-IA | Google Gemini · DeepSeek · OpenAI · OpenRouter/Groq (compatível OpenAI) |
| ✍️ Artigo completo | Título, slug, meta, HTML (H2/H3), tags, keywords secundárias |
| 🔎 Auditoria SEO | 13 checks, score 0–100, relatório detalhado, recalcula ao salvar |
| ❓ FAQ + schema.org | FAQPage JSON-LD + Article JSON-LD (Article/@graph) |
| 🖼️ Imagem destacada | Pexels (fotos reais, com crédito) ou Pollinations.ai (IA grátis, sem chave) |
| 📚 Referências | 2–5 fontes reais (gov, Wikipedia…) listadas no artigo |
| 🟠 Blogger | OAuth Google → publica como **rascunho** (você revisa e publica) |
| 🔵 WordPress | REST API + Application Password → **rascunho**, com tags automáticas |
| ⏰ Cron diário | Vercel Cron gera 1 rascunho/dia a partir dos seus tópicos |
| 🗄️ Supabase | Histórico, settings e tokens persistidos (fallback: arquivo local em dev) |
| 🔒 Painel protegido | APP_PASSWORD + cookie httpOnly (middleware em todas as rotas) |
| 📋 Checklist | AdSense + SEO interativo com progresso salvo |

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha as chaves
npm run dev                  # http://localhost:3000
```

Sem chaves de IA o painel funciona, mas a geração exige pelo menos `GEMINI_API_KEY` (gratuita) ou `DEEPSEEK_API_KEY`. Sem `SUPABASE_URL`, os dados ficam em `data/db.json` (apenas desenvolvimento).

## Estrutura

```
app/                # páginas (Dashboard, Gerar, Artigos, Configurações, Checklist, Login)
app/api/            # rotas: generate, articles CRUD, publish (blogger|wordpress),
                    #        settings, test, auth (login/logout/google), cron/generate
lib/                # db (Supabase+local), ai (providers), seo (score), assemble (HTML),
                    # images, blogger, wordpress, generate (pipeline)
components/         # Sidebar
supabase/schema.sql # tabelas articles e settings (+ RLS)
docs/GUIA_PASSO_A_PASSO.md  # tutorial completo: GitHub → Supabase → Vercel → Blogger → WP → AdSense
```

## Deploy (resumo)

1. `git init && git add . && git commit -m "AutoBlog AI"` → push para um repo no GitHub
2. vercel.com/new → importar o repo → adicionar as variáveis de ambiente (ver `.env.example`) → Deploy
3. Supabase → SQL Editor → colar `supabase/schema.sql` → copiar URL e service_role key para a Vercel
4. Configurações no app: conectar Blogger (OAuth) e WordPress (Application Password)
5. Leia **`docs/GUIA_PASSO_A_PASSO.md`** — ele cobre do zero absoluto ao AdSense aprovado.

## Segurança

- `SUPABASE_SERVICE_ROLE_KEY`, chaves de IA e senha do WordPress são usados **somente no servidor** e nunca vão para o navegador.
- O painel exige `APP_PASSWORD` (cookie httpOnly, SHA-256). Sem ela, o app fica aberto — configure.
- A publicação **sempre** cria rascunho. Nada é publicado sem revisão humana.
