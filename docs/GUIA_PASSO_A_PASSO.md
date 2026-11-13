# 🚀 AutoBlog AI — Guia completo, passo a passo

Do zero absoluto ao seu primeiro artigo publicado com IA no **Blogger** e/ou **WordPress**, otimizado para **Google SEO** e pronto para o **AdSense**.

> Tempo estimado total: **2 a 4 horas** na primeira vez (a parte mais trabalhosa é o OAuth do Blogger — explicado em detalhes). Custo inicial: **R$ 0** (exceto domínio/hospedagem, se for WordPress próprio).

---

## 0. O que você vai construir

```
Você digita uma palavra-chave
        ↓
AutoBlog AI (Next.js) ──► Gemini / DeepSeek / OpenAI escrevem o artigo
        ↓
Auditoria SEO 0–100 (13 checks) + FAQ + schema.org + referências + imagem
        ↓
Salva no Supabase (banco)
        ↓
Você revisa → envia como RASCUNHO → Blogger e/ou WordPress
        ↓
Você publica no blog (1 clique) → Google indexa → AdSense aprovado
```

**Arquitetura:** GitHub (código) → Vercel (hospedagem + cron) → Supabase (banco) → Google Cloud (OAuth do Blogger + Blogger API) → Google AI Studio / DeepSeek (geração) → Search Console + AdSense (monetização).

---

## 1. Checklist do que criar (contas e chaves)

| # | Serviço | Para quê | Custo | Site |
|---|---------|----------|-------|------|
| 1 | **GitHub** | Guardar o código do app | Grátis | github.com |
| 2 | **Vercel** | Hospedar o app (deploy automático) | Grátis (Hobby) | vercel.com |
| 3 | **Supabase** | Banco de dados (artigos, tokens, config) | Grátis (Free) | supabase.com |
| 4 | **Google AI Studio** | Chave do Gemini (IA padrão) | Grátis (limites generosos) | aistudio.google.com |
| 5 | **DeepSeek** *(opcional)* | IA barata e excelente em PT | ~R$ 0,10–0,30 por artigo | platform.deepseek.com |
| 6 | **Google Cloud** | Projeto + Blogger API v3 + OAuth | Grátis | console.cloud.google.com |
| 7 | **Blogger** | Blog destino (precisa ter um blog criado) | Grátis | blogger.com |
| 8 | **WordPress** *(opcional)* | Blog destino (WP.org ou .com) | Hospedagem ~R$ 12–35/mês | seu-wp.com |
| 9 | **Registro.br / GoDaddy** *(opcional)* | Domínio próprio (recomendado p/ AdSense) | ~R$ 40/ano (.com.br) | registro.br |
| 10 | **Google Search Console** | Enviar sitemap, acompanhar indexação | Grátis | search.google.com/search-console |
| 11 | **Google AdSense** | Monetizar com anúncios | Grátis | adsense.google.com |
| 12 | **Pexels** *(opcional)* | Fotos reais grátis via API | Grátis | pexels.com/api |

> Você já tem conta na **Vercel** (time `scorpioos-sub`), um projeto **Supabase** (`mapa-astral-369` — que é de outro projeto seu, **não será alterado**) e o GitHub `brasil-01` (repo privado `Linotipo_blog`). O ideal é criar um projeto Supabase **novo** e dedicado para o AutoBlog (Passo 2) e um repositório **novo** no GitHub (Passo 3) — sem mexer no que já existe.

---

## 2. Passo 2 — Supabase (o banco de dados)

### 2.1 Criar um projeto novo (recomendado)
1. Entre em [supabase.com](https://supabase.com) → **New project**
2. Nome: `autoblog-ai` · Senha do banco: **gere uma forte e guarde** (ex.: em gerenciador de senhas) · Região: **South America (São Paulo)** · Plano: **Free**
3. Aguarde ~2 minutos até o status ficar **Active**

### 2.2 Criar as tabelas
1. Menu lateral → **SQL Editor** → **New query**
2. Abra o arquivo `supabase/schema.sql` deste projeto, **copie tudo** e cole no editor
3. Clique em **Run**. Deve retornar “Success” — foram criadas as tabelas `articles` e `settings` (com RLS ligado; só o app, com a service_role key, acessa).

### 2.3 Copiar as credenciais
Menu lateral → **Project Settings** (engrenagem) → **API**:
- **Project URL** → será o `SUPABASE_URL`
  (algo como `https://xxxxxxxx.supabase.co`)
- **service_role** (clique em *reveal* na seção “Project API keys”) → será o `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ A `service_role` é uma **chave mestra**: ignora o RLS. Ela **nunca** entra no navegador nem no GitHub — só nas Environment Variables da Vercel (ou `.env.local` na sua máquina). Se vazar, clique em *Reset* na mesma tela.

### 2.4 Avisos do plano Free
- Projetos free **pausam após ~7 dias sem acesso**. Basta abrir o dashboard do Supabase ou acessar o app para reativar (leva ~1 min). O cron diário também mantém o banco ativo.
- Backups: Free não inclui backup automático — exporte periodicamente (SQL Editor → `select * from articles` → copiar) se o conteúdo for valioso.

---

## 3. Passo 3 — GitHub (guardar o código)

> Nesta sessão de trabalho o GitHub **não está conectado**, então estes comandos são para você rodar.

### Opção A — linha de comando (recomendado)
```bash
cd autoblog-ai                      # a pasta do projeto
git init
git add .
git commit -m "AutoBlog AI v1.0"
# crie o repo VAZIO no github.com (New repository → nome: autoblog-ai → Private → sem README)
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/autoblog-ai.git
git push -u origin main
```

### Opção B — GitHub CLI
```bash
gh repo create autoblog-ai --private --source=. --push
```

**Verifique antes de commitar:** `git status` **não** pode listar `.env.local`, `node_modules/` nem `data/` — o `.gitignore` do projeto já cobre os três. Se `.env.local` aparecer, pare e ajuste.

---

## 4. Passo 4 — Vercel (colocar no ar)

### 4.1 Importar o repositório
1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → escolha `autoblog-ai`
   (se o repo não aparecer, clique em *Adjust GitHub App Permissions* e autorize o repo)
2. **Framework Preset**: `Next.js` (detectado sozinho) · **Root Directory**: `./` (a pasta do app é a raiz do repo)
3. **NÃO clique em Deploy ainda** — configure as variáveis primeiro:

### 4.2 Environment Variables (Settings → Environment Variables do projeto)
Adicione uma a uma (marque Production, Preview e Development):

| Variável | Valor | De onde veio |
|---|---|---|
| `APP_PASSWORD` | senha forte só sua | você inventa |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Passo 2.3 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi…` | Passo 2.3 |
| `GEMINI_API_KEY` | `AIza…` | Passo 5 |
| `DEEPSEEK_API_KEY` | `sk-…` | Passo 6 (opcional) |
| `OPENAI_API_KEY` | `sk-…` | Passo 7 (opcional) |
| `OPENAI_COMPATIBLE_BASE_URL` | `https://openrouter.ai/api/v1` | Passo 7 (opcional) |
| `OPENAI_COMPATIBLE_API_KEY` | `sk-or-…` | Passo 7 (opcional) |
| `PEXELS_API_KEY` | (fotos reais) | pexels.com/api (opcional) |
| `GOOGLE_CLIENT_ID` | `…apps.googleusercontent.com` | Passo 8 |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-…` | Passo 8 |
| `BLOGGER_BLOG_ID` | número do blog | Passo 8.5 |
| `WP_SITE_URL` | `https://meublog.com.br` | Passo 9 (ou deixe só no app) |
| `WP_USERNAME` | seu login | Passo 9 (ou deixe só no app) |
| `WP_APP_PASSWORD` | `xxxx xxxx …` | Passo 9 (ou deixe só no app) |
| `APP_URL` | `https://seu-app.vercel.app` | a URL que a Vercel gerar |
| `CRON_SECRET` | segredo aleatório | você inventa (Passo 13) |

### 4.3 Deploy
Clique em **Deploy**. Em ~1–2 minutos sai uma URL tipo `https://autoblog-ai.vercel.app`. Abra: deve pedir a senha (`APP_PASSWORD`).

> **Toda vez que mudar uma variável, faça Redeploy** (Deployments → ⋯ → Redeploy) — variáveis só valem no próximo build.
>
> Cuidado para **não mexer** nos projetos existentes `linotipoblog` / `linotipo_blog` — este é um projeto novo e independente.

### 4.4 Domínio próprio (opcional, recomendado para AdSense)
Vercel → seu projeto → **Settings → Domains** → adicionar `meublog.com.br` → aponte o DNS no Registro.br (registro.br → seu domínio → DNS → entradas `A` para `76.76.21.21` ou `CNAME` para `cname.vercel-dns.com`). Só o **blog** precisa de domínio próprio — o painel do AutoBlog pode ficar na URL `.vercel.app` mesmo.

---

## 5. Passo 5 — Google Gemini (a IA que eu recomendo começar)

1. Acesse [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (login com sua conta Google)
2. **Create API key** → escolha um projeto do Google Cloud (ou crie um — pode ser o mesmo do Passo 8)
3. Copie a chave `AIza…` → variável `GEMINI_API_KEY`
4. No app → **Configurações → Provedores de IA** → selecione **Google Gemini** como padrão → **Testar**

**Modelos:** `gemini-2.5-flash` (rápido e barato — padrão), `gemini-2.5-pro` (melhor qualidade para guias longos).
**Limites do free tier:** chegam a dezenas de artigos/dia em flash. Se estourar, espere 1 minuto (limite por minuto) ou troque para o DeepSeek.

---

## 6. Passo 6 — DeepSeek (alternativa barata)

1. [platform.deepseek.com](https://platform.deepseek.com) → crie conta → **API Keys** → **Create new API key**
2. **Billing**: adicione saldo (US$ 2–5 já rendem centenas de artigos; o `deepseek-chat` custa centavos por artigo)
3. Copie `sk-…` → variável `DEEPSEEK_API_KEY`
4. No app, selecione **DeepSeek** como provedor → **Testar**

**Quando usar:** artigos muito longos/técnicos e volume alto. O `deepseek-chat` escreve pt-BR excelente.

---

## 7. Passo 7 — OpenAI ou outras IAs (OpenRouter / Groq)

### OpenAI
1. [platform.openai.com/api-keys](https://platform.openai.com/api-keys) → **Create new secret key** → `sk-…`
2. Variável `OPENAI_API_KEY` · Modelos: `gpt-4o-mini` (custo-benefício), `gpt-4o`, `gpt-4.1-mini`

### OpenRouter (uma chave, centenas de modelos)
1. [openrouter.ai/keys](https://openrouter.ai/keys) → criar chave `sk-or-…`
2. Variáveis: `OPENAI_COMPATIBLE_BASE_URL=https://openrouter.ai/api/v1` + `OPENAI_COMPATIBLE_API_KEY=sk-or-…` + `OPENAI_COMPATIBLE_MODEL=openrouter/auto`

### Groq (free tier muito generoso, ótimo para testes)
1. [console.groq.com/keys](https://console.groq.com/keys) → chave `gsk_…`
2. Variáveis: `OPENAI_COMPATIBLE_BASE_URL=https://api.groq.com/openai/v1` + `OPENAI_COMPATIBLE_API_KEY=gsk_…` + `OPENAI_COMPATIBLE_MODEL=llama-3.3-70b-versatile`

---

## 8. Passo 8 — Google Cloud + Blogger (a parte mais trabalhosa)

> Objetivo: o app publicar como **rascunho** no seu blog do Blogger. Leva ~20 minutos.

### 8.1 Criar o projeto no Google Cloud
1. [console.cloud.google.com](https://console.cloud.google.com) → seletor de projeto (topo) → **New Project**
2. Nome: `autoblog-blogger` → **Create**

### 8.2 Ativar a Blogger API
1. Menu ☰ → **APIs & Services → Library**
2. Busque **“Blogger API v3”** → clique → **Enable**

### 8.3 Configurar a tela de consentimento OAuth
1. **APIs & Services → OAuth consent screen**
2. User Type: **External** → **Create**
3. App name: `AutoBlog AI` · User support email: seu e-mail · Developer contact: seu e-mail → **Save and Continue**
4. Scopes: **Add or Remove Scopes** → busque `blogger` → marque `…/auth/blogger` (View and manage your Blogger account) → **Update** → **Save and Continue**
5. **Test users** → **Add users** → adicione o **mesmo Gmail dono do blog** → **Save and Continue** → **Back to Dashboard**

> Enquanto o app estiver em modo **Testing** (padrão), só você e os test users conseguem conectar — perfeito para uso pessoal. Não é preciso passar pela verificação do Google para uso pessoal/interno. Publicar o app como “Production” também funciona, mas o Google pode exibir tela de “app não verificado”; clicar em *Advanced → Go to AutoBlog AI (unsafe)* conecta normalmente (é o seu próprio app).

### 8.4 Criar as credenciais OAuth
1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Application type: **Web application** · Name: `autoblog-web`
3. **Authorized redirect URIs** → **Add URI**, um por um:
   - `https://SEU-APP.vercel.app/api/auth/google/callback`
   - `http://localhost:3000/api/auth/google/callback` (para testar local)
   - (se tiver domínio próprio apontando para o painel, adicione `https://painel.seusite.com.br/api/auth/google/callback`)
4. **Create** → copie o **Client ID** (`…apps.googleusercontent.com`) e o **Client Secret** (`GOCSPX-…`)
5. Variáveis na Vercel: `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (+ `APP_URL` com a URL final do app) → **Redeploy**

### 8.5 Descobrir o BLOG ID
1. [blogger.com](https://www.blogger.com) → abra seu blog
2. **Configurações → Básico** → procure **“ID do blog”** (número de ~19 dígitos), **ou** olhe a URL do editor:
   `blogger.com/blog/post/edit/1234567890123456789/9876543210987` → o **primeiro** número é o blog ID
3. Variável `BLOGGER_BLOG_ID` na Vercel **e/ou** cole em Configurações no app → **Salvar ID**

### 8.6 Conectar e testar
1. App → **Configurações → Blogger → Conectar Blogger**
2. O Google mostra as permissões → **Continuar/Permitir** (com a conta dona do blog)
3. De volta ao app: **“Blogger conectado ✓”** → **Testar conexão** (deve mostrar o nome do blog)

### 8.7 Erros comuns

| Erro | Causa | Solução |
|---|---|---|
| `redirect_uri_mismatch` | A URI não bate **exatamente** (maiúsculas, barra final) | Copie a URI exata do erro no Google e adicione em Credentials → Authorized redirect URIs |
| `access_denied` | Conta não está em Test users | OAuth consent screen → Test users → adicione o Gmail → reconecte |
| `invalid_grant` | Refresh token expirado (revogou ou mudou senha) | Desconecte no app → revogue em [myaccount.google.com/permissions](https://myaccount.google.com/permissions) → conecte de novo |
| Refresh token não veio | O Google só envia na 1ª autorização com `prompt=consent` | Desconecte → revogue a permissão → conecte novamente (o app já força `prompt=consent`) |
| 403 Forbidden | A conta não é dona/administradora do blog | Use a conta dona ou admin do blog |
| Blogger abre rascunho mas você não acha | O rascunho fica em **Posts → Rascunhos** (ícone de lápis) | Posts → Rascunhos → revisar → Publicar |

**Como funciona a publicação:** o app chama `POST …/blogs/{BLOG_ID}/posts/?isDraft=true` — o post sobe com título, imagem, conteúdo, tags e **nada vai ao ar**. Você abre em Posts → Rascunhos, revisa e clica em **Publicar**.

---

## 9. Passo 9 — WordPress (se usar WP)

> Funciona com WordPress **auto-hospedado** (WP.org — Hostinger, KingHost, HostGator…) ou planos Business/eCommerce do WordPress.com. No plano **gratuito do WordPress.com**, Application Passwords não funcionam — use o Blogger ou migre para auto-hospedado.

### 9.1 Criar a Application Password
1. wp-admin → **Usuários → Perfil** → role até **“Senhas de aplicativo”**
2. Nome: `AutoBlog AI` → **Adicionar senha de aplicativo**
3. Copie a senha de 24 caracteres (com espaços) — ela só aparece uma vez

### 9.2 Configurar no app
App → **Configurações → WordPress** → preencha:
- **URL do site**: `https://meublog.com.br` (sem barra no final)
- **Usuário**: seu login do wp-admin
- **Application Password**: cole (os espaços podem ficar)

→ **Salvar** → **Testar conexão** (deve responder: “Conectado como …”)

### 9.3 Requisitos do site
- **HTTPS** ativo (cadeado) — sem ele o navegador e o Google penalizam
- **Links permanentes**: Settings → Permalinks → “Nome do post” (não “Simples”)
- **REST API ativa** (padrão) — teste abrindo `https://meublog.com.br/wp-json/wp/v2/posts` no navegador: deve devolver um array JSON
- Sem plugin de segurança bloqueando a REST API para o seu usuário (alguns firewalls de hospedagem bloqueiam `Authorization` — se der 401/403, peça à hospedagem para permitir o header `Authorization` em requests para `/wp-json/`)
- Usuário com perfil **Administrador** ou **Editor**

### 9.4 O que o app envia
Título, conteúdo HTML (com FAQ e referências), slug, **excerpt = meta description**, e as **tags** (criadas automaticamente se não existirem). Status: **`draft`** — você revisa em **wp-admin → Posts → Rascunhos** e publica. Tags com acento são aceitas.

---

## 10. Passo 10 — Seu primeiro artigo (ponta a ponta)

1. **Gerar** → Tópico: `como montar uma rotina de estudos em casa` · Keyword: `rotina de estudos` · Nicho: `educação` · Tom: tutorial · Tamanho: 1.200 palavras → **Gerar artigo agora**
2. Em ~30–60s: **Score SEO** (mire ≥ 70), título, slug, meta description, conteúdo, FAQ, referências, imagem
3. Clique em **Abrir artigo & publicar** → ajuste o que quiser (o score recalcula ao salvar)
4. Confira as **Referências** — clique em cada link: se algum não existir, troque por outro (a IA às vezes inventa). Este é o principal ponto de revisão humana
5. **Enviar para o Blogger/WordPress** → abra o rascunho → revise → **Publicar**
6. No Google: seu post ficará em Posts → Rascunhos até você decidir

**Fluxo editorial saudável:** 2–4 artigos por semana, cada um melhor que os 10 primeiros do Google para aquela keyword. 15 artigos bons > 100 artigos fracos.

---

## 11. Passo 11 — SEO técnico de verdade (Search Console)

### 11.1 Google Search Console
1. [search.google.com/search-console](https://search.google.com/search-console) → **Adicionar propriedade**
2. Tipo **Domínio** (recomendado): verificação via DNS — no Registro.br/seu provedor, crie um TXT com o valor mostrado pelo Google
   (Alternativa: propriedade de **URL com prefixo** → verificação por tag HTML → cole no tema)
3. **Sitemaps** → envie:
   - Blogger: `sitemap.xml` (a ex.: `https://meublog.blogspot.com/sitemap.xml` ou `https://meublog.com.br/sitemap.xml`)
   - WordPress: `wp-sitemap.xml`
4. Aguarde a indexação (dias a semanas). Use **Inspeção de URL → Solicitar indexação** nos artigos mais importantes

### 11.2 Bing Webmaster Tools (2 minutos, vale a pena)
Mesmo procedimento em [bing.com/webmasters](https://www.bing.com/webmasters) — você importa do Search Console com 1 clique e ganha tráfego do Bing/DuckDuckGo/Yahoo.

### 11.3 Páginas que todo blog AdSense precisa
Crie no blog (páginas estáticas, linkadas no rodapé de todas as páginas):
- **Sobre nós** — quem escreve, autoridade no nicho, foto/avatar, e-mail
- **Contato** — formulário ou e-mail público
- **Política de Privacidade** — declara cookies, Google AdSense e LGPD (se quiser, eu gero um modelo para o seu blog)
- **Termos de Uso** e **Disclaimer** (obrigatório se finanças/saúde/juridico: “conteúdo informativo, não substitui profissional”)

### 11.4 O que o AutoBlog já entrega por artigo
Title e meta description no tamanho certo · slug limpo · um H1 (título) + H2/H3 · keyword posicionada (primeiros 120 palavras, H2s, densidade 0,5–2,5%) · **FAQPage JSON-LD** (rich snippet “As pessoas também perguntam”) · **Article JSON-LD** (autor, data, publisher) · imagem com `alt` = keyword · referências externas (E-E-A-T) · links com `rel="nofollow noopener"` para fontes.

**Cole o JSON-LD no <head>:** Blogger → Tema → Editar HTML → antes de `</head>` (ou via widget “HTML/JavaScript” no gadget de Rodapé). WordPress → plugin **WPCode** (ex-Insert Headers and Footers) → Header → colar o bloco exportado pelo app.

---

## 12. Passo 12 — Google AdSense: como ser aprovado

> Verdade inconveniente: a IA sozinha não garante aprovação. O AdSense reprova blogs com **conteúdo raso em escala**. O que aprova é blog + política + navegação + Google E-E-A-T. Use o AutoBlog como **acelerador com revisão humana** — é exatamente para isso que ele nasce como rascunho.

### 12.1 Requisitos práticos antes de solicitar
- ✅ 15–25 artigos **originais e úteis**, 900+ palavras, no ar
- ✅ Sobre, Contato, Política de Privacidade, Termos (+ Disclaimer se necessário)
- ✅ Menu/categorias navegáveis, sem páginas quebradas
- ✅ HTTPS, sitemap enviado, Search Console limpo
- ✅ Domínio próprio (opcional, mas ajuda muito contra “conteúdos de baixa qualidade”)
- ✅ Tráfego orgânico real, mesmo que modesto (100–500 visitas/mês já ajudam)
- ✅ Nada de conteúdo proibido (ver checklist no app — 37 itens)

### 12.2 Como solicitar
1. [adsense.google.com](https://www.adsense.google.com) → crie a conta com o **mesmo e-mail** dono do blog
2. **Adicione seu site** → o AdSense mostra um **código** `<script>…adsbygoogle.js…</script>`
3. Cole no **<head>** de todas as páginas:
   - Blogger: **Tema → Editar HTML** → cole antes de `</head>` → Salvar
   - WordPress: plugin **WPCode** → Header → colar → Salvar
4. Clique em **Solicite análise** na tela do AdSense
5. Análise: de **3 dias a 4 semanas** (média ~2). Resultado por e-mail + painel

### 12.3 Se for reprovado (acontece com a maioria na 1ª tentativa)
Motivos mais comuns e correções:

| Motivo | Correção |
|---|---|
| “Conteúdo de baixo valor / insuficiente” | Publique mais 10–15 artigos **editados por você**, com opinião/experiência própria; adicione exemplos e prints; aprofunde os tops artigos |
| “Problemas de navegação” | Menu, categorias, página 404 útil, busca funcionando, nenhum link quebrado (use [deadlinkchecker](https://www.deadlinkchecker.com)) |
| “Políticas do site ausentes” | Crie Sobre/Contato/Privacidade/Termos e linke no rodapé de tudo |
| “Conteúdo inaceitável” | Remova o que infringe políticas (fraude, adulto, remédios milagrosos…) |

Corrija → clique em **Solicitar análise novamente** (pode pedir de novo após correções, quantas vezes precisar).

### 12.4 Depois de aprovado
- Comece com **Auto ads** (AdSense posiciona sozinho) — depois refine
- Máx. ~3 blocos por artigo longo; nunca enganar cliques (anúncio ≠ botão)
- **Nunca** clique nos próprios anúncios (nem “testar”) — pode banir a conta
- Acompanhe **RPM, CTR e páginas vistas** → escreva mais do tema que rende
- Blogger: ative **ads.txt** (Configurações → Monetização → “Ativar ads.txt personalizado” → cole `google.com, pub-SEU_ID, DIRECT, f08c47fec0942fa0`)
- WordPress: crie `/ads.txt` na raiz com a mesma linha (plugin ou gerenciador de arquivos da hospedagem)

---

## 13. Passo 13 — Automação: 1 artigo por dia sem esforço

O projeto já inclui `vercel.json` + rota `/api/cron/generate`. Com o plano **Hobby** da Vercel (grátis), crons rodam **1 vez por dia** — suficiente:

1. Vercel → env `CRON_SECRET` = segredo aleatório (ex.: `openssl rand -hex 32`)
2. No app → **Configurações → Geração automática** → cole seus tópicos, **um por linha** (ex.: 30 ideias de conteúdo do nicho)
3. Todo dia às **09:00 (UTC)** a Vercel chama a rota → o app pega o próximo tópico da fila → gera com o provedor padrão → salva como **rascunho** e avança o cursor
4. Segunda-feira de manhã: você abre o painel, revisa a semana inteira, ajusta referências e publica

> Times Pro da Vercel permitem crons mais frequentes (ex.: 3x/dia). No Hobby, 1x/dia é o limite — e é o ritmo editorial saudável de qualquer forma.

---

## 14. Passo 14 — Segurança (leia, é curto)

1. **`APP_PASSWORD` forte** — sem ela, qualquer um com o link gasta suas APIs e publica no seu blog
2. **Chaves nunca no navegador**: todas as keys (`GEMINI_*`, `DEEPSEEK_*`, `SUPABASE_SERVICE_ROLE_KEY`, senha do WordPress) são lidas só no servidor; nada usa o prefixo `NEXT_PUBLIC_`
3. **RLS ligado** no Supabase; o app acessa via service_role no servidor — ninguém externo lê seus artigos
4. **`.gitignore`** já exclui `.env.local`, `data/`, `node_modules/`, `.next/` — confirme com `git status`
5. Se uma chave vazar (apareceu em log/print/repo público): **rotacione imediatamente** (Google AI Studio → delete key → crie outra; idem Supabase “Reset service_role”; Vercel → env → Redeploy)
6. Google OAuth: mantenha o app em **Testing** com só você como test user, ou publique com cuidado — nunca cole o Client Secret em páginas públicas
7. WordPress: use **Application Password** (nunca a senha mestra), e revogue em wp-admin a qualquer sinal de uso indevido

---

## 15. Passo 15 — Troubleshooting (erros e soluções)

| Sintoma | Provável causa | Solução |
|---|---|---|
| Painel pede senha e “Senha incorreta” | APP_PASSWORD diferente da definida na Vercel | Vercel → Settings → Env → veja o valor → Redeploy |
| “GEMINI_API_KEY não configurada” | Variável ausente ou nome errado | Nome exato `GEMINI_API_KEY`; Redeploy após criar |
| Gemini retorna 429 | Cota free estourada | Aguarde 1 min ou troque para DeepSeek/Groq |
| “JSON válido não retornou” | Resposta do modelo truncada/conversa | Gerar de novo; ou trocar de modelo (flash ↔ pro); ou reduzir tamanho do artigo |
| Artigo sai em inglês | Prompt não respeitado | Já instruímos pt-BR — regenere; se persistir, troque o modelo |
| Referências inventadas | Alucinação do modelo | Confira e edite antes de publicar (é o ponto de revisão nº 1) |
| Vercel erro 504/timeout | Artigo muito grande para 60s (limite Hobby) | Reduza para 900–1.200 palavras ou mude o modelo |
| Supabase “relation does not exist” | Schema não rodado | Passo 2.2 → rode o `schema.sql` de novo (é idempotente) |
| Dados somem após deploy na Vercel | Sem Supabase configurado (caiu no /tmp) | Passo 2 — configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` |
| Blogger 401 | Token expirado/revogado | Configurações → Desconectar → revogue em myaccount.google.com/permissions → Conectar de novo |
| WordPress 401 | Application Password errada | Recrie a senha no wp-admin e atualize no app |
| WordPress 404 | URL errada ou REST desligada | `https://site/wp-json/` deve abrir; ative permalinks “Nome do post” |
| “App não verificado” no OAuth | Normal em Testing | Advanced → Go to AutoBlog AI (unsafe) → continua |
| Cron não roda | Hobby agenda 1x/dia e precisa de deploy na branch production | Confira Deployments → latest production com `vercel.json` aplicado; teste manual: `curl -H "Authorization: Bearer $CRON_SECRET" https://SEU-APP.vercel.app/api/cron/generate` |

---

## 16. Custos reais (resumo honesto)

| Item | Custo/mês |
|---|---|
| Vercel Hobby | R$ 0 |
| Supabase Free | R$ 0 |
| Gemini free tier | R$ 0 |
| DeepSeek (se usar) | R$ 1–5 (60–150 artigos) |
| Pollinations (imagens IA) | R$ 0 |
| Pexels (fotos reais) | R$ 0 |
| Blogger | R$ 0 |
| WordPress (hospedagem BR) | R$ 12–35 |
| Domínio .com.br | ~R$ 40/ano |
| **Total mínimo para começar** | **R$ 0** (Blogger + domínio de subdomínio blogspot) |
| **Setup WordPress completo** | ~R$ 15–40/mês |

---

## 17. Próximos passos / roadmap do projeto

- [ ] Publicar 15–25 artigos revisados → submeter ao AdSense
- [ ] Search Console + Bing verificados, sitemaps enviados
- [ ] Clusters de conteúdo: escolha 1 tema-pilar e 8–10 artigos satélite linkando entre si
- [ ] Página “Sobre” com bio + credenciais do nicho (E-E-A-T)
- [ ] Calendário: 2 artigos/semana > 10 artigos/mês no vácuo
- [ ] Após AdSense: Auto Ads → refinar posições; monitorar RPM por cluster
- [ ] Futuras versões do app (posso implementar se pedir): gerar lote de 10 rascunhos de uma vez · importar keyword de planilha CSV · fila de publicação agendada no WordPress · dashboard de ranking via Search Console API · geração de capa própria com Imagen (Gemini)

---

## 18. FAQ rápido

**“Preciso pagar o AdSense?”** Não — ele paga você. O Google fica com ~32% (clique US) e repassa o resto via PIX/TED a partir de US$ 100 acumulados.

**“Posso usar blogspot.com mesmo com AdSense?”** Sim — o Blogger é aceito. Domínio próprio **melhora** a aprovação e a percepção de marca, mas não é obrigatório.

**“O Google penaliza conteúdo de IA?”** Ele penaliza **conteúdo ruim para o usuário**, seja humano ou de IA. Artigo útil + revisão humana + experiência real + referências = seguro. Artigo raso em escala = reprovação (inclusive no AdSense).

**“Posso vender/afiliado também?”** Sim — adicione “Disclaimer de afiliado” e mantenha a proporção: primeiro o valor, depois o link.

**“E se eu quiser recomeçar o blog/nicho?”** O app é multi-nicho — mude os tópicos no cron e o campo “Nicho” na geração.

---

### Pronto! 🎉

Se travar em qualquer passo, abra a aba **Configurações → Testar conexão** de cada serviço: ela diz exatamente o que está faltando. Boa sorte com o blog — e lembre-se: **o robô escreve, o humano garante a qualidade**. É isso que aprova no AdSense e ranqueia no Google.
