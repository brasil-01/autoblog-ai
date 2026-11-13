'use client';
import { useEffect, useState } from 'react';

const SECTIONS = [
  {
    id: 'conteudo', title: '📝 Conteúdo & Qualidade (o mais importante)', items: [
      ['c1', 'Publicar no mínimo 15–25 artigos originais e substanciais antes de solicitar o AdSense'],
      ['c2', 'Artigos com 900+ palavras, seu próprio texto — nunca copiar, girar (spin) ou traduzir com IA sem revisão'],
      ['c3', 'Nicho claro e consistente (o Google premia autoridade temática)'],
      ['c4', 'Conteúdo proibido nunca: adulto, apostas, pirataria, armas, discurso de ódio, saúde/finanças com promessas milagrosas'],
      ['c5', 'Títulos honestos, sem clickbait enganoso (o AdSense mede sinais de navegação decepcionante)'],
      ['c6', 'Atualizar artigos antigos: fresco = relevante (adicione datas de atualização)'],
      ['c7', 'Cada artigo com imagem própria (gerada no AutoBlog) e alt text descritivo'],
    ],
  },
  {
    id: 'politicas', title: '📄 Páginas obrigatórias (AdSense + LGPD)', items: [
      ['p1', 'Página “Sobre / Sobre nós” com quem você é e a proposta do blog'],
      ['p2', 'Página “Contato” com e-mail válido ou formulário'],
      ['p3', '“Política de Privacidade” — OBRIGATÓRIA para o AdSense (declara uso de cookies e o funcionamento do AdSense)'],
      ['p4', '“Termos de Uso”'],
      ['p5', '“Disclaimer” — conteúdo meramente informativo; não é aconselhamento profissional (essencial em finanças/saúde)'],
      ['p6', 'Se usa link de afiliado: aviso de afiliado visível + política de cookies'],
      ['p7', 'Rodapé com links para Sobre, Contato, Privacidade e Termos em TODAS as páginas'],
    ],
  },
  {
    id: 'tec', title: '🔧 Técnico & Estrutura', items: [
      ['t1', 'HTTPS ativo e, idealmente, domínio próprio (blogspot.com próprio fica, mas .com.br/.com ranqueia melhor)'],
      ['t2', 'Navegação clara: menu, páginas de categoria/tags no ar, central buscável'],
      ['t3', 'Sitemap enviado ao Google Search Console (Blogger: /sitemap.xml · WordPress: /wp-sitemap.xml)'],
      ['t4', 'search console verificado e cobertura sem erros graves (site:seusite.com no Google)'],
      ['t5', 'robots.txt acessível (blogger/wp geram automaticamente) — não bloqueie / para rastreadores'],
      ['t6', 'Layout 100% responsivo (teste no PageSpeed Insights: nota 80+ em mobile)'],
      ['t7', 'Sem páginas quase vazias, links quebrados ou feeds de erro 404 em massa'],
      ['t8', 'Favicon/logo próprios e identidade visual consistente'],
      ['t9', 'Anúncios só DEPOIS de ser aprovado; se for testar layout, use o modo de visualização'],
    ],
  },
  {
    id: 'seo', title: '🔍 SEO on-page (o AutoBlog já faz, confira)', items: [
      ['s1', 'Título 30–65 caracteres com a palavra-chave perto do início'],
      ['s2', 'Meta description 120–165 caracteres com keyword e chamada à leitura'],
      ['s3', 'URL amigável (slug curto, hífens, keyword)'],
      ['s4', 'Um único H1 por post (o título) + hierarquia H2 → H3'],
      ['s5', 'Keyword no primeiro parágrafo e distribuída naturalmente (0,5–2,5%)'],
      ['s6', 'FAQ com schema FAQPage (o AutoBlog gera — aparece como rich snippet)'],
      ['s7', 'JSON-LD Article no <head> (cole o bloco gerado no tema ou use plugin no WP)'],
      ['s8', '2–5 referências confiáveis citadas (gov.br, .edu.br, Wikipedia, fontes primárias)'],
      ['s9', 'Links internos entre artigos do mesmo tema (cluster) + links externos nofollow para fontes'],
      ['s10', 'Imagens WebP/comprimidas, largura ≤ 1280px, loading="lazy"'],
    ],
  },
  {
    id: 'adsense', title: '💰 Google AdSense — aprovação e manutenção', items: [
      ['a1', 'Conta AdSense sem violações prévias (idade 18+, titularidade consistente)'],
      ['a2', 'Site no ar há pelo menos algumas semanas com tráfego orgânico recorrente'],
      ['a3', 'Domínio registrado em seu nome (ou ao menos sob seu controle DNS)'],
      ['a4', 'Anúncios posicionados de forma não enganosa — nunca perto de botões “Download”/“Comprar” imitando navegação'],
      ['a5', 'NUNCA clicar nos próprios anúncios, pedir cliques ou usar tráfego comprado/bots'],
      ['a6', 'Mais conteúdo do que anúncio na página (3–4 blocos por artigo longo no máximo)'],
      ['a7', 'Após aprovar: adicionar ads.txt no domínio (Blogger: Configurações → Monetização · WP: plugin ou raiz do site)'],
      ['a8', 'Acompanhar a aba “Mensagens” do AdSense — rejeições quase sempre vêm com o motivo (conteúdo insuficiente, navegação, políticas)'],
    ],
  },
];

export default function Checklist() {
  const [checked, setChecked] = useState({});
  useEffect(() => {
    try { setChecked(JSON.parse(localStorage.getItem('autoblog_checklist_v1') || '{}')); } catch {}
  }, []);
  function toggle(id) {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem('autoblog_checklist_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  }
  const all = SECTIONS.flatMap(s => s.items.map(i => i[0]));
  const done = all.filter(id => checked[id]).length;
  const pct = Math.round((done / all.length) * 100);

  return (
    <div>
      <h1 className="page-title">📋 Checklist AdSense & SEO</h1>
      <p className="page-sub">Tudo que o Google avalia antes de aprovar (e ranquear) seu blog. Seu progresso fica salvo neste navegador.</p>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <strong style={{ fontSize: 14 }}>Progresso geral</strong>
          <span style={{ fontSize: 13, color: pct >= 80 ? 'var(--green)' : 'var(--muted)' }}>{done}/{all.length} ({pct}%)</span>
        </div>
        <div className="progress"><div className="progress-bar" style={{ width: `${pct}%` }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <p className="f-hint" style={{ margin: 0 }}>{pct >= 80 ? '🎉 Você está pronto para solicitar a análise do AdSense e mirar a primeira página do Google.' : 'Complete tudo marcado principalmente em “Conteúdo” e “Políticas” — são os motivos nº 1 de rejeição.'}</p>
          <button className="btn btn-ghost btn-sm" onClick={() => { setChecked({}); try { localStorage.removeItem('autoblog_checklist_v1'); } catch {} }}>Zerar progresso</button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {SECTIONS.map(section => {
          const sDone = section.items.filter(([id]) => checked[id]).length;
          return (
            <div key={section.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                <h2 style={{ fontSize: 14.5 }}>{section.title}</h2>
                <span className={`badge ${sDone === section.items.length ? 'badge-ok' : 'badge-muted'}`}>{sDone}/{section.items.length}</span>
              </div>
              {section.items.map(([id, label]) => (
                <label key={id} className="check-row" style={{ marginBottom: 7, alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={!!checked[id]} onChange={() => toggle(id)} style={{ marginTop: 2 }} />
                  <span style={{ fontSize: 12.5, lineHeight: 1.5, color: checked[id] ? 'var(--muted)' : 'var(--text)', textDecoration: checked[id] ? 'line-through' : 'none' }}>{label}</span>
                </label>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
