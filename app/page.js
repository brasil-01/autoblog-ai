'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

function scoreClass(s) { return s >= 85 ? 'score-good' : s >= 60 ? 'score-mid' : 'score-bad'; }
function statusBadge(a) {
  if (a.status === 'published_blogger') return <span className="badge badge-blogger">Blogger ✓ rascunho</span>;
  if (a.status === 'published_wordpress') return <span className="badge badge-wordpress">WordPress ✓ rascunho</span>;
  return <span className="badge badge-draft">Rascunho local</span>;
}

export default function Dashboard() {
  const [articles, setArticles] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/articles')
      .then(r => r.json().then(d => (r.ok ? d : Promise.reject(new Error(d.error || 'Erro')))))
      .then(setArticles)
      .catch(e => setError(e.message));
  }, []);

  const total = articles?.length ?? 0;
  const drafts = articles?.filter(a => a.status === 'draft').length ?? 0;
  const published = total - drafts;
  const avg = total ? Math.round(articles.reduce((s, a) => s + (a.seo_score || 0), 0) / total) : 0;
  const recent = (articles || []).slice(0, 6);

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #1c1538 0%, #241d4e 50%, #171c29 100%)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '26px 28px', marginBottom: 22, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,.35), transparent 70%)' }} />
        <h1 className="page-title" style={{ fontSize: 26 }}>Transforme palavras-chave em <span style={{ color: '#b9aefc' }}>artigos prontos para ranquear</span> 🚀</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 8, maxWidth: 560, lineHeight: 1.6 }}>
          IA escreve o artigo completo com estrutura SEO, imagem destacada, FAQ com schema, referências confiáveis e meta tags — tudo salvo como rascunho para você revisar e publicar no Blogger ou WordPress.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <Link href="/gerar" className="btn btn-primary">⚡ Gerar meu primeiro artigo</Link>
          <Link href="/checklist" className="btn btn-ghost">📋 Checklist AdSense & SEO</Link>
        </div>
      </div>

      <div className="grid-stats">
        <div className="stat"><div className="stat-num">{total}</div><div className="stat-label">Artigos no banco</div></div>
        <div className="stat"><div className="stat-num" style={{ color: 'var(--amber)' }}>{drafts}</div><div className="stat-label">Aguardando revisão</div></div>
        <div className="stat"><div className="stat-num" style={{ color: 'var(--green)' }}>{published}</div><div className="stat-label">Enviados aos blogs</div></div>
        <div className="stat"><div className="stat-num" style={{ color: avg >= 70 ? 'var(--green)' : 'var(--amber)' }}>{avg}</div><div className="stat-label">Score SEO médio</div></div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16 }}>Artigos recentes</h2>
          <Link href="/artigos" className="btn btn-ghost btn-sm">Ver todos →</Link>
        </div>
        {error && <div className="notice notice-error">{error}</div>}
        {!articles && !error && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Carregando…</p>}
        {articles && recent.length === 0 && (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📝</div>
            <p style={{ fontWeight: 700, marginBottom: 6 }}>Nenhum artigo ainda</p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>Gere seu primeiro artigo em menos de 1 minuto.</p>
            <Link href="/gerar" className="btn btn-primary">⚡ Gerar artigo</Link>
          </div>
        )}
        {recent.length > 0 && (
          <table className="table">
            <thead><tr><th>Título</th><th>Score</th><th>Status</th><th>Data</th></tr></thead>
            <tbody>
              {recent.map(a => (
                <tr key={a.id}>
                  <td><Link href={`/artigos/${a.id}`}>{a.title}</Link><div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{a.keyword}</div></td>
                  <td><span className={`score-pill ${scoreClass(a.seo_score || 0)}`}>{a.seo_score ?? '–'}</span></td>
                  <td>{statusBadge(a)}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(a.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="notice notice-info" style={{ marginTop: 18 }}>
        💡 <strong>Como funciona:</strong> 1) Você digita o tópico · 2) A IA escreve tudo (título, meta, texto, FAQ, referências) · 3) O AutoBlog analisa o SEO de 0 a 100 · 4) Você revisa o rascunho · 5) Publica como <strong>rascunho</strong> no Blogger/WordPress · 6) Revisa no blog e clica em publicar. Nada vai ao ar sem a sua revisão — essencial para o AdSense.
      </div>
    </div>
  );
}
