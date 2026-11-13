'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeSeo, stripHtml } from '@/lib/seo';
import { assembleArticleHtml, stripScripts, buildJsonLd } from '@/lib/assemble';

function scoreClass(s) { return s >= 85 ? 'score-good' : s >= 60 ? 'score-mid' : 'score-bad'; }

export default function ArticleDetail({ params }) {
  const { id } = params;
  const router = useRouter();
  const [article, setArticle] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState('preview');
  const [editing, setEditing] = useState({ title: '', slug: '', meta: '', tags: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState('');
  const [includeJsonLd, setIncludeJsonLd] = useState({ blogger: false, wordpress: true });
  const [toast, setToast] = useState('');
  const [jsonLdOpen, setJsonLdOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/articles/${id}`).then(r => r.json().then(d => (r.ok ? setArticle(d) : setNotFound(true)))).catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    if (article) setEditing({
      title: article.title || '', slug: article.slug || '', meta: article.meta_description || '',
      tags: (article.tags || []).join(', '), content: article.content_html || '',
    });
  }, [article?.id]); // eslint-disable-line

  const seo = useMemo(() => article ? analyzeSeo({ ...article, title: editing.title, slug: editing.slug, meta_description: editing.meta, content_html: editing.content }) : null, [article, editing]);

  if (notFound) return <div className="notice notice-error">Artigo não encontrado. <a href="/artigos" style={{ color: 'inherit' }}>Voltar</a></div>;
  if (!article) return <p style={{ color: 'var(--muted)' }}>Carregando…</p>;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };
  const copy = async (text, label) => { try { await navigator.clipboard.writeText(String(text ?? '')); showToast(`${label || 'Copiado'} ✓`); } catch { showToast('Clipboard indisponível'); } };

  async function save() {
    setSaving(true);
    const next = {
      title: editing.title.trim(), slug: editing.slug.trim(), meta_description: editing.meta.trim(),
      tags: editing.tags.split(',').map(s => s.trim()).filter(Boolean),
      excerpt: editing.meta.trim().slice(0, 200),
      content_html: editing.content,
    };
    const report = analyzeSeo({ ...article, ...next, meta_description: next.meta_description });
    next.seo_score = report.score;
    next.seo_report = report;
    const res = await fetch(`/api/articles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
    const data = await res.json();
    if (res.ok) { setArticle(data); showToast('Salvo ✓ (score recalculado)'); } else showToast(`Erro: ${data.error}`);
    setSaving(false);
  }

  async function publish(target) {
    const label = target === 'blogger' ? 'Blogger' : 'WordPress';
    if (!confirm(`Enviar este artigo como RASCUNHO para o ${label}?\n\nNada será publicado — você revisa e publica no painel do ${label}.`)) return;
    setPublishing(target);
    try {
      const res = await fetch(`/api/publish/${target}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, includeJsonLd: includeJsonLd[target] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao publicar');
      setArticle(a => ({ ...a, status: target === 'blogger' ? 'published_blogger' : 'published_wordpress', published_urls: { ...(a.published_urls || {}), [target]: data.url || null } }));
      showToast(`✓ Rascunho criado no ${label}!`);
    } catch (e) {
      showToast(`Erro: ${e.message}`);
    } finally { setPublishing(''); }
  }

  async function remove() {
    if (!confirm('Excluir este artigo permanentemente?')) return;
    await fetch(`/api/articles/${id}`, { method: 'DELETE' });
    router.push('/artigos');
  }

  const htmlFull = assembleArticleHtml(article, { includeJsonLd: false });
  const jsonLd = article.json_ld || buildJsonLd(article);
  const score = article.seo_score ?? 0;
  const report = article.seo_report;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <a href="/artigos" style={{ color: 'var(--muted)', fontSize: 12, textDecoration: 'none' }}>← Meus artigos</a>
          <h1 className="page-title" style={{ fontSize: 21, marginTop: 6 }}>{article.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => copy(htmlFull, 'HTML completo')}>Copiar HTML</button>
          <button className="btn btn-red btn-sm" onClick={remove}>Excluir</button>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 18, alignItems: 'start' }}>
        {/* ===== Coluna principal: editor ===== */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[['preview', '👁️ Prévia'], ['edit', '✏️ Editar']].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} className={`btn btn-sm ${tab === k ? 'btn-primary' : 'btn-ghost'}`}>{l}</button>
              ))}
              <button className="btn btn-sm btn-green" onClick={save} disabled={saving} style={{ marginLeft: 'auto' }}>
                {saving ? 'Salvando…' : '💾 Salvar alterações'}
              </button>
            </div>

            {tab === 'edit' ? (
              <>
                <label className="f-label">Título</label>
                <input className="f-input" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
                <div className="f-hint">{editing.title.length} caracteres (ideal: 30–65)</div>
                <div className="f-row" style={{ marginTop: 4 }}>
                  <div>
                    <label className="f-label">Slug</label>
                    <input className="f-input mono" value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} />
                  </div>
                  <div>
                    <label className="f-label">Tags (vírgula)</label>
                    <input className="f-input" value={editing.tags} onChange={e => setEditing({ ...editing, tags: e.target.value })} />
                  </div>
                </div>
                <label className="f-label">Meta description</label>
                <textarea className="f-textarea" rows={2} value={editing.meta} onChange={e => setEditing({ ...editing, meta: e.target.value })} />
                <div className="f-hint">{editing.meta.length} caracteres (ideal: 120–165)</div>
                <label className="f-label">Conteúdo (HTML)</label>
                <textarea className="f-textarea mono" rows={18} value={editing.content} onChange={e => setEditing({ ...editing, content: e.target.value })} />
              </>
            ) : (
              <>
                {article.image_url && <img src={article.image_url} alt={article.keyword || article.title} style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 14 }} />}
                <div className="article-body" dangerouslySetInnerHTML={{ __html: stripScripts(article.content_html) }} />
                {!!(article.faq || []).length && (
                  <>
                    <h2 style={{ fontSize: 18, margin: '18px 0 8px' }}>Perguntas frequentes</h2>
                    {article.faq.map((f, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <strong style={{ fontSize: 13.5 }}>{f.question}</strong>
                        <p style={{ fontSize: 13, color: '#c9cddb', marginTop: 3 }}>{f.answer}</p>
                      </div>
                    ))}
                  </>
                )}
                {!!(article.references_json || []).length && (
                  <>
                    <h2 style={{ fontSize: 18, margin: '18px 0 8px' }}>Referências</h2>
                    <ol style={{ paddingLeft: 18, fontSize: 13, lineHeight: 1.9 }}>
                      {article.references_json.map((r, i) => (
                        <li key={i}><a href={r.url} target="_blank" rel="nofollow noopener" style={{ color: '#9d8fff' }}>{r.title || r.url}</a></li>
                      ))}
                    </ol>
                    <div className="notice notice-warn" style={{ marginTop: 10 }}>⚠️ <strong>Confira os links antes de publicar.</strong> A IA pode sugerir fontes genéricas — clique em cada uma e corrija o que não abrir.</div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* ===== Coluna lateral: SEO + publicação ===== */}
        <div>
          {/* Score */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 15 }}>🔎 Score SEO</h2>
              <span className={`score-pill ${scoreClass(score)}`} style={{ fontSize: 16 }}>{score}/100</span>
            </div>
            <div className="progress" style={{ margin: '10px 0 14px' }}><div className="progress-bar" style={{ width: `${score}%` }} /></div>
            {seo && (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {seo.checks.map(c => (
                  <div key={c.id} className="check-item">
                    <span className={`check-ico ${c.passed ? 'check-pass' : 'check-fail'}`}>{c.passed ? '✓' : '✕'}</span>
                    <span style={{ color: c.passed ? 'var(--text)' : 'var(--muted)' }}>{c.label}<div style={{ fontSize: 10, color: 'var(--muted)' }}>{c.detail}</div></span>
                    <span className="check-pts">{c.passed ? `+${c.points}` : '0'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Publicação */}
          <div className="card">
            <h2 style={{ fontSize: 15, marginBottom: 4 }}>🚀 Publicar como rascunho</h2>
            <p style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 12 }}>Você sempre revisa antes de ir ao ar — melhor para SEO e AdSense.</p>

            <label className="check-row" style={{ fontSize: 12, marginBottom: 10 }}>
              <input type="checkbox" checked={includeJsonLd.blogger} onChange={e => setIncludeJsonLd({ ...includeJsonLd, blogger: e.target.checked })} />
              Incluir JSON-LD no corpo (Blogger remove &lt;script&gt; — deixe desmarcado e use o bloco abaixo)
            </label>
            <button className="btn btn-amber" style={{ width: '100%', justifyContent: 'center' }} disabled={!!publishing} onClick={() => publish('blogger')}>
              {publishing === 'blogger' ? <span className="spinner" /> : '📤 Enviar para o Blogger (rascunho)'}
            </button>
            {article.published_urls?.blogger && <a href={article.published_urls.blogger} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: 11, marginTop: 6, color: '#fb923c' }}>↗ Abrir rascunho no Blogger</a>}

            <label className="check-row" style={{ fontSize: 12, margin: '14px 0 10px' }}>
              <input type="checkbox" checked={includeJsonLd.wordpress} onChange={e => setIncludeJsonLd({ ...includeJsonLd, wordpress: e.target.checked })} />
              Incluir JSON-LD no corpo (WordPress mantém — recomendado)
            </label>
            <button className="btn btn-green" style={{ width: '100%', justifyContent: 'center' }} disabled={!!publishing} onClick={() => publish('wordpress')}>
              {publishing === 'wordpress' ? <span className="spinner" /> : '📤 Enviar para o WordPress (rascunho)'}
            </button>
            {article.published_urls?.wordpress && <a href={`${String(article.published_urls.wordpress).split('?')[0]}?p=draft`} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: 11, marginTop: 6, color: '#38bdf8' }}>↗ Abrir rascunho no WordPress (preview: link direto do post)</a>}
          </div>

          {/* JSON-LD */}
          <div className="card">
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'space-between' }} onClick={() => setJsonLdOpen(o => !o)}>
              <span>🧩 JSON-LD (Article + FAQPage)</span><span>{jsonLdOpen ? '▲' : '▼'}</span>
            </button>
            {jsonLdOpen && (
              <>
                <pre className="code-block mono" style={{ marginTop: 10, maxHeight: 220, overflow: 'auto' }}>{JSON.stringify(jsonLd, null, 2)}</pre>
                <button className="copy-btn" style={{ marginTop: 8 }} onClick={() => copy(JSON.stringify(jsonLd, null, 2), 'JSON-LD')}>Copiar JSON-LD</button>
                <p className="f-hint" style={{ marginTop: 6 }}>Cole no &lt;head&gt; do seu tema ou use um plugin (ex.: WPCode no WordPress) para ativar os rich snippets.</p>
              </>
            )}
          </div>

          {/* Meta info */}
          <div className="card">
            <h2 style={{ fontSize: 14, marginBottom: 8 }}>📋 Ficha técnica</h2>
            <div className="kv"><span>Provedor</span><span>{article.provider || '—'} / {article.model || '—'}</span></div>
            <div className="kv"><span>Keyword</span><span>{article.keyword}</span></div>
            <div className="kv"><span>Palavras</span><span>{stripHtml(article.content_html).split(/\s+/).filter(Boolean).length}</span></div>
            <div className="kv"><span>Status</span><span>{article.status}</span></div>
            <div className="kv"><span>Criado</span><span>{new Date(article.created_at).toLocaleString('pt-BR')}</span></div>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
