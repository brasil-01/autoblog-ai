'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { stripScripts } from '@/lib/assemble';

const TONES = [
  ['informativo', 'Informativo (padrão)'],
  ['tutorial', 'Tutorial passo a passo'],
  ['comparativo', 'Comparativo / "Melhor X vs Y"'],
  ['lista', 'Lista ("10 melhores…")'],
  ['opiniao', 'Opinião de especialista'],
];
const SIZES = [
  [900, '~900 palavras (rápido)'],
  [1200, '~1.200 palavras (recomendado)'],
  [1800, '~1.800 palavras (artigo completo)'],
  [2500, '~2.500 palavras (guia definitivo)'],
];
const LOADING_STEPS = [
  'Pesquisando a intenção de busca…',
  'Estruturando título, slug e meta description…',
  'Escrevendo o conteúdo com a palavra-chave…',
  'Criando o FAQ com schema.org…',
  'Verificando densidade e posicionamento da keyword…',
  'Gerando a imagem destacada…',
  'Calculando seu Score SEO (0–100)…',
];

function gaugeColor(s) { return s >= 85 ? 'var(--green)' : s >= 60 ? 'var(--amber)' : 'var(--red)'; }

function CopyChip({ text, label = 'copiar' }) {
  const [copied, setCopied] = useState(false);
  return (
    <button className="copy-btn" onClick={async () => {
      try { await navigator.clipboard.writeText(String(text || '')); } catch { /* clipboard indisponível */ }
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    }}>{copied ? '✓ copiado' : label}</button>
  );
}

export default function GerarPage() {
  const [form, setForm] = useState({
    topic: '', keyword: '', niche: '', tone: 'informativo', wordCount: 1200,
    provider: 'gemini', model: '', includeFaq: true, imageSource: 'auto',
  });
  const [providers, setProviders] = useState([]);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const resultRef = useRef(null);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s?.providers) setProviders(s.providers);
      setForm(f => ({ ...f, provider: s?.values?.default_provider || 'gemini', model: s?.values?.default_model || '' }));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setStep(s => (s + 1) % LOADING_STEPS.length), 3200);
    return () => clearInterval(t);
  }, [busy]);

  const selectedProvider = providers.find(p => p.id === form.provider);
  const modelOptions = selectedProvider?.models || [];

  async function submit(e) {
    e.preventDefault();
    if (!form.topic.trim()) return;
    setBusy(true); setError(''); setResult(null); setStep(0);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, keyword: form.keyword || form.topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar');
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const article = result?.article;
  const seo = result?.seo || article?.seo_report;
  const score = article?.seo_score ?? seo?.score ?? 0;
  const C = 2 * Math.PI * 40;

  return (
    <div>
      <h1 className="page-title">⚡ Gerar Artigo com IA</h1>
      <p className="page-sub">Digite o tópico e receba o artigo completo, otimizado para Google e AdSense — salvo como rascunho.</p>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* ===== Formulário ===== */}
        <form onSubmit={submit} className="card">
          <label className="f-label">Tópico ou palavra-chave *</label>
          <input className="f-input" placeholder="ex.: como escolher notebook para programador" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} autoFocus />
          <div className="f-hint">Funciona melhor com termos de cauda longa (3+ palavras), ex.: “melhor notebook até 4000 reais para home office”.</div>

          <label className="f-label">Palavra-chave principal (opcional)</label>
          <input className="f-input" placeholder="padrão: o mesmo tópico acima" value={form.keyword} onChange={e => setForm({ ...form, keyword: e.target.value })} />

          <div className="f-row">
            <div>
              <label className="f-label">Nicho / segmento</label>
              <input className="f-input" placeholder="ex.: tecnologia, finanças, saúde…" value={form.niche} onChange={e => setForm({ ...form, niche: e.target.value })} />
            </div>
            <div>
              <label className="f-label">Tom de voz</label>
              <select className="f-select" value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value })}>
                {TONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="f-row">
            <div>
              <label className="f-label">Tamanho</label>
              <select className="f-select" value={form.wordCount} onChange={e => setForm({ ...form, wordCount: Number(e.target.value) })}>
                {SIZES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="f-label">Imagem destacada</label>
              <select className="f-select" value={form.imageSource} onChange={e => setForm({ ...form, imageSource: e.target.value })}>
                <option value="auto">Automático (Pexels → IA grátis)</option>
                <option value="pexels">Fotos reais (Pexels — precisa de chave)</option>
                <option value="pollinations">Ilustração IA (Pollinations — grátis)</option>
              </select>
            </div>
          </div>

          <div className="f-row">
            <div>
              <label className="f-label">Provedor de IA</label>
              <select className="f-select" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value, model: '' })}>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.label}{p.configured ? ' ✓' : ' (sem chave)'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="f-label">Modelo</label>
              <select className="f-select" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}>
                <option value="">Padrão{selectedProvider?.defaultModel ? ` (${selectedProvider.defaultModel})` : ''}</option>
                {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <label className="check-row" style={{ marginTop: 16 }}>
            <input type="checkbox" checked={form.includeFaq} onChange={e => setForm({ ...form, includeFaq: e.target.checked })} />
            Incluir FAQ com schema FAQPage (ricos snippets no Google)
          </label>

          {error && <div className="notice notice-error" style={{ marginTop: 14 }}>{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={busy || !form.topic.trim()} style={{ width: '100%', justifyContent: 'center', marginTop: 16, padding: '14px 18px', fontSize: 14 }}>
            {busy ? <><span className="spinner" /> Gerando artigo…</> : '⚡ Gerar artigo agora'}
          </button>
          <p className="f-hint" style={{ textAlign: 'center', marginTop: 8 }}>O conteúdo fica salvo como <strong>rascunho</strong> — nada vai ao ar até você revisar.</p>
        </form>

        {/* ===== Resultado ===== */}
        <div ref={resultRef}>
          {busy && (
            <div className="card" style={{ textAlign: 'center', padding: '52px 30px' }}>
              <div style={{ fontSize: 46, marginBottom: 16 }}>🤖</div>
              <div className="spinner" style={{ width: 30, height: 30, borderWidth: 3 }} />
              <p style={{ marginTop: 18, fontWeight: 700 }}>{LOADING_STEPS[step]}</p>
              <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>Um artigo completo leva de 20 a 60 segundos.</p>
            </div>
          )}

          {!busy && !article && (
            <div className="card">
              <h2 style={{ fontSize: 16, marginBottom: 14 }}>🎯 Como escolher temas que ranqueiam</h2>
              <ul style={{ paddingLeft: 18, fontSize: 13.5, lineHeight: 2, color: '#c9cddb' }}>
                <li><strong>Cauda longa:</strong> “como terminar uma planilha do zero” &gt; “planilhas”.</li>
                <li>Olhe <strong>“Pesquisas relacionadas”</strong> e o “As pessoas também perguntam” no Google.</li>
                <li>Use o <strong>Google Trends</strong> para validar volume no Brasil.</li>
                <li>Espie concorrentes no top 3 e faça artigos <strong>melhores e mais completos</strong>.</li>
                <li>Um nicho, muitos clusters: cubra um assunto por vez para autoridade (E-E-A-T).</li>
              </ul>
              <hr className="divider" />
              <div className="notice notice-info">Todo artigo gerado passa por <strong>13 verificações de SEO</strong> com nota de 0 a 100 antes de ir para o seu banco de dados.</div>
            </div>
          )}

          {article && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <span className="badge badge-draft">Salvo como rascunho ✓</span>
                  <h2 style={{ fontSize: 18, marginTop: 10, lineHeight: 1.35 }}>{article.title}</h2>
                </div>
                <svg className="gauge" width="96" height="96" viewBox="0 0 96 96">
                  <circle className="gauge-bg" strokeWidth="9" fill="none" r="40" cx="48" cy="48" />
                  <circle className="gauge-val" stroke={gaugeColor(score)} strokeWidth="9" fill="none" strokeLinecap="round" r="40" cx="48" cy="48"
                    strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} />
                  <text x="48" y="45" textAnchor="middle" className="gauge-num" style={{ fontSize: 26 }}>{score}</text>
                  <text x="48" y="62" textAnchor="middle" style={{ fill: 'var(--muted)', fontSize: 9 }}>SEO / 100</text>
                </svg>
              </div>

              <div className="kv" style={{ marginTop: 14 }}><span>Slug</span><span className="mono">{article.slug} <CopyChip text={article.slug} /></span></div>
              <div className="kv"><span>Meta description</span><span className="mono" style={{ maxWidth: 320, textAlign: 'right' }}>{article.meta_description} <CopyChip text={article.meta_description} /></span></div>
              <div className="kv"><span>Palavras</span><span>{seo?.wordCount ?? '—'} · {seo?.grade}</span></div>
              <div className="kv"><span>Densidade da keyword</span><span>{seo?.density ?? 0}% ({seo?.h2 ?? 0} H2 · {seo?.h3 ?? 0} H3)</span></div>

              {article.image_url && (
                <img src={article.image_url} alt={article.keyword || article.title} style={{ width: '100%', borderRadius: 12, margin: '14px 0', border: '1px solid var(--border)' }} />
              )}

              <div className="article-body" style={{ maxHeight: 360, overflowY: 'auto', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginTop: 6 }}
                dangerouslySetInnerHTML={{ __html: stripScripts(article.content_html) }} />

              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <Link href={`/artigos/${article.id}`} className="btn btn-primary">Abrir artigo & publicar →</Link>
                <button className="btn btn-ghost" onClick={() => { setResult(null); setForm(f => ({ ...f, topic: '', keyword: '' })); }}>Gerar outro</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
